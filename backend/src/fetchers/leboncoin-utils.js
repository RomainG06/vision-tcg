import { sanitizeSearchQuery } from '../utils/url-validator.js';

const LEBONCOIN_HOST_PATTERN = /^https:\/\/(?:www\.)?leboncoin\.fr\//i;

export function extractLeboncoinExternalId(url) {
  const text = String(url || '');
  if (!LEBONCOIN_HOST_PATTERN.test(text)) return null;

  const adMatch = text.match(/\/ad\/[a-z0-9_-]+\/(\d+)(?:[/?#]|$)/i);
  if (adMatch) return adMatch[1];

  const legacyMatch = text.match(/\/(\d+)\.htm(?:[?#].*)?$/i);
  if (legacyMatch) return legacyMatch[1];

  return null;
}

export function buildLeboncoinSearchUrl(query, options = {}) {
  const {
    radius = 50,
    category = '40', // Jeux & Jouets
    locationLabel = 'Nice_06000',
    latitude = 43.70313,
    longitude = 7.26608,
  } = options;

  const safeQuery = sanitizeSearchQuery(query);
  const radiusMeters = Math.max(1, Number(radius) || 50) * 1000;
  const params = new URLSearchParams({
    text: safeQuery,
    category,
    locations: `${locationLabel}__${latitude}_${longitude}_${radiusMeters}`,
  });

  return `https://www.leboncoin.fr/recherche?${params.toString()}`;
}

export function selectLeboncoinUrls(urls, options = {}) {
  const {
    excludeExternalIds = new Set(),
    maxResults = 50,
  } = options;
  const seen = excludeExternalIds instanceof Set
    ? excludeExternalIds
    : new Set(Array.from(excludeExternalIds || []).map(String));
  const deduped = new Set();
  const selected = [];

  for (const url of Array.isArray(urls) ? urls : []) {
    const externalId = extractLeboncoinExternalId(url);
    if (!externalId) continue;
    if (seen.has(String(externalId)) || deduped.has(String(externalId))) continue;

    deduped.add(String(externalId));
    selected.push(url);
    if (selected.length >= maxResults) break;
  }

  return selected;
}

export function attachLeboncoinMetadata(listings, metadata = {}) {
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
