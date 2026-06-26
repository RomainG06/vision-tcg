import { describe, expect, test } from '@jest/globals';
import {
  applySoldEstimateToListing,
  buildEbaySoldSearchUrl,
  buildPriceInfoQuery,
  fetchEbaySoldComparables,
  summarizeSoldComparables,
} from '../src/services/price-info.js';

const mockSoldResponse = {
  itemSales: [
    {
      title: 'Dracolosse obscur Team Rocket FR',
      price: { value: '80.00', currency: 'EUR' },
      shippingOptions: [{ shippingCost: { value: '5.00', currency: 'EUR' } }],
      itemWebUrl: 'https://www.ebay.fr/itm/1',
      itemSoldDate: '2026-06-01T10:00:00Z',
      condition: 'Occasion',
    },
    {
      title: 'Dracolosse obscur FR',
      price: { value: '100.00', currency: 'EUR' },
      itemWebUrl: 'https://www.ebay.fr/itm/2',
      itemSoldDate: '2026-06-02T10:00:00Z',
    },
    {
      title: 'Carte Pokémon Dracolosse obscur',
      price: { value: '120.00', currency: 'EUR' },
      itemWebUrl: 'https://www.ebay.fr/itm/3',
      itemSoldDate: '2026-06-03T10:00:00Z',
    },
  ],
};

describe('price-info eBay sold estimates', () => {
  test('builds Marketplace Insights sold search URL', () => {
    const url = new URL(buildEbaySoldSearchUrl('Dracolosse obscur Pokémon', {
      env: 'production',
      limit: 12,
      categoryIds: '183454',
    }));

    expect(url.origin).toBe('https://api.ebay.com');
    expect(url.pathname).toBe('/buy/marketplace_insights/v1_beta/item_sales/search');
    expect(url.searchParams.get('q')).toBe('Dracolosse obscur Pokémon');
    expect(url.searchParams.get('limit')).toBe('12');
    expect(url.searchParams.get('category_ids')).toBe('183454');
  });

  test('builds a compact query from listing title', () => {
    expect(buildPriceInfoQuery({ title: 'Lot de cartes Pokémon Dracolosse Obscur 22/82 FR' })).toBe('Dracolosse Obscur 22/82 FR');
  });

  test('summarizes sold comparables into calibrated value range', () => {
    const summary = summarizeSoldComparables([
      { price: 85 },
      { price: 100 },
      { price: 120 },
      { price: 130 },
    ], { minComparables: 3 });

    expect(summary.calibrated).toBe(true);
    expect(summary.method).toBe('ebay_sold_average');
    expect(summary.sample_count).toBe(4);
    expect(summary.average_price).toBe(108.75);
    expect(summary.median_price).toBe(110);
    expect(summary.value_min).toBe(100);
    expect(summary.value_max).toBe(120);
    expect(summary.confidence).toBe('medium');
  });

  test('does not calibrate below minimum comparable count', () => {
    const summary = summarizeSoldComparables([{ price: 80 }, { price: 100 }], { minComparables: 3 });

    expect(summary.calibrated).toBe(false);
    expect(summary.reason).toBe('not_enough_comparables_2_of_3');
  });

  test('applies calibrated sold estimate to listing score breakdown', () => {
    const listing = {
      title: 'Dracolosse obscur',
      price: 75,
      score_breakdown: {
        estimate_method: 'price_multiplier_fallback',
        estimate_confidence: 'low',
      },
    };
    const enriched = applySoldEstimateToListing(listing, {
      calibrated: true,
      method: 'ebay_sold_average',
      confidence: 'medium',
      sample_count: 4,
      average_price: 108.75,
      median_price: 110,
      value_min: 100,
      value_max: 120,
    }, [
      { title: 'Comp 1', price: 100, url: 'https://www.ebay.fr/itm/1' },
    ]);

    expect(enriched.score_breakdown).toMatchObject({
      estimated_value_min: 100,
      estimated_value_max: 120,
      estimate_method: 'ebay_sold_average',
      estimate_confidence: 'medium',
      estimate_sample_count: 4,
      estimated_gain_min: 25,
      estimated_gain_max: 45,
    });
    expect(enriched.score_breakdown.ebay_sold_comparables).toHaveLength(1);
  });

  test('fetches sold comparables with mocked OAuth and Marketplace Insights calls', async () => {
    const fetchImpl = async (url, request) => {
      if (String(url).includes('/identity/v1/oauth2/token')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ access_token: 'mock-token', expires_in: 7200 }),
        };
      }

      expect(String(url)).toContain('/buy/marketplace_insights/v1_beta/item_sales/search');
      expect(request.headers.Authorization).toBe('Bearer mock-token');
      expect(request.headers['X-EBAY-C-MARKETPLACE-ID']).toBe('EBAY_FR');
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSoldResponse),
      };
    };

    const comparables = await fetchEbaySoldComparables('dracolosse obscur', {
      fetchImpl,
      clientId: 'client-id',
      clientSecret: 'client-secret',
      marketplaceId: 'EBAY_FR',
      limit: 3,
    });

    expect(comparables).toHaveLength(3);
    expect(comparables[0]).toMatchObject({
      price: 85,
      price_without_shipping: 80,
      shipping_price: 5,
      currency: 'EUR',
    });
  });
});
