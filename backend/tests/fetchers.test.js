import { BaseFetcher } from '../src/fetchers/base.js';
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
