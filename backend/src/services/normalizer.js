/**
 * Normalizer service
 * Transforms raw scraped data from different sources into a unified format
 */

/**
 * Normalize a listing from any source to database format
 * @param {Object} rawListing - Raw listing data from scraper
 * @param {string} source - Source platform (leboncoin, vinted, etc.)
 * @param {number} scrapeRunId - ID of the scrape run
 * @returns {Object} Normalized listing ready for database
 */
export function normalizeListing(rawListing, source, scrapeRunId) {
  switch (source.toLowerCase()) {
    case 'leboncoin':
      return normalizeLeboncoin(rawListing, scrapeRunId);
    case 'vinted':
      return normalizeVinted(rawListing, scrapeRunId);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

/**
 * Normalize Leboncoin listing
 * @param {Object} raw - Raw Leboncoin data
 * @param {number} scrapeRunId - Scrape run ID
 * @returns {Object} Normalized listing
 */
function normalizeLeboncoin(raw, scrapeRunId) {
  return {
    scrape_run_id: scrapeRunId,
    source: 'leboncoin',
    external_id: raw.id || raw.external_id,
    url: raw.url,
    title: cleanText(raw.title),
    description: cleanText(raw.description),
    price: parsePrice(raw.price),
    location: raw.location,
    lat: raw.lat || null,
    lon: raw.lon || null,
    distance_km: raw.distance_km || null,
    images: normalizeImages(raw.images || raw.image_url),
    posted_at: normalizeDate(raw.posted_at || raw.date),
    scraped_at: new Date().toISOString(),
    raw_html: raw.raw_html || null,
    status: 'new',
    score: raw.score || 0,
    score_breakdown: raw.score_breakdown ? JSON.stringify(raw.score_breakdown) : null,
    notes: null
  };
}

/**
 * Normalize Vinted listing
 * @param {Object} raw - Raw Vinted data
 * @param {number} scrapeRunId - Scrape run ID
 * @returns {Object} Normalized listing
 */
function normalizeVinted(raw, scrapeRunId) {
  return {
    scrape_run_id: scrapeRunId,
    source: 'vinted',
    external_id: raw.id || raw.external_id,
    url: raw.url,
    title: cleanText(raw.title),
    description: cleanText(raw.description),
    price: parsePrice(raw.price),
    location: raw.location,
    lat: raw.lat || null,
    lon: raw.lon || null,
    distance_km: raw.distance_km || null,
    images: normalizeImages(raw.images || raw.image_url || raw.photo),
    posted_at: normalizeDate(raw.posted_at || raw.created_at),
    scraped_at: new Date().toISOString(),
    raw_html: raw.raw_html || null,
    status: 'new',
    score: raw.score || 0,
    score_breakdown: raw.score_breakdown ? JSON.stringify(raw.score_breakdown) : null,
    notes: null
  };
}

/**
 * Clean text: trim, remove extra spaces, decode HTML entities
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces → single space
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Parse price from various formats
 * @param {string|number} price - Price in any format
 * @returns {number} Price as number
 * 
 * Examples:
 * - "89,99 €" → 89.99
 * - "150€" → 150
 * - "1 500,50 €" → 1500.50
 * - 89.99 → 89.99
 */
function parsePrice(price) {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = price
    .toString()
    .replace(/[€$£\s]/g, '')
    .replace(/\s/g, '');
  
  // Handle French format: 1 500,50 → 1500.50
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Normalize images field
 * Can be: string URL, array of URLs, or object
 * @param {string|Array|Object} images - Images in any format
 * @returns {string} First image URL or empty string
 */
function normalizeImages(images) {
  if (!images) return '';
  
  // Already a string URL
  if (typeof images === 'string') {
    return images;
  }
  
  // Array of URLs
  if (Array.isArray(images)) {
    return images[0] || '';
  }
  
  // Object with url property
  if (typeof images === 'object' && images.url) {
    return images.url;
  }
  
  return '';
}

/**
 * Normalize date to ISO format
 * @param {string|Date} date - Date in any format
 * @returns {string|null} ISO date string or null
 */
function normalizeDate(date) {
  if (!date) return null;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Validate normalized listing
 * @param {Object} listing - Normalized listing
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validateListing(listing) {
  const errors = [];
  
  if (!listing.source) {
    errors.push('Missing source');
  }
  
  if (!listing.external_id) {
    errors.push('Missing external_id');
  }
  
  if (!listing.title) {
    errors.push('Missing title');
  }
  
  if (!listing.url) {
    errors.push('Missing url');
  }
  
  if (typeof listing.price !== 'number' || listing.price < 0) {
    errors.push('Invalid price');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Batch normalize multiple listings
 * @param {Array} rawListings - Array of raw listings
 * @param {string} source - Source platform
 * @param {number} scrapeRunId - Scrape run ID
 * @returns {Object} { normalized: Array, invalid: Array }
 */
export function normalizeListings(rawListings, source, scrapeRunId) {
  const normalized = [];
  const invalid = [];
  
  for (const raw of rawListings) {
    try {
      const listing = normalizeListing(raw, source, scrapeRunId);
      const validation = validateListing(listing);
      
      if (validation.valid) {
        normalized.push(listing);
      } else {
        invalid.push({ raw, errors: validation.errors });
      }
    } catch (error) {
      invalid.push({ raw, errors: [error.message] });
    }
  }
  
  return { normalized, invalid };
}
