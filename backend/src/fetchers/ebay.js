import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { sanitizeSearchQuery } from '../utils/url-validator.js';
import { getEbayAccessToken, getEbayApiBaseUrl } from './ebay-auth.js';

function attachEbayMetadata(listings, metadata = {}) {
  const result = Array.isArray(listings) ? listings : [];
  for (const [key, value] of Object.entries(metadata)) {
    Object.defineProperty(result, key, {
      value,
      enumerable: false,
      configurable: true,
    });
  }
  return result;
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function buildEbaySearchUrl(query, options = {}) {
  const maxResults = Math.max(1, Math.min(Number(options.maxResults || options.limit || config.ebay.maxResults || 50), 200));
  const budget = options.budget || {};
  const minPrice = parseNumber(options.minPrice ?? options.min_price ?? budget.min);
  const maxPrice = parseNumber(options.maxPrice ?? options.max_price ?? budget.max);
  const url = new URL(`${getEbayApiBaseUrl(options.env)}/buy/browse/v1/item_summary/search`);

  url.searchParams.set('q', sanitizeSearchQuery(query));
  url.searchParams.set('limit', String(maxResults));
  url.searchParams.set('sort', options.order === 'price_asc' ? 'price' : 'newlyListed');

  const filters = [];
  if (minPrice !== null || maxPrice !== null) {
    const min = minPrice !== null ? minPrice : '';
    const max = maxPrice !== null ? maxPrice : '';
    filters.push(`price:[${min}..${max}]`);
    filters.push('priceCurrency:EUR');
  }
  if (options.buyingOptions || options.buying_options) {
    filters.push(`buyingOptions:{${options.buyingOptions || options.buying_options}}`);
  }
  if (filters.length > 0) url.searchParams.set('filter', filters.join(','));

  const categoryIds = options.categoryIds || options.category_ids || config.ebay.categoryIds;
  if (categoryIds) url.searchParams.set('category_ids', categoryIds);

  return url.toString();
}

export function mapEbayItemSummary(item) {
  const externalId = item?.itemId || item?.legacyItemId || item?.itemGroupId;
  if (!externalId) return null;

  const priceValue = parseNumber(item?.price?.value || item?.currentBidPrice?.value);
  const shippingValue = parseNumber(item?.shippingOptions?.[0]?.shippingCost?.value);
  const totalPrice = priceValue === null
    ? null
    : Math.round((priceValue + (shippingValue || 0)) * 100) / 100;
  const location = item?.itemLocation || {};

  return {
    source: 'ebay',
    external_id: String(externalId),
    id: String(externalId),
    url: item?.itemWebUrl || item?.itemAffiliateWebUrl || '',
    title: item?.title || '',
    description: [item?.shortDescription, item?.subtitle].filter(Boolean).join(' '),
    price: totalPrice,
    price_without_shipping: priceValue,
    shipping_price: shippingValue,
    currency: item?.price?.currency || item?.currentBidPrice?.currency || 'EUR',
    location: [location.city, location.stateOrProvince, location.country].filter(Boolean).join(', '),
    distance_km: null,
    images: [item?.image?.imageUrl, ...(item?.additionalImages || []).map(image => image?.imageUrl)].filter(Boolean),
    image_url: item?.image?.imageUrl || null,
    posted_at: item?.itemCreationDate || null,
    seller_type: item?.seller?.username ? 'seller' : null,
    seller_username: item?.seller?.username || null,
    buying_options: item?.buyingOptions || [],
    condition: item?.condition || null,
    raw_api: {
      marketplace_id: item?.itemOriginDate || null,
      item_location_country: location.country || null,
    },
  };
}

export async function fetchEbay(query, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch API unavailable in this Node runtime');
  }

  const token = options.accessToken || await getEbayAccessToken({
    fetchImpl,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    scope: options.scope,
    env: options.env,
  });

  const url = buildEbaySearchUrl(query, options);
  const marketplaceId = options.marketplaceId || options.marketplace_id || config.ebay.marketplaceId;
  logger.info(`[eBay] Browse search query="${query}" marketplace=${marketplaceId}`);

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
    throw new Error(`eBay Browse API failed (${response.status}): ${apiMessage}`);
  }

  const items = Array.isArray(json?.itemSummaries) ? json.itemSummaries : [];
  const seenIds = new Set(Array.from(options.excludeExternalIds || []).map(String));
  const deduped = new Set();
  const listings = [];

  for (const item of items) {
    const listing = mapEbayItemSummary(item);
    const id = String(listing?.external_id || '');
    if (!listing || !id || seenIds.has(id) || deduped.has(id)) continue;
    deduped.add(id);
    listings.push(listing);
  }

  return attachEbayMetadata(listings, {
    grid_raw_found: Number(json?.total || items.length || listings.length),
    selected_for_details: listings.length,
    selected_external_ids: listings.map(listing => listing.external_id),
    prefilter_summary: {
      total: Number(json?.total || items.length || listings.length),
      selected: listings.length,
      already_seen: items.length - listings.length,
      duplicate: Math.max(0, items.length - new Set(items.map(item => item.itemId || item.legacyItemId)).size),
      invalid_url: Math.max(0, items.length - listings.length),
    },
    ebay_api: {
      mode: 'browse_api',
      marketplace_id: marketplaceId,
      href: json?.href || null,
      next: json?.next || null,
    },
  });
}
