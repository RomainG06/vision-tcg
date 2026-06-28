import { describe, expect, test } from '@jest/globals';
import {
  applyCardmarketEstimateToListing,
  buildCardmarketCacheKey,
  buildCardmarketOAuthHeader,
  buildCardmarketSearchQuery,
  buildCardmarketUrl,
  enrichListingWithCardmarketPrice,
  extractCardmarketHints,
  findCardmarketProducts,
  getCardmarketProduct,
  selectBestCardmarketProduct,
  summarizeCardmarketProduct,
} from '../src/services/cardmarket-price-info.js';

const credentials = {
  consumerKey: 'consumer-key',
  consumerSecret: 'consumer-secret',
  accessToken: 'access-token',
  accessTokenSecret: 'access-token-secret',
  nonce: 'nonce-123',
  timestamp: 1234567890,
};

const kabutoListing = {
  title: 'KABUTO 50/62 Fossil 1ED Wizards 2000 FR NEAR MINT',
  price: 5,
};

const productSearchPayload = {
  product: [
    {
      idProduct: 111,
      enName: 'Kabuto',
      gameName: 'Pokemon',
      expansionName: 'Fossil',
      number: '50',
      localization: [{ idLanguage: 2, languageName: 'French', productName: 'Kabuto' }],
    },
    {
      idProduct: 222,
      enName: 'Kabuto',
      gameName: 'Pokemon',
      expansionName: 'Mystery Set',
      number: '12',
    },
  ],
};

const detailedProductPayload = {
  product: {
    idProduct: 111,
    enName: 'Kabuto',
    website: '/fr/Pokemon/Products/Singles/Fossil/Kabuto',
    gameName: 'Pokemon',
    expansionName: 'Fossil',
    number: '50',
    priceGuide: {
      SELL: 8.2,
      LOW: 2.5,
      LOWEX: 6.4,
      AVG: 9.1,
      TREND: 8.8,
    },
  },
};

