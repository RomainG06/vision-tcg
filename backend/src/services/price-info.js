import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { sanitizeSearchQuery } from '../utils/url-validator.js';
import { getEbayAccessToken, getEbayApiBaseUrl, EbayConfigError } from '../fetchers/ebay-auth.js';
import { detectListingCondition, normalizeCardCondition } from './card-condition.js';
import { enrichListingWithCardmarketPrice } from './cardmarket-price-info.js';

export { detectListingCondition, normalizeCardCondition };

export class EbaySoldAccessDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EbaySoldAccessDeniedError';
    this.code = 'ebay_sold_access_denied';
  }
}

let soldAccessDeniedWarned = false;

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

function comparableCondition(comparable = {}) {
  return comparable.condition_normalized || normalizeCardCondition([
    comparable.condition,
    comparable.title,
  ].filter(Boolean).join(' '));
}

function conditionMatches(comparable, targetCondition) {
  if (!targetCondition?.key) return true;
  const condition = comparableCondition(comparable);
  return condition?.key === targetCondition.key;
}

function normalizeComparable(item) {
  const priceValue = parseNumber(item?.price?.value || item?.lastSoldPrice?.value || item?.itemSalePrice?.value);
  const shippingValue = parseNumber(item?.shippingOptions?.[0]?.shippingCost?.value || item?.shippingCost?.value);
  if (priceValue === null || priceValue <= 0) return null;

  const condition = item?.condition || null;
  const normalizedCondition = normalizeCardCondition([condition, item?.title].filter(Boolean).join(' '));

  return {
    title: item?.title || '',
    price: Math.round((priceValue + (shippingValue || 0)) * 100) / 100,
    price_without_shipping: priceValue,
    shipping_price: shippingValue || 0,
    currency: item?.price?.currency || item?.lastSoldPrice?.currency || item?.itemSalePrice?.currency || 'EUR',
    sold_at: item?.itemSoldDate || item?.lastSoldDate || item?.itemEndDate || null,
    url: item?.itemWebUrl || item?.itemAffiliateWebUrl || null,
    condition,
    condition_normalized: normalizedCondition,
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
  const targetCondition = options.targetCondition || options.condition || null;
  const conditionFilteredComparables = comparables.filter(item => conditionMatches(item, targetCondition));
  const prices = conditionFilteredComparables
    .map(item => parseNumber(item.price))
    .filter(price => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);

  if (prices.length < minComparables) {
    return {
      calibrated: false,
      sample_count: prices.length,
      total_sample_count: comparables.length,
      condition_key: targetCondition?.key || null,
      condition_label: targetCondition?.label || null,
      reason: targetCondition?.key
        ? `not_enough_${targetCondition.key}_comparables_${prices.length}_of_${minComparables}`
        : `not_enough_comparables_${prices.length}_of_${minComparables}`,
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
    total_sample_count: comparables.length,
    condition_key: targetCondition?.key || null,
    condition_label: targetCondition?.label || null,
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
  const listingCondition = summary.condition_key
    ? { key: summary.condition_key, label: summary.condition_label }
    : detectListingCondition(listing);
  const matchingComparables = comparables.filter(item => conditionMatches(item, listingCondition));

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
      estimate_condition_key: listingCondition?.key || null,
      estimate_condition_label: listingCondition?.label || null,
      estimate_total_sample_count: summary.total_sample_count || comparables.length,
      card_condition_key: listingCondition?.key || null,
      card_condition_label: listingCondition?.label || null,
      estimated_gain_min: gainMin,
      estimated_gain_max: gainMax,
      ebay_sold_comparables: matchingComparables.slice(0, 5).map(item => ({
        title: item.title,
        price: item.price,
        sold_at: item.sold_at,
        url: item.url,
        condition: item.condition,
        condition_normalized: item.condition_normalized || comparableCondition(item),
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
    if (response.status === 403 && /access\s+denied|forbidden|not\s+authorized|unauthori[sz]ed/i.test(apiMessage)) {
      throw new EbaySoldAccessDeniedError(
        'eBay Marketplace Insights access denied. Browse API credentials are valid, but this app is not authorized for sold/completed sales data.'
      );
    }
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

export function priceProviders() {
  return String(config.priceInfo.provider || 'cardmarket,ebay_sold')
    .split(',')
    .map(provider => provider.trim().toLowerCase())
    .filter(provider => provider && (provider !== 'cardmarket' || config.cardmarket.enabled));
}

function hasCalibratedEstimate(listing) {
  return listing?.score_breakdown?.estimate_method && listing.score_breakdown.estimate_method !== 'price_multiplier_fallback';
}

async function enrichListingWithEbaySoldPrice(listing, options = {}) {
  try {
    const query = options.queryBuilder ? options.queryBuilder(listing) : buildPriceInfoQuery(listing);
    const comparables = await fetchEbaySoldComparables(query, {
      ...options,
      limit: options.maxComparables || config.priceInfo.maxComparables,
    });
    const targetCondition = detectListingCondition(listing);
    const summary = summarizeSoldComparables(comparables, {
      ...options,
      targetCondition,
    });
    return applySoldEstimateToListing(listing, summary, comparables);
  } catch (error) {
    if (error instanceof EbayConfigError || error.code === 'ebay_config_missing') {
      logger.warn('[price-info] eBay credentials missing; keeping fallback estimates.');
    } else if (error instanceof EbaySoldAccessDeniedError || error.code === 'ebay_sold_access_denied') {
      if (!soldAccessDeniedWarned) {
        logger.warn('[price-info] eBay Marketplace Insights access denied; sold-price calibration disabled for this run. Ask eBay for Marketplace Insights/item_sales access or set PRICE_INFO_ENABLED=false to silence this fallback.');
        soldAccessDeniedWarned = true;
      }
    } else {
      logger.warn(`[price-info] eBay sold estimate unavailable: ${error.message}`);
    }
    return listing;
  }
}

export async function enrichListingsWithEbaySoldPrices(listings = [], options = {}) {
  if (!config.priceInfo.enabled || options.enabled === false) {
    return listings;
  }

  const providers = priceProviders();
  const enriched = [];

  for (const listing of listings) {
    let current = listing;

    if (providers.includes('cardmarket')) {
      current = await enrichListingWithCardmarketPrice(current, options);
    }

    if (!hasCalibratedEstimate(current) && providers.includes('ebay_sold')) {
      current = await enrichListingWithEbaySoldPrice(current, options);
    }

    enriched.push(current);
  }

  return enriched;
}
