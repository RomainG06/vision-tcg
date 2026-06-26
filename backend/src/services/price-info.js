import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { sanitizeSearchQuery } from '../utils/url-validator.js';
import { getEbayAccessToken, getEbayApiBaseUrl, EbayConfigError } from '../fetchers/ebay-auth.js';

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundEuro(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
}

function percentile(sortedValues, ratio) {
  if (!sortedValues.length) return null;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.round((sortedValues.length - 1) * ratio)));
  return sortedValues[index];
}

function normalizeComparable(item) {
  const priceValue = parseNumber(item?.price?.value || item?.lastSoldPrice?.value || item?.itemSalePrice?.value);
  const shippingValue = parseNumber(item?.shippingOptions?.[0]?.shippingCost?.value || item?.shippingCost?.value);
  if (priceValue === null || priceValue <= 0) return null;

  return {
    title: item?.title || '',
    price: Math.round((priceValue + (shippingValue || 0)) * 100) / 100,
    price_without_shipping: priceValue,
    shipping_price: shippingValue || 0,
    currency: item?.price?.currency || item?.lastSoldPrice?.currency || item?.itemSalePrice?.currency || 'EUR',
    sold_at: item?.itemSoldDate || item?.lastSoldDate || item?.itemEndDate || null,
    url: item?.itemWebUrl || item?.itemAffiliateWebUrl || null,
    condition: item?.condition || null,
  };
}

export function buildEbaySoldSearchUrl(query, options = {}) {
  const url = new URL(`${getEbayApiBaseUrl(options.env)}/buy/marketplace_insights/v1_beta/item_sales/search`);
  const limit = Math.max(1, Math.min(Number(options.limit || options.maxResults || config.priceInfo.maxComparables || 20), 200));
  url.searchParams.set('q', sanitizeSearchQuery(query));
  url.searchParams.set('limit', String(limit));

  const categoryIds = options.categoryIds || options.category_ids || config.ebay.categoryIds;
  if (categoryIds) url.searchParams.set('category_ids', categoryIds);

  return url.toString();
}

export function summarizeSoldComparables(comparables = [], options = {}) {
  const minComparables = Number(options.minComparables || config.priceInfo.minComparables || 3);
  const prices = comparables
    .map(item => parseNumber(item.price))
    .filter(price => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);

  if (prices.length < minComparables) {
    return {
      calibrated: false,
      sample_count: prices.length,
      reason: `not_enough_comparables_${prices.length}_of_${minComparables}`,
    };
  }

  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const median = prices.length % 2 === 1
    ? prices[(prices.length - 1) / 2]
    : (prices[(prices.length / 2) - 1] + prices[prices.length / 2]) / 2;
  const p25 = percentile(prices, 0.25);
  const p75 = percentile(prices, 0.75);

  return {
    calibrated: true,
    sample_count: prices.length,
    average_price: Math.round(average * 100) / 100,
    median_price: Math.round(median * 100) / 100,
    value_min: roundEuro(p25),
    value_max: roundEuro(p75),
    confidence: prices.length >= 8 ? 'high' : 'medium',
    method: 'ebay_sold_average',
  };
}

export function applySoldEstimateToListing(listing, summary, comparables = []) {
  if (!summary?.calibrated) return listing;

  const price = parseNumber(listing.price) || 0;
  const estimatedMin = summary.value_min ?? roundEuro(summary.median_price);
  const estimatedMax = Math.max(estimatedMin || 0, summary.value_max ?? roundEuro(summary.average_price));
  const gainMin = price > 0 && estimatedMin !== null ? Math.round(estimatedMin - price) : null;
  const gainMax = price > 0 && estimatedMax !== null ? Math.round(estimatedMax - price) : null;

  return {
    ...listing,
    score_breakdown: {
      ...(listing.score_breakdown || {}),
      estimated_value_min: estimatedMin,
      estimated_value_max: estimatedMax,
      estimate_method: summary.method,
      estimate_confidence: summary.confidence,
      estimate_sample_count: summary.sample_count,
      estimate_reference_marketplace: 'ebay_sold',
      estimate_average_price: summary.average_price,
      estimate_median_price: summary.median_price,
      estimated_gain_min: gainMin,
      estimated_gain_max: gainMax,
      ebay_sold_comparables: comparables.slice(0, 5).map(item => ({
        title: item.title,
        price: item.price,
        sold_at: item.sold_at,
        url: item.url,
        condition: item.condition,
      })),
    },
  };
}

export async function fetchEbaySoldComparables(query, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const token = options.accessToken || await getEbayAccessToken({
    fetchImpl,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    scope: options.scope,
    env: options.env,
  });
  const marketplaceId = options.marketplaceId || options.marketplace_id || config.ebay.marketplaceId;
  const url = buildEbaySoldSearchUrl(query, options);

  logger.info(`[price-info] eBay sold search query="${query}" marketplace=${marketplaceId}`);
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const apiMessage = json?.errors?.[0]?.message || json?.message || text.slice(0, 200) || `HTTP ${response.status}`;
    throw new Error(`eBay sold price API failed (${response.status}): ${apiMessage}`);
  }

  const items = Array.isArray(json?.itemSales)
    ? json.itemSales
    : Array.isArray(json?.itemSummaries)
      ? json.itemSummaries
      : [];
  return items.map(normalizeComparable).filter(Boolean);
}

export function buildPriceInfoQuery(listing) {
  const title = sanitizeSearchQuery(listing?.title || '');
  return title
    .replace(/\b(lot\s+de|lot|collection|cartes?|cards?|pokemon|pokémon)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim() || sanitizeSearchQuery(listing?.title || 'pokemon wizards');
}

export async function enrichListingsWithEbaySoldPrices(listings = [], options = {}) {
  if (!config.priceInfo.enabled || options.enabled === false || config.priceInfo.provider !== 'ebay_sold') {
    return listings;
  }

  const enriched = [];
  for (const listing of listings) {
    try {
      const query = options.queryBuilder ? options.queryBuilder(listing) : buildPriceInfoQuery(listing);
      const comparables = await fetchEbaySoldComparables(query, {
        ...options,
        limit: options.maxComparables || config.priceInfo.maxComparables,
      });
      const summary = summarizeSoldComparables(comparables, options);
      enriched.push(applySoldEstimateToListing(listing, summary, comparables));
    } catch (error) {
      if (error instanceof EbayConfigError || error.code === 'ebay_config_missing') {
        logger.warn('[price-info] eBay credentials missing; keeping fallback estimates.');
      } else {
        logger.warn(`[price-info] eBay sold estimate unavailable: ${error.message}`);
      }
      enriched.push(listing);
    }
  }

  return enriched;
}
