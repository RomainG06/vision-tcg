/**
 * Normalizer Service
 * Transforme les données brutes des différents scrapers en format uniforme
 */

/**
 * Normalise les données d'une annonce provenant de n'importe quelle source
 * @param {Object} raw - Données brutes du scraper
 * @param {string} source - Source ('leboncoin' | 'vinted' | 'facebook')
 * @param {number} scrapeRunId - ID du run de scraping
 * @returns {Object} Annonce normalisée
 */
export function normalizeListing(raw, source, scrapeRunId) {
  if (!raw || !source) {
    throw new Error('Raw data and source are required');
  }

  const normalizers = {
    leboncoin: normalizeLeboncoin,
    vinted: normalizeVinted,
    facebook: normalizeFacebook,
  };

  const normalizer = normalizers[source.toLowerCase()];
  if (!normalizer) {
    throw new Error(`Unknown source: ${source}`);
  }

  const normalized = normalizer(raw);
  
  // Ajouter les champs communs
  return {
    ...normalized,
    scrape_run_id: scrapeRunId,
    source: source.toLowerCase(),
    scraped_at: new Date().toISOString(),
    status: 'new',
    score: 0,
    score_breakdown: null,
    notes: null,
  };
}

/**
 * Normalise une annonce Leboncoin
 */
function normalizeLeboncoin(raw) {
  return {
    external_id: raw.id || raw.list_id || '',
    url: raw.url || '',
    title: cleanTitle(raw.title || ''),
    description: raw.description || null,
    price: parsePrice(raw.price),
    location: raw.location || null,
    lat: raw.lat || null,
    lon: raw.lon || null,
    distance_km: raw.distance || null,
    images: raw.images ? JSON.stringify(raw.images) : null,
    posted_at: raw.posted_at || raw.date || null,
    raw_html: null, // On ne stocke pas le HTML par défaut (trop lourd)
  };
}

/**
 * Normalise une annonce Vinted
 */
function normalizeVinted(raw) {
  return {
    external_id: raw.id || '',
    url: raw.url || raw.link || '',
    title: cleanTitle(raw.title || ''),
    description: raw.description || null,
    price: parsePrice(raw.price),
    location: raw.location || raw.city || null,
    lat: null, // Vinted ne fournit généralement pas les coordonnées
    lon: null,
    distance_km: null,
    images: raw.images || raw.photos ? JSON.stringify(raw.images || raw.photos) : null,
    posted_at: raw.posted_at || raw.created_at || null,
    raw_html: null,
  };
}

/**
 * Normalise une annonce Facebook Marketplace
 */
function normalizeFacebook(raw) {
  return {
    external_id: raw.id || '',
    url: raw.url || raw.marketplace_url || '',
    title: cleanTitle(raw.title || ''),
    description: raw.description || null,
    price: parsePrice(raw.price),
    location: raw.location || raw.city || null,
    lat: null,
    lon: null,
    distance_km: null,
    images: raw.images || raw.image ? JSON.stringify([raw.image]) : null,
    posted_at: raw.posted_at || raw.listing_time || null,
    raw_html: null,
  };
}

/**
 * Nettoie et normalise un titre d'annonce
 */
function cleanTitle(title) {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Espaces multiples → 1 espace
    .substring(0, 255); // Limite à 255 caractères
}

/**
 * Parse et normalise un prix
 * @param {string|number} price - Prix brut
 * @returns {number} Prix normalisé (float)
 */
function parsePrice(price) {
  if (typeof price === 'number') return price;
  
  if (typeof price === 'string') {
    // Enlever symboles monétaires et espaces
    const cleaned = price
      .replace(/[€$£\s]/g, '')
      .replace(',', '.'); // Virgule → point décimal
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Normalise un batch d'annonces
 * @param {Array} rawListings - Tableau d'annonces brutes
 * @param {string} source - Source
 * @param {number} scrapeRunId - ID du run
 * @returns {Array} Annonces normalisées
 */
export function normalizeListings(rawListings, source, scrapeRunId) {
  if (!Array.isArray(rawListings)) {
    throw new Error('rawListings must be an array');
  }

  return rawListings
    .map(raw => {
      try {
        return normalizeListing(raw, source, scrapeRunId);
      } catch (err) {
        console.error(`Failed to normalize listing from ${source}:`, err);
        return null;
      }
    })
    .filter(Boolean); // Enlever les null
}
