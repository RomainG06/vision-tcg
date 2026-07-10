import { ListingHistoryRepository } from '../../repositories/listing-history-repository.js';

const listingHistoryRepo = new ListingHistoryRepository();

/**
 * Parse JSON field safely
 * Handles SQLite JSON storage which stores data as strings
 * 
 * @param {any} value - Value to parse (string, object, or null)
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed value or fallback
 * 
 * @example
 * parseJsonField('{"key": "value"}', {}) // → {key: "value"}
 * parseJsonField(null, []) // → []
 * parseJsonField('invalid json', {}) // → {}
 */
export function parseJsonField(value, fallback) {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

/**
 * Extract scoring details from score_breakdown JSON
 * Reduces duplication in mapListing function
 * 
 * @param {Object} scoreBreakdown - Parsed score_breakdown object
 * @returns {Object} Flattened scoring fields
 */
function extractScoringDetails(scoreBreakdown) {
    return {
        confidence: scoreBreakdown.confidence || null,
        estimated_value_min: scoreBreakdown.estimated_value_min || null,
        estimated_value_max: scoreBreakdown.estimated_value_max || null,
        estimate_method: scoreBreakdown.estimate_method || null,
        estimate_confidence: scoreBreakdown.estimate_confidence || null,
        estimate_sample_count: scoreBreakdown.estimate_sample_count || null,
        estimate_reference_marketplace: scoreBreakdown.estimate_reference_marketplace || null,
        estimate_average_price: scoreBreakdown.estimate_average_price || null,
        estimate_median_price: scoreBreakdown.estimate_median_price || null,
        estimate_trend_price: scoreBreakdown.estimate_trend_price || null,
        estimate_sell_price: scoreBreakdown.estimate_sell_price || null,
        estimate_low_price: scoreBreakdown.estimate_low_price || null,
        estimate_low_ex_price: scoreBreakdown.estimate_low_ex_price || null,
    };
}

/**
 * Extract Cardmarket details from score_breakdown JSON
 * 
 * @param {Object} scoreBreakdown - Parsed score_breakdown object
 * @returns {Object} Cardmarket-specific fields
 */
function extractCardmarketDetails(scoreBreakdown) {
    return {
        estimate_cardmarket_product_id: scoreBreakdown.estimate_cardmarket_product_id || null,
        estimate_cardmarket_product_name: scoreBreakdown.estimate_cardmarket_product_name || null,
        estimate_cardmarket_product_name_en: scoreBreakdown.estimate_cardmarket_product_name_en || null,
        estimate_cardmarket_product_language: scoreBreakdown.estimate_cardmarket_product_language || null,
        estimate_cardmarket_product_language_id: scoreBreakdown.estimate_cardmarket_product_language_id || null,
        estimate_cardmarket_product_url: scoreBreakdown.estimate_cardmarket_product_url || null,
        estimate_cardmarket_expansion: scoreBreakdown.estimate_cardmarket_expansion || null,
    };
}

/**
 * Extract condition and quality details
 * 
 * @param {Object} scoreBreakdown - Parsed score_breakdown object
 * @returns {Object} Condition and quality fields
 */
function extractConditionDetails(scoreBreakdown) {
    return {
        estimate_condition_key: scoreBreakdown.estimate_condition_key || null,
        estimate_condition_label: scoreBreakdown.estimate_condition_label || null,
        estimate_grading: scoreBreakdown.estimate_grading || null,
        estimate_grading_note: scoreBreakdown.estimate_grading_note || null,
        estimate_total_sample_count: scoreBreakdown.estimate_total_sample_count || null,
        condition: scoreBreakdown.card_condition_label || scoreBreakdown.estimate_condition_label || null,
        condition_key: scoreBreakdown.card_condition_key || scoreBreakdown.estimate_condition_key || null,
        quality: scoreBreakdown.quality || null,
        quality_tier: scoreBreakdown.quality?.quality_tier || null,
        action_suggestion: scoreBreakdown.quality?.action_suggestion || null,
        positive_reasons: scoreBreakdown.quality?.positive_reasons || [],
        risk_reasons: scoreBreakdown.quality?.risk_reasons || [],
    };
}

/**
 * Map database listing to frontend format
 * Transforms the raw database schema into a clean API response
 * 
 * Responsibilities:
 * - Parse JSON fields (images, score_breakdown)
 * - Flatten nested structures for easier frontend consumption
 * - Rename fields for business clarity (source → platform)
 * - Calculate derived fields (has_price_drop)
 * - Maintain backward compatibility
 * 
 * @param {Object} listing - Database listing object
 * @returns {Object|null} Mapped listing or null
 * 
 * @example
 * const dbListing = { id: 1, source: "vinted", images: '["url.jpg"]' }
 * mapListing(dbListing) // → { id: 1, platform: "vinted", images: ["url.jpg"] }
 */
export function mapListing(listing) {
    if (!listing) return null;

    // Parse JSON fields. Scraped data can store images as a JSON array or a single URL string.
    const parsedImages = parseJsonField(listing.images, null);
    const images = Array.isArray(parsedImages) ? parsedImages : (listing.images ? [listing.images] : []);
    const scoreBreakdown = parseJsonField(listing.score_breakdown, {});

    return {
        // Core listing data
        id: listing.id,
        scrape_run_id: listing.scrape_run_id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        url: listing.url,
        location: listing.location,
        distance_km: listing.distance_km,
        platform: listing.source, // Business term for frontend
        source: listing.source,   // Technical term kept for compatibility
        posted_at: listing.posted_at,
        published_at: listing.posted_at,
        score: listing.score,
        status: listing.status,

        // Images
        image_url: images[0] || null,
        images: images,

        // Scoring details (extracted from score_breakdown JSON)
        ...extractScoringDetails(scoreBreakdown),
        ...extractCardmarketDetails(scoreBreakdown),
        ...extractConditionDetails(scoreBreakdown),

        // Additional scoring fields
        estimated_gain_min: scoreBreakdown.estimated_gain_min ?? null,
        estimated_gain_max: scoreBreakdown.estimated_gain_max ?? null,
        ebay_sold_comparables: scoreBreakdown.ebay_sold_comparables || [],
        opportunity_signals: scoreBreakdown.signals || [],
        risk_signals: scoreBreakdown.risks || [],
        score_breakdown: scoreBreakdown,
        score_subscores: scoreBreakdown.subscores || null,
        score_explanation: scoreBreakdown.explanation || null,
        series_detected: scoreBreakdown.series_detected || [],
        explanation: listing.notes || null, // Map 'notes' to 'explanation'

        // History / alerts MVP
        history: listing.history || null,
        has_price_drop: Boolean(listing.history?.price_drop_amount > 0),
        price_drop_amount: listing.history?.price_drop_amount || 0,
        price_drop_percent: listing.history?.price_drop_percent || 0,

        // Metadata
        scraped_at: listing.scraped_at
    };
}

/**
 * Enrich listing with history data - Decorator Pattern
 * Adds price history tracking data to a listing object
 * 
 * Note: This is a separate function not merged into mapListing because:
 * - History requires an additional DB query which has a performance cost
 * - Not always needed, for example list view vs detail view
 * - Follows Single Responsibility Principle
 * 
 * @param {Object} listing - Database listing object
 * @returns {Object|null} Listing with history or null
 * 
 * @example
 * const listing = { id: 1, price: 50 }
 * withHistory(listing) // Returns { id: 1, price: 50, history: {...} }
 */
export function withHistory(listing) {
    if (!listing) return null;
    return {
        ...listing,
        history: listingHistoryRepo.getListingHistory(listing.id),
    };
}