import { BaseFetcher } from '../src/fetchers/base.js';
import { browserPool } from '../src/fetchers/browser-pool.js';
import { buildEbayTokenRequest, EbayConfigError } from '../src/fetchers/ebay-auth.js';
import { buildEbaySearchUrl, fetchEbay, mapEbayItemSummary } from '../src/fetchers/ebay.js';
import { VintedFetcher, extractVintedExternalId, selectUnseenVintedItems, selectUnseenVintedUrls, summarizeVintedPrefilter } from '../src/fetchers/vinted.js';

describe('Fetchers', () => {
  describe('BaseFetcher', () => {
    let fetcher;

    beforeEach(() => {
      fetcher = new BaseFetcher('test');
    });

    it('should initialize with source name', () => {
      expect(fetcher.source).toBe('test');
    });

    it('should throw error if fetch not implemented', async () => {
      await expect(fetcher.fetch('test')).rejects.toThrow('fetch() must be implemented');
    });

    it('keeps Vinted headless and Leboncoin headful by default', () => {
      expect(browserPool.getLaunchOptions('vinted').headless).toBe(true);
      expect(browserPool.getLaunchOptions('leboncoin').headless).toBe(false);
      expect(browserPool.getPoolKey('vinted')).toBe('vinted:headless');
      expect(browserPool.getPoolKey('leboncoin')).toBe('leboncoin:headful');
    });
  });

  describe('eBay Browse API', () => {
    it('builds OAuth client credentials request without logging secrets', () => {
      const request = buildEbayTokenRequest({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        scope: 'scope-a',
        env: 'sandbox',
      });

      expect(request.url).toBe('https://api.sandbox.ebay.com/identity/v1/oauth2/token');
      expect(request.init.method).toBe('POST');
      expect(request.init.headers.Authorization).toMatch(/^Basic /);
      expect(String(request.init.body)).toContain('grant_type=client_credentials');
      expect(String(request.init.body)).toContain('scope=scope-a');
    });

    it('fails fast when eBay credentials are missing', () => {
      expect(() => buildEbayTokenRequest({ clientId: '', clientSecret: '' })).toThrow(EbayConfigError);
    });

    it('builds Browse API search URL with budget filters', () => {
      const url = new URL(buildEbaySearchUrl('lot pokemon jungle', {
        accessToken: 'token',
        maxResults: 5,
        budget: { min: 20, max: 1500 },
        env: 'production',
      }));

      expect(url.origin).toBe('https://api.ebay.com');
      expect(url.pathname).toBe('/buy/browse/v1/item_summary/search');
      expect(url.searchParams.get('q')).toBe('lot pokemon jungle');
      expect(url.searchParams.get('limit')).toBe('5');
      expect(url.searchParams.get('offset')).toBeNull();
      expect(url.searchParams.get('filter')).toContain('price:[20..1500]');
      expect(url.searchParams.get('filter')).toContain('priceCurrency:EUR');
    });

    it('builds Browse API search URL with pagination offset', () => {
      const url = new URL(buildEbaySearchUrl('lot pokemon jungle', {
        accessToken: 'token',
        maxResults: 20,
        offset: 40,
        env: 'production',
      }));

      expect(url.searchParams.get('limit')).toBe('20');
      expect(url.searchParams.get('offset')).toBe('40');
    });

    it('maps eBay item summaries to internal listing contract', () => {
      const listing = mapEbayItemSummary({
        itemId: 'v1|123|0',
        title: 'Lot cartes Pokémon Wizards FR',
        price: { value: '100.00', currency: 'EUR' },
        shippingOptions: [{ shippingCost: { value: '5.50', currency: 'EUR' } }],
        itemWebUrl: 'https://www.ebay.fr/itm/123',
        image: { imageUrl: 'https://img.example/item.jpg' },
        itemLocation: { city: 'Nice', country: 'FR' },
        seller: { username: 'seller123' },
      });

      expect(listing).toMatchObject({
        source: 'ebay',
        external_id: 'v1|123|0',
        title: 'Lot cartes Pokémon Wizards FR',
        price: 105.5,
        image_url: 'https://img.example/item.jpg',
        location: 'Nice, FR',
      });
    });

    it('follows eBay Browse pagination until scanDepth or next exhaustion', async () => {
      const searchOffsets = [];
      const makeItem = (id) => ({
        itemId: `item-${id}`,
        title: `Lot Pokémon page item ${id}`,
        price: { value: String(20 + id), currency: 'EUR' },
        itemWebUrl: `https://www.ebay.fr/itm/item-${id}`,
      });
      const fetchImpl = async (url, request) => {
        if (String(url).includes('/identity/v1/oauth2/token')) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ access_token: 'mock-token', expires_in: 7200 }),
          };
        }

        expect(request.headers.Authorization).toBe('Bearer mock-token');
        const parsedUrl = new URL(String(url));
        const offset = Number(parsedUrl.searchParams.get('offset') || 0);
        searchOffsets.push(offset);
        const nextOffset = offset + 2;
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            total: 5,
            href: String(url),
            next: nextOffset < 5 ? `https://api.ebay.com/buy/browse/v1/item_summary/search?q=pokemon&limit=2&offset=${nextOffset}` : undefined,
            itemSummaries: offset === 0
              ? [makeItem(1), makeItem(2)]
              : offset === 2
                ? [makeItem(3), makeItem(4)]
                : [makeItem(5)],
          }),
        };
      };

      const listings = await fetchEbay('pokemon jungle', {
        fetchImpl,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        marketplaceId: 'EBAY_FR',
        maxResults: 2,
        scanDepth: 5,
        maxScrollPasses: 5,
      });

      expect(searchOffsets).toEqual([0, 2, 4]);
      expect(listings).toHaveLength(5);
      expect(listings.prefilter_summary.scanned).toBe(5);
      expect(listings.ebay_api.pages_fetched).toBe(3);
      expect(listings.ebay_api.scan_depth).toBe(5);
      expect(listings.ebay_api.pagination_exhausted).toBe(true);
    });

    it('fetches eBay listings with mocked OAuth and Browse API calls', async () => {
      const fetchImpl = async (url, request) => {
        if (String(url).includes('/identity/v1/oauth2/token')) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ access_token: 'mock-token', expires_in: 7200 }),
          };
        }

        expect(request.headers.Authorization).toBe('Bearer mock-token');
        expect(request.headers['X-EBAY-C-MARKETPLACE-ID']).toBe('EBAY_FR');
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            total: 2,
            itemSummaries: [
              { itemId: 'seen-1', title: 'Déjà vue', price: { value: '10', currency: 'EUR' }, itemWebUrl: 'https://www.ebay.fr/itm/seen-1' },
              { itemId: 'new-2', title: 'Lot Pokémon Jungle', price: { value: '80', currency: 'EUR' }, itemWebUrl: 'https://www.ebay.fr/itm/new-2' },
            ],
          }),
        };
      };

      const listings = await fetchEbay('pokemon jungle', {
        fetchImpl,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        marketplaceId: 'EBAY_FR',
        excludeExternalIds: ['seen-1'],
        maxResults: 2,
      });

      expect(listings).toHaveLength(1);
      expect(listings[0].external_id).toBe('new-2');
      expect(listings.prefilter_summary.already_seen).toBe(1);
      expect(listings.ebay_api.mode).toBe('browse_api');
    });
  });

  describe('Vinted smart selection', () => {
    it('builds search URLs on catalog route instead of clothing route', () => {
      const fetcher = new VintedFetcher();
      const url = fetcher.buildSearchUrl('lot pokemon dracaufeu obscur');

      expect(url).toContain('/catalog?search_text=');
      expect(url).not.toContain('/vetements?search_text=');
      expect(url).toContain('order=newest_first');
    });

    it('adds Vinted price range filters to search URL when provided', () => {
      const fetcher = new VintedFetcher();
      const url = new URL(fetcher.buildSearchUrl('lot pokemon jungle', {
        budget: { min: 50, max: 300 },
      }));

      expect(url.searchParams.get('search_text')).toBe('lot pokemon jungle');
      expect(url.searchParams.get('price_from')).toBe('50');
      expect(url.searchParams.get('price_to')).toBe('300');
      expect(url.searchParams.get('order')).toBe('newest_first');
    });

    it('keeps Vinted price range with alias payloads and configurable order', () => {
      const fetcher = new VintedFetcher();
      const url = new URL(fetcher.buildSearchUrl('pokemon wizards', {
        min_price: 25,
        max_price: 150,
        order: 'price_low_to_high',
      }));

      expect(url.searchParams.get('price_from')).toBe('25');
      expect(url.searchParams.get('price_to')).toBe('150');
      expect(url.searchParams.get('order')).toBe('price_low_to_high');
    });

    it('extracts Vinted external ids from item URLs', () => {
      expect(extractVintedExternalId('https://www.vinted.fr/items/123456-pokemon-team-rocket')).toBe('123456');
      expect(extractVintedExternalId('https://www.vinted.fr/items/987654')).toBe('987654');
      expect(extractVintedExternalId('https://www.vinted.fr/catalog')).toBeNull();
    });

    it('skips already seen Vinted URLs before detail scraping', () => {
      const urls = [
        'https://www.vinted.fr/items/111-old-seen',
        'https://www.vinted.fr/items/222-new-one',
        'https://www.vinted.fr/items/333-new-two',
      ];

      const selected = selectUnseenVintedUrls(urls, {
        excludeExternalIds: new Set(['111']),
        maxResults: 2,
      });

      expect(selected).toEqual([
        'https://www.vinted.fr/items/222-new-one',
        'https://www.vinted.fr/items/333-new-two',
      ]);
    });

    it('can rescue matching already-seen listings when a targeted scan would otherwise select too little', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/901-lot-cartes-pokemon-team-rocket',
          text: 'Lot cartes Pokémon Team Rocket françaises',
        },
        {
          url: 'https://www.vinted.fr/items/902-lot-cartes-pokemon-anciennes',
          text: 'Lot cartes Pokémon anciennes Wizards FR',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        excludeExternalIds: new Set(['901', '902']),
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon team rocket',
        maxResults: 2,
        rescueSeenWhenBelow: 2,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/901-lot-cartes-pokemon-team-rocket',
        'https://www.vinted.fr/items/902-lot-cartes-pokemon-anciennes',
      ]);
      expect(selected.every(item => item.prefilter_reason === 'seen_rescue')).toBe(true);
    });

    it('prefilters off-series Vinted cards before opening detail pages', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/101-one-piece-card-game-pillars-of-strength-eustass-captain-kid-op01-051-english',
          text: 'One Piece Card Game- Pillars Of Strength- Eustass Captain Kid OP01-051 English',
        },
        {
          url: 'https://www.vinted.fr/items/102-regice-24-98-fr-excellent',
          text: 'Regice 24/98 – FR – Excellent+',
        },
        {
          url: 'https://www.vinted.fr/items/103-evoli-reverse-54-78-fr-mint',
          text: 'Évoli reverse 54/78 – FR – Mint !',
        },
        {
          url: 'https://www.vinted.fr/items/104-feurisson-obscur-39-105-wizards-neo-destiny-2002',
          text: 'Carte Pokémon Feurisson obscur 39/105 - Wizards Neo Destiny 2002',
        },
        {
          url: 'https://www.vinted.fr/items/105-dracolosse-obscur-edition-1-22-82',
          text: 'Dracolosse Obscur Edition 1 22/82 Team Rocket Français',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'rocket',
        maxResults: 10,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/105-dracolosse-obscur-edition-1-22-82',
      ]);
    });

    it('rejects obvious foreign-language Vinted grid items before opening details', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/106-dark-dragonite-team-rocket-english',
          text: 'Dark Dragonite Team Rocket 22/82 English card',
        },
        {
          url: 'https://www.vinted.fr/items/107-dracolosse-obscur-team-rocket-japonais',
          text: 'Dracolosse Obscur Team Rocket japonais holo',
        },
        {
          url: 'https://www.vinted.fr/items/108-dracolosse-obscur-team-rocket-francais',
          text: 'Dracolosse Obscur Team Rocket Français 22/82',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'rocket',
        maxResults: 10,
      });
      const summary = summarizeVintedPrefilter(items, {
        targetSeries: 'rocket',
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/108-dracolosse-obscur-team-rocket-francais',
      ]);
      expect(summary.foreign_language).toBe(2);
    });

    it('relaxes grid prefilter for Jungle because Vinted often hides series names before detail pages', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/201-carte-pokemon-nidoran-edition-1-wizards',
          text: 'Carte Pokémon Nidoran édition 1 Wizards FR',
        },
        {
          url: 'https://www.vinted.fr/items/202-scarabrute-9-64-jungle-fr',
          text: 'Scarabrute 9/64 holo français',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'jungle',
        maxResults: 2,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/202-scarabrute-9-64-jungle-fr',
      ]);
    });

    it('opens only target-looking Jungle candidates and never blind fallback items', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/301-carte-pokemon-wizards-fr-edition-1',
          text: 'Carte Pokémon Wizards FR édition 1 bon état',
        },
        {
          url: 'https://www.vinted.fr/items/302-lot-cartes-pokemon-anciennes-fr',
          text: 'Lot cartes Pokémon anciennes françaises',
        },
        {
          url: 'https://www.vinted.fr/items/303-ronflex-11-64-jungle-fr',
          text: 'Ronflex 11/64 holo français',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'jungle',
        maxResults: 3,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/303-ronflex-11-64-jungle-fr',
      ]);
      expect(selected.some(item => item.prefilter_relaxed)).toBe(false);
    });

    it('does not open Diamant & Perle cards during a Jungle hunt', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/401-simiabraz-5-130-reverse-rare-dp01-fr',
          text: 'Carte Pokémon Simiabraz 5/130 Reverse Rare DP01 Set Diamant & Perle FR - 5€',
        },
        {
          url: 'https://www.vinted.fr/items/402-pingoleon-4-130-holo-dp01-fr',
          text: 'Carte Pokémon Pingoleon 4/130 Holo Rare DP01 Set Diamant & Perle FR - 5€',
        },
        {
          url: 'https://www.vinted.fr/items/403-abra-69-123-dp02-fr',
          text: 'Carte Pokémon Abra 69/123 Commune DP02 Diamant & Perle Set Trésors Mystérieux FR - 2€',
        },
        {
          url: 'https://www.vinted.fr/items/404-scarabrute-9-64-jungle-fr',
          text: 'Scarabrute 9/64 Jungle holo français',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'jungle',
        maxResults: 10,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/404-scarabrute-9-64-jungle-fr',
      ]);
    });

    it('strictly opens only Jungle lot-looking grid items when lot type is selected', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/501-scarabrute-9-64-jungle-fr',
          text: 'Scarabrute 9/64 Jungle holo français carte seule',
        },
        {
          url: 'https://www.vinted.fr/items/502-lot-cartes-jungle-fr',
          text: 'Lot 24 cartes Pokémon Jungle Wizards FR avec Scarabrute 9/64',
        },
        {
          url: 'https://www.vinted.fr/items/503-lot-dp-fr',
          text: 'Lot 50 cartes Pokémon Diamant & Perle DP01 FR',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'jungle',
        listingType: 'lot',
        maxResults: 10,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/502-lot-cartes-jungle-fr',
      ]);
    });

    it('opens lot-looking candidates from strong Team Rocket queries even when Vinted grid hides Rocket terms', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/601-carte-dracolosse-obscur',
          text: 'Dracolosse obscur 22/82 carte seule excellent état',
        },
        {
          url: 'https://www.vinted.fr/items/602-lot-cartes-pokemon-anciennes',
          text: 'Lot 40 cartes Pokémon anciennes Wizards FR bon état',
        },
        {
          url: 'https://www.vinted.fr/items/603-lot-cartes-dp',
          text: 'Lot 40 cartes Pokémon Diamant & Perle DP01 FR',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon dracolosse obscur',
        maxResults: 10,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/602-lot-cartes-pokemon-anciennes',
      ]);
      expect(selected[0].prefilter_reason).toBe('trusted_query_lot_candidate');
    });

    it('rejects Vinted promoted wardrobe/showcase slots before detail scraping', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/821-vitrine-vendeur-chaussures',
          text: 'Dressing en vitrine Sponsorisé Découvre les articles de ce membre',
        },
        {
          url: 'https://www.vinted.fr/items/822-lot-cartes-pokemon-team-rocket',
          text: 'Lot cartes Pokémon Team Rocket Wizards FR - 120 €',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon team rocket',
        maxResults: 10,
      });
      const summary = summarizeVintedPrefilter(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon team rocket',
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/822-lot-cartes-pokemon-team-rocket',
      ]);
      expect(summary).toMatchObject({ selected: 1, promoted_listing: 1 });
    });

    it('never opens Vinted clothing lots such as shorts during Pokemon lot hunts', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/801-lot-de-shorts-nike-adidas',
          text: 'Lot de shorts Nike Adidas taille M vêtements homme été',
        },
        {
          url: 'https://www.vinted.fr/items/802-lot-cartes-pokemon-anciennes',
          text: 'Lot 40 cartes Pokémon anciennes Wizards FR bon état',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon dracolosse obscur',
        maxResults: 10,
      });
      const summary = summarizeVintedPrefilter(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon dracolosse obscur',
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/802-lot-cartes-pokemon-anciennes',
      ]);
      expect(summary).toMatchObject({ selected: 1, non_pokemon_domain: 1 });
    });

    it('does not trust strong Rocket query fallback for non-Pokemon lot URLs or grid text', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/811-lot-shorts-homme',
          text: 'Lot shorts homme sport collection été',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon team rocket',
        maxResults: 10,
      });

      expect(selected).toEqual([]);
      expect(summarizeVintedPrefilter(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon team rocket',
      })).toMatchObject({ selected: 0, non_pokemon_domain: 1 });
    });

    it('rejects non-Pokemon trading cards even when grid text contains generic card terms', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/901-batman-trading-cards-1989-second-series',
          text: '133 cartes 1989 Second Series DC Comics Batman Trading Cards',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'all',
        listingType: 'all',
        query: 'lot pokemon dracaufeu obscur',
        maxResults: 10,
      });

      expect(selected).toEqual([]);
      expect(summarizeVintedPrefilter(items, {
        targetSeries: 'all',
        listingType: 'all',
        query: 'lot pokemon dracaufeu obscur',
      })).toMatchObject({ selected: 0, non_pokemon_domain: 1 });
    });

    it('keeps a selected Vinted listing even if the detail page cannot be parsed', () => {
      const fallback = {
        url: 'https://www.vinted.fr/items/5933355587-lot-carte-pokemon-team-rocket-wizards',
        text: 'Lot carte Pokemon Team Rocket Wizards FR - 120 €',
      };

      const selected = selectUnseenVintedItems([fallback], {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot pokemon team rocket wizards',
        maxResults: 10,
      });

      expect(selected).toHaveLength(1);
      expect(selected[0]).toMatchObject({
        url: fallback.url,
        prefilter_reason: 'series_grid_match',
      });
    });

    it('summarizes Vinted prefilter rejection reasons for zero-result diagnosis', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/701-single-rocket-card',
          text: 'Dracolosse obscur carte seule',
        },
        {
          url: 'https://www.vinted.fr/items/702-modern-lot',
          text: 'Lot 40 cartes Pokémon Diamant & Perle DP01 FR',
        },
        {
          url: 'https://www.vinted.fr/items/703-random-card',
          text: 'Carte Pokémon ancienne Wizards FR',
        },
      ];

      const summary = summarizeVintedPrefilter(items, {
        targetSeries: 'rocket',
        listingType: 'lot',
        query: 'lot dracolosse obscur',
      });

      expect(summary).toMatchObject({
        selected: 0,
        listing_type_mismatch: 2,
        off_target_modern: 1,
      });
    });
  });

  // TODO: Add integration tests with actual fetchers
  // These would require mocking browser or using real browser in CI
});