describe('cardmarket price info', () => {
  test('builds Cardmarket URLs and OAuth header without exposing secrets', () => {
    const url = buildCardmarketUrl('/products/find', {
      search: 'Kabuto',
      idGame: 6,
      idLanguage: 2,
    }, { baseUrl: 'https://api.cardmarket.com/ws/v2.0' });

    expect(url).toBe('https://api.cardmarket.com/ws/v2.0/products/find?search=Kabuto&idGame=6&idLanguage=2');

    const header = buildCardmarketOAuthHeader('GET', url, credentials);
    expect(header).toContain('oauth_consumer_key="consumer-key"');
    expect(header).toContain('oauth_token="access-token"');
    expect(header).toContain('oauth_signature=');
    expect(header).not.toContain('consumer-secret');
    expect(header).not.toContain('access-token-secret');
  });

  test('extracts card hints and a compact search/cache key', () => {
    expect(extractCardmarketHints(kabutoListing)).toMatchObject({
      card_name_key: 'kabuto',
      card_name_label: 'Kabuto',
      language: 'fr',
      language_id: 2,
      number: '50/62',
      numberPrefix: '50',
      expansion_key: 'fossil',
      edition: '1ed',
      first_edition: true,
      condition: { key: 'near_mint', label: 'NM' },
    });
    expect(buildCardmarketSearchQuery(kabutoListing)).toBe('Kabuto');
    expect(buildCardmarketCacheKey(kabutoListing)).toBe('fr|kabuto|50/62|fossil|1ed');
  });

  test('canonicalizes noisy Voltali/Jolteon titles to one cache key per card variant', () => {
    const variants4 = [
      { title: 'VOLTALI HOLO - 4/64 JUNGLE EDITION 2 FR' },
      { title: 'Voltali 4/64 HOLO Jungle Edition 2 Exc. 🇫🇷🔥' },
      { title: 'Holo Jolteon Jungle TCG GAMEFREAK Électrique 4/64' },
    ];
    expect(new Set(variants4.map(buildCardmarketCacheKey))).toEqual(new Set(['fr|jolteon|4/64|jungle']));
    expect(new Set(variants4.map(buildCardmarketSearchQuery))).toEqual(new Set(['Voltali']));

    const variants20 = [
      { title: ': Voltali 20/64 Edition 2 Jungle Wizards FR' },
      { title: 'Voltali Edition 2 Jungle 20/64' },
    ];
    expect(new Set(variants20.map(buildCardmarketCacheKey))).toEqual(new Set(['fr|jolteon|20/64|jungle']));
  });

  test('skips Cardmarket API for graded cards because priceGuide is raw-card pricing', async () => {
    const fetchImpl = async () => {
      throw new Error('fetch should not be called for graded cards');
    };
    const listing = { title: 'Voltali 20 Jungle 1999 PCA 8', price: 60 };
    const enriched = await enrichListingWithCardmarketPrice(listing, {
      ...credentials,
      fetchImpl,
      cacheRepo: false,
    });
    expect(enriched).toBe(listing);
  });

  test('finds products and product detail using mocked Cardmarket API', async () => {
    const seen = [];
    const fetchImpl = async (url, request) => {
      seen.push({ url: String(url), request });
      if (String(url).includes('/products/find')) {
        return { ok: true, status: 200, text: async () => JSON.stringify(productSearchPayload) };
      }
      return { ok: true, status: 200, text: async () => JSON.stringify(detailedProductPayload) };
    };

    const products = await findCardmarketProducts('Kabuto', { ...credentials, fetchImpl, gameId: 6, languageId: 2 });
    expect(products).toHaveLength(2);
    expect(seen[0].request.headers.Authorization).toContain('OAuth ');

    const product = await getCardmarketProduct(111, { ...credentials, fetchImpl });
    expect(product.priceGuide.TREND).toBe(8.8);
  });

  test('selects matching Fossil product and summarizes French priceGuide', () => {
    const best = selectBestCardmarketProduct(productSearchPayload.product, kabutoListing);
    expect(best.idProduct).toBe(111);

    const summary = summarizeCardmarketProduct(detailedProductPayload.product, kabutoListing);
    expect(summary).toMatchObject({
      calibrated: true,
      method: 'cardmarket_priceguide',
      product_id: 111,
      product_name: 'Kabuto',
      product_name_en: 'Kabuto',
      product_language: 'fr',
      product_language_id: 2,
      expansion_name: 'Fossil',
      condition_key: 'near_mint',
      condition_label: 'NM',
      sell_price: 8.2,
      trend_price: 8.8,
      low_ex_price: 6.4,
      value_min: 6,
      value_max: 9,
    });
  });

  test('parses Cardmarket priceGuide aliases and localized numeric strings', () => {
    const summary = summarizeCardmarketProduct({
      idProduct: 555,
      enName: 'Jolteon',
      expansionName: 'Jungle',
      number: '4',
      localization: [{ idLanguage: 2, languageName: 'French', productName: 'Voltali' }],
      priceguide: {
        trendPrice: '58,90 €',
        avgSellPrice: '52.10',
        lowPrice: '40,00',
        lowExPrice: '45,50',
      },
    }, { title: 'Voltali 4/64 Jungle FR' });

    expect(summary).toMatchObject({
      calibrated: true,
      product_name: 'Voltali',
      trend_price: 58.9,
      sell_price: 52.1,
      low_price: 40,
      low_ex_price: 45.5,
      value_min: 40,
      value_max: 59,
    });
  });

  test('selects French localized candidate over English-only candidate', () => {
    const products = [
      {
        idProduct: 333,
        enName: 'Jolteon',
        gameName: 'Pokemon',
        expansionName: 'Jungle',
        number: '4',
        localization: [{ idLanguage: 1, languageName: 'English', productName: 'Jolteon' }],
      },
      {
        idProduct: 444,
        enName: 'Jolteon',
        gameName: 'Pokemon',
        expansionName: 'Jungle',
        number: '4',
        localization: [{ idLanguage: 2, languageName: 'French', productName: 'Voltali' }],
      },
    ];

    const best = selectBestCardmarketProduct(products, { title: 'Voltali 4/64 Jungle FR' });
    expect(best.idProduct).toBe(444);
  });

  test('applies Cardmarket estimate to score_breakdown with gain', () => {
    const enriched = applyCardmarketEstimateToListing(kabutoListing, summarizeCardmarketProduct(detailedProductPayload.product, kabutoListing));
    expect(enriched.score_breakdown).toMatchObject({
      estimate_method: 'cardmarket_priceguide',
      estimate_reference_marketplace: 'cardmarket',
      estimated_value_min: 6,
      estimated_value_max: 9,
      estimated_gain_min: 1,
      estimated_gain_max: 4,
      estimate_cardmarket_product_id: 111,
      estimate_cardmarket_product_language: 'fr',
      estimate_cardmarket_product_language_id: 2,
      estimate_condition_label: 'NM',
    });
  });

  test('uses cache hit without calling Cardmarket API', async () => {
    const cacheRepo = {
      get: () => ({ payload: { summary: summarizeCardmarketProduct(detailedProductPayload.product, kabutoListing) } }),
      set: () => { throw new Error('set should not be called on cache hit'); },
    };
    const fetchImpl = async () => {
      throw new Error('fetch should not be called on cache hit');
    };

    const enriched = await enrichListingWithCardmarketPrice(kabutoListing, {
      ...credentials,
      fetchImpl,
      cacheRepo,
    });

    expect(enriched.score_breakdown.estimate_method).toBe('cardmarket_priceguide');
    expect(enriched.score_breakdown.estimated_gain_max).toBe(4);
  });
});
