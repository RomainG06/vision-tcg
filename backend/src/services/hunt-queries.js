const SERIES_QUERIES = {
  all: [
    'pokemon cartes wizards francais lot',
    'carte pokemon ancienne',
    'lot pokemon ancien',
    'pokemon wizard francais',
    'pokemon wotc francais',
    'pokemon edition 1 francaise',
  ],
  base: [
    'pokemon set de base',
    'base set pokemon',
    'dracaufeu set de base',
    'tortank set de base',
    'florizarre set de base',
    'wizards base set',
    'pokemon set de base francais',
  ],
  jungle: [
    'pokemon jungle',
    'carte pokemon jungle',
    'jungle holo',
    'jungle 64 pokemon',
    'ronflex jungle',
    'scarabrute jungle',
    'insecateur jungle',
    'aquali jungle',
    'wizards jungle',
    'carte pokemon ancienne jungle',
  ],
  fossil: [
    'pokemon fossile',
    'pokemon fossil',
    'fossile holo',
    'dracolosse fossile',
    'artikodin fossile',
    'wizards fossile',
    'carte pokemon ancienne fossile',
  ],
  rocket: [
    'pokemon team rocket',
    'carte pokemon team rocket',
    'team rocket edition 1',
    'dracolosse obscur',
    'dracaufeu obscur',
    'tortank obscur',
    'raichu obscur',
    'wizard rocket',
    'wizards team rocket',
    'pokemon rocket francais',
  ],
};

function applyListingTypeToQuery(query, listingType) {
  if (listingType === 'lot') {
    return /\b(lot|collection|classeur|vrac)\b/i.test(query)
      ? query
      : `lot ${query}`;
  }

  if (listingType === 'cards') {
    return /\b(carte|cartes)\b/i.test(query)
      ? query
      : `carte ${query}`;
  }

  return query;
}

export function buildHuntQueries({ profile = 'wizards-fr', filters = {}, maxQueries } = {}) {
  const series = filters.series || 'all';
  const listingType = filters.listingType || filters.listing_type || filters.type || 'all';
  const baseQueries = SERIES_QUERIES[series] || SERIES_QUERIES.all;
  const typedQueries = baseQueries.map(query => applyListingTypeToQuery(query, listingType));
  const queries = profile === 'wizards-fr'
    ? typedQueries
    : typedQueries.map(query => `${profile} ${query}`);

  const unique = [...new Set(queries.map(query => query.trim()).filter(Boolean))];
  return Number.isFinite(Number(maxQueries)) && Number(maxQueries) > 0
    ? unique.slice(0, Number(maxQueries))
    : unique;
}

export function buildPrimaryHuntQuery(options = {}) {
  return buildHuntQueries({ ...options, maxQueries: 1 })[0] || SERIES_QUERIES.all[0];
}

export function listingDedupeKey(listing) {
  const source = listing.source || listing.platform || 'unknown';
  const externalId = listing.external_id || listing.id || listing.url || listing.title;
  return `${source}:${externalId}`;
}

export function dedupeListingsBySourceExternalId(listings = []) {
  const byKey = new Map();

  for (const listing of listings) {
    const key = listingDedupeKey(listing);
    const query = listing.query || listing.matched_query;

    if (!byKey.has(key)) {
      byKey.set(key, {
        ...listing,
        matched_queries: query ? [query] : [...(listing.matched_queries || [])],
      });
      continue;
    }

    const existing = byKey.get(key);
    byKey.set(key, {
      ...existing,
      matched_queries: [...new Set([...(existing.matched_queries || []), ...(listing.matched_queries || []), query].filter(Boolean))],
    });
  }

  return [...byKey.values()];
}
