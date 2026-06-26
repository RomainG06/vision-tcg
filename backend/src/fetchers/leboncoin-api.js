import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { sanitizeSearchQuery } from '../utils/url-validator.js';
import { attachLeboncoinMetadata } from './leboncoin-utils.js';

const LBC_API_SEARCH_URL = 'https://api.leboncoin.fr/finder/search';
const LBC_WEB_BASE_URL = 'https://www.leboncoin.fr';
const DEFAULT_NICE_LOCATION = {
  locationType: 'city',
  city: 'Nice',
  zipcode: '06000',
  area: {
    lat: 43.70313,
    lng: 7.26608,
    default_radius: 50000,
  },
};

export class LeboncoinApiBlockedError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'LeboncoinApiBlockedError';
    this.code = 'lbc_api_blocked';
    this.details = details;
  }
}

export function buildLeboncoinApiPayload(query, options = {}) {
  const {
    maxResults = 20,
    limit,
    radius = 50,
    category = '40', // Collection
    budget = {},
    minPrice = budget.min,
    maxPrice = budget.max,
    order = 'newest_first',
  } = options;

  const safeQuery = sanitizeSearchQuery(query);
  const resolvedLimit = Math.max(1, Math.min(Number(limit || maxResults) || 20, 100));
  const radiusMeters = Math.max(1, Number(radius) || 50) * 1000;
  const priceRange = {};
  if (Number.isFinite(Number(minPrice))) priceRange.min = Number(minPrice);
  if (Number.isFinite(Number(maxPrice))) priceRange.max = Number(maxPrice);

  return {
    filters: {
      category: { id: String(category) },
      enums: { ad_type: ['offer'] },
      keywords: safeQuery ? { text: safeQuery, type: 'all' } : undefined,
      ranges: Object.keys(priceRange).length > 0 ? { price: priceRange } : {},
      location: {
        locations: [{
          ...DEFAULT_NICE_LOCATION,
          area: {
            ...DEFAULT_NICE_LOCATION.area,
            default_radius: radiusMeters,
          },
        }],
        shippable: false,
      },
    },
    limit: resolvedLimit,
    owner_type: 'all',
    sort_by: order === 'price_asc' ? 'price' : 'date',
    sort_order: order === 'price_asc' ? 'asc' : 'desc',
  };
}

export function buildLeboncoinApiHeaders(options = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'User-Agent': options.userAgent || process.env.USER_AGENT || config.scraping.userAgent,
  };

  const apiKey = options.apiKey || config.scraping.leboncoinApiKey;
  if (apiKey) headers.api_key = apiKey;

  return headers;
}

function normalizePrice(ad) {
  if (typeof ad?.price === 'number') return ad.price;
  if (Array.isArray(ad?.price) && ad.price.length > 0) return Number(ad.price[0]) || null;
  if (typeof ad?.price_cents === 'number') return Math.round(ad.price_cents) / 100;
  if (typeof ad?.priceCents === 'number') return Math.round(ad.priceCents) / 100;
  return null;
}

function normalizeImages(ad) {
  const images = ad?.images || ad?.image || {};
  if (Array.isArray(images)) return images.map(item => typeof item === 'string' ? item : item?.url).filter(Boolean);
  if (Array.isArray(images.urls)) return images.urls.filter(Boolean);
  if (images.thumb_url) return [images.thumb_url];
  if (images.small_url) return [images.small_url];
  if (images.url) return [images.url];
  return [];
}

function findAttribute(ad, keys) {
  const attributes = Array.isArray(ad?.attributes) ? ad.attributes : [];
  const wanted = new Set(keys);
  return attributes.find(attribute => wanted.has(attribute?.key) || wanted.has(attribute?.name));
}

export function mapLeboncoinApiAd(ad) {
  const id = String(ad?.list_id || ad?.id || ad?.ad_id || '').trim();
  if (!id) return null;

  const location = ad?.location || {};
  const price = normalizePrice(ad);
  const images = normalizeImages(ad);
  const subject = ad?.subject || ad?.title || '';
  const body = ad?.body || ad?.description || '';
  const categoryName = ad?.category_name || findAttribute(ad, ['category'])?.value_label || null;
  const sellerType = ad?.owner?.type || ad?.owner_type || null;

  return {
    source: 'leboncoin',
    external_id: id,
    id,
    url: ad?.url || `${LBC_WEB_BASE_URL}/ad/collection/${id}`,
    title: subject,
    description: body,
    price,
    location: [location.city, location.zipcode].filter(Boolean).join(' ') || location.label || '',
    lat: location.lat || location.latitude || location.area?.lat || null,
    lon: location.lng || location.lon || location.longitude || location.area?.lng || null,
    distance_km: null,
    images,
    image_url: images[0] || null,
    posted_at: ad?.first_publication_date || ad?.index_date || ad?.created_at || null,
    seller_type: sellerType,
    raw_api: {
      category_name: categoryName,
      owner_type: sellerType,
    },
  };
}

export function detectLeboncoinApiBlock(status, text, json = null) {
  if ([401, 403, 429].includes(Number(status))) return true;
  const haystack = `${text || ''} ${JSON.stringify(json || {})}`;
  return /captcha-delivery|datadome|captcha|temporarily restricted|IPPOLL_REASONCODE|too many requests/i.test(haystack);
}

export async function fetchLeboncoinApi(query, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch API unavailable in this Node runtime');
  }

  const payload = buildLeboncoinApiPayload(query, options);
  const headers = buildLeboncoinApiHeaders(options);
  const startedAt = Date.now();

  logger.info(`[LBC API] Searching finder/search query="${query}" limit=${payload.limit}`);
  const response = await fetchImpl(LBC_API_SEARCH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    logger.warn(`[LBC API] Non-JSON response (${response.status}): ${text.slice(0, 160)}`);
  }

  if (!response.ok || detectLeboncoinApiBlock(response.status, text, json)) {
    throw new LeboncoinApiBlockedError(`Leboncoin API blocked or rejected the request (${response.status})`, {
      status: response.status,
      content_type: response.headers?.get?.('content-type') || null,
      body_preview: text.slice(0, 240),
    });
  }

  const ads = Array.isArray(json?.ads) ? json.ads : [];
  const seenIds = new Set(Array.from(options.excludeExternalIds || []).map(String));
  const dedupedIds = new Set();
  const rawListings = ads.map(mapLeboncoinApiAd).filter(Boolean);
  const listings = [];
  for (const listing of rawListings) {
    const id = String(listing.external_id || '');
    if (!id || seenIds.has(id) || dedupedIds.has(id)) continue;
    dedupedIds.add(id);
    listings.push(listing);
  }
  const selectedExternalIds = listings.map(listing => listing.external_id).filter(Boolean);
  const elapsedMs = Date.now() - startedAt;
  const total = Number(json?.total || ads.length || listings.length);

  return attachLeboncoinMetadata(listings, {
    grid_raw_found: total,
    selected_for_details: listings.length,
    selected_external_ids: selectedExternalIds,
    prefilter_summary: {
      total,
      selected: listings.length,
      already_seen: rawListings.length - listings.length,
      duplicate: Math.max(0, rawListings.length - new Set(rawListings.map(item => item.external_id)).size),
      invalid_url: Math.max(0, ads.length - rawListings.length),
    },
    lbc_api: {
      mode: 'api',
      status: response.status,
      elapsed_ms: elapsedMs,
      pivot: json?.pivot || null,
    },
  });
}
