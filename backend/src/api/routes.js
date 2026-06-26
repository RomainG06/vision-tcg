import express from 'express';
import { logger } from '../utils/logger.js';
import { authenticate } from './auth.js';
import { validateInteger, validateFloat, validateEnum } from '../utils/url-validator.js';
import { config } from '../utils/config.js';
import { ListingRepository } from '../repositories/listing-repository.js';
import { ScrapeRunRepository } from '../repositories/scrape-run-repository.js';
import { ListingHistoryRepository } from '../repositories/listing-history-repository.js';
import { AlertRepository } from '../repositories/alert-repository.js';
import { getDatabaseInfo } from '../db/database.js';
import { createScrapeJobManager, ScrapeAlreadyRunningError } from '../services/scrape-job-manager.js';
import { assertValidListingStatus, normalizeListingStatus } from '../services/listing-status.js';

const router = express.Router();

// Initialize repositories
const listingRepo = new ListingRepository();
const scrapeRunRepo = new ScrapeRunRepository();
const listingHistoryRepo = new ListingHistoryRepository();
const alertRepo = new AlertRepository();
const scrapeJobManager = createScrapeJobManager({
  startScrape: async (payload) => {
    const { startScrape } = await import('../services/scrape-service.js');
    return startScrape(payload);
  },
});

/**
 * Map database listing to frontend format
 */
function parseJsonField(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapListing(listing) {
  if (!listing) return null;

  // Parse JSON fields. Scraped data can store images as a JSON array or a single URL string.
  const parsedImages = parseJsonField(listing.images, null);
  const images = Array.isArray(parsedImages) ? parsedImages : (listing.images ? [listing.images] : []);
  const scoreBreakdown = parseJsonField(listing.score_breakdown, {});

  return {
    id: listing.id,
    scrape_run_id: listing.scrape_run_id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    url: listing.url,
    location: listing.location,
    distance_km: listing.distance_km,
    platform: listing.source, // Map 'source' to 'platform'
    source: listing.source,
    posted_at: listing.posted_at,
    published_at: listing.posted_at,
    score: listing.score,
    status: listing.status,

    // Images
    image_url: images[0] || null,
    images: images,

    // Scoring details (from score_breakdown JSON)
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
    estimate_cardmarket_product_id: scoreBreakdown.estimate_cardmarket_product_id || null,
    estimate_cardmarket_product_name: scoreBreakdown.estimate_cardmarket_product_name || null,
    estimate_cardmarket_product_url: scoreBreakdown.estimate_cardmarket_product_url || null,
    estimate_cardmarket_expansion: scoreBreakdown.estimate_cardmarket_expansion || null,
    estimate_condition_key: scoreBreakdown.estimate_condition_key || null,
    estimate_condition_label: scoreBreakdown.estimate_condition_label || null,
    estimate_total_sample_count: scoreBreakdown.estimate_total_sample_count || null,
    condition: scoreBreakdown.card_condition_label || scoreBreakdown.estimate_condition_label || null,
    condition_key: scoreBreakdown.card_condition_key || scoreBreakdown.estimate_condition_key || null,
    estimated_gain_min: scoreBreakdown.estimated_gain_min ?? null,
    estimated_gain_max: scoreBreakdown.estimated_gain_max ?? null,
    ebay_sold_comparables: scoreBreakdown.ebay_sold_comparables || [],
    opportunity_signals: scoreBreakdown.signals || [],
    risk_signals: scoreBreakdown.risks || [],
    score_breakdown: scoreBreakdown,
    score_subscores: scoreBreakdown.subscores || null,
    score_explanation: scoreBreakdown.explanation || null,
    series_detected: scoreBreakdown.series_detected || [],
    quality: scoreBreakdown.quality || null,
    quality_tier: scoreBreakdown.quality?.quality_tier || null,
    action_suggestion: scoreBreakdown.quality?.action_suggestion || null,
    positive_reasons: scoreBreakdown.quality?.positive_reasons || [],
    risk_reasons: scoreBreakdown.quality?.risk_reasons || [],
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

function withHistory(listing) {
  if (!listing) return null;
  return {
    ...listing,
    history: listingHistoryRepo.getListingHistory(listing.id),
  };
}

/**
 * GET /api/docs
 * API documentation
 */
router.get('/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    description: 'Vision TCG API - Détection et scoring de lots Pokemon',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/api/docs', description: 'This documentation' },
      { method: 'GET', path: '/api/listings', description: 'List all listings with filters' },
      { method: 'GET', path: '/api/listings/:id', description: 'Get single listing' },
      { method: 'GET', path: '/api/listings/:id/history', description: 'Get listing price/history tracking' },
      { method: 'PATCH', path: '/api/listings/:id', description: 'Update listing' },
      { method: 'PATCH', path: '/api/listings/:id/status', description: 'Update listing status' },
      { method: 'POST', path: '/api/listings/:id/watchlist', description: 'Mark listing as interesting' },
      { method: 'DELETE', path: '/api/listings', description: 'Clear all local dashboard listings' },
      { method: 'DELETE', path: '/api/listings/:id', description: 'Delete listing' },
      { method: 'POST', path: '/api/scrape/start', description: 'Start a marketplace scrape and save results' },
      { method: 'GET', path: '/api/jobs/status', description: 'Get current scrape job status' },
      { method: 'GET', path: '/api/alerts', description: 'Get recent high-score and price-drop alerts' },
      { method: 'GET', path: '/api/scrape-runs', description: 'Get scrape runs history' },
      { method: 'GET', path: '/api/stats', description: 'Get statistics' },
      { method: 'GET', path: '/api/debug/db', description: 'Debug database path/count (dev)' }
    ]
  });
});

// Debug endpoint removed for security - use logging or proper monitoring tools
// If needed in development, protect with authentication:
// router.get('/debug/db', authenticate, (req, res) => { ... });

/**
 * POST /api/scrape/start
 * Start a marketplace scrape. MVP is synchronous so the UI can show immediate results.
 * Protected: requires authentication
 */
router.post('/scrape/start', authenticate, async (req, res) => {
  try {
    const result = await scrapeJobManager.start(req.body || {});
    res.json(result);
  } catch (error) {
    if (error instanceof ScrapeAlreadyRunningError) {
      return res.status(409).json({
        error: 'Scrape already running',
        message: 'Une chasse est déjà en cours. Attends la fin avant de relancer.',
        job: error.status,
      });
    }

    logger.error('Error starting scrape:', error);
    res.status(500).json({
      error: 'Scrape failed',
      message: error.message,
    });
  }
});

router.get('/jobs/status', (req, res) => {
  res.json(scrapeJobManager.getStatus());
});

/**
 * GET /api/listings
 * Get all listings with optional filters
 */
router.get('/listings', (req, res) => {
  try {
    const requestedStatus = req.query.status || 'all';

    // Validate all inputs with bounds
    const filters = {
      source: validateEnum(req.query.source, ['vinted', 'leboncoin', 'facebook'], null),
      status: requestedStatus === 'all' ? 'all' : normalizeListingStatus(requestedStatus),
      minScore: req.query.min_score ? validateFloat(req.query.min_score, 0, 100, 0) : undefined,
      maxPrice: req.query.max_price ? validateFloat(req.query.max_price, 0, 999999, 10000) : undefined,
      maxDistance: req.query.max_distance ? validateFloat(req.query.max_distance, 0, 10000, 50) : undefined,
      limit: validateInteger(req.query.limit, 1, 500, 50),
      offset: validateInteger(req.query.offset, 0, 999999, 0)
    };

    const listings = listingRepo.findAll(filters).map(withHistory);
    const total = listingRepo.count(filters);

    res.json({
      listings: listings.map(mapListing),
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/alerts
 * Simple MVP alerts: high score and price drop.
 */
router.get('/alerts', (req, res) => {
  try {
    const alerts = alertRepo.findRecent({
      type: req.query.type,
      unreadOnly: req.query.unread === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    });

    res.json({
      alerts,
      summary: alertRepo.getSummary(),
      history: listingHistoryRepo.getSummary(),
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:id/history
 * Price/history details for a listing.
 */
router.get('/listings/:id/history', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const listing = listingRepo.findById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({
      history: listingHistoryRepo.getListingHistory(id),
      price_events: listingHistoryRepo.getPriceEvents(id),
    });
  } catch (error) {
    logger.error(`Error fetching listing history ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:id
 * Get a single listing by ID
 */
router.get('/listings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const listing = listingRepo.findById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(listing)));
  } catch (error) {
    logger.error(`Error fetching listing ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/listings/:id
 * Update a listing (status, notes)
 * Protected: requires authentication
 */
router.patch('/listings/:id', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = {};

    if (req.body.status !== undefined) {
      updates.status = assertValidListingStatus(req.body.status);
    }

    if (req.body.notes !== undefined) {
      updates.notes = req.body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    listingRepo.update(id, updates);
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(updated)));
  } catch (error) {
    logger.error(`Error updating listing ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/listings/:id/status
 * Compatibility endpoint used by the detail modal.
 */
router.patch('/listings/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }

    listingRepo.update(id, { status: assertValidListingStatus(status) });
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(updated)));
  } catch (error) {
    logger.error(`Error updating listing status ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/listings/:id/watchlist
 * Compatibility endpoint used by the detail modal.
 */
router.post('/listings/:id/watchlist', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const status = assertValidListingStatus(req.body.status || 'interested');

    listingRepo.update(id, { status });
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(updated)));
  } catch (error) {
    logger.error(`Error adding listing ${req.params.id} to watchlist:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/listings
 * Clear all local dashboard listings. Scrape history/seen cache are preserved.
 * Protected: requires authentication
 */
router.delete('/listings', authenticate, (req, res) => {
  try {
    const before = listingRepo.count();
    listingRepo.deleteAll();
    res.json({ deleted: before });
  } catch (error) {
    logger.error('Error clearing listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/listings/:id
 * Delete a listing from the local dashboard backlog.
 * Protected: requires authentication
 */
router.delete('/listings/:id', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = listingRepo.findById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    listingRepo.delete(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting listing ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/scrape-runs
 * Get scrape runs history
 */
router.get('/scrape-runs', (req, res) => {
  try {
    const filters = {
      source: req.query.source,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const runs = scrapeRunRepo.findAll(filters);
    const stats = scrapeRunRepo.getStats();

    res.json({
      runs,
      stats
    });
  } catch (error) {
    logger.error('Error fetching scrape runs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats
 * Get overall statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      total: listingRepo.count(),
      viewed: listingRepo.countByStatus('reviewed'),
      passed: listingRepo.countByStatus('ignored'),
      ignored: listingRepo.countByStatus('ignored'),
      contacted: listingRepo.countByStatus('contacted'),
      interesting: listingRepo.countByStatus('interested'),
      watchlist: listingRepo.countByStatus('interested'),
      new: listingRepo.countByStatus('new'),
      avgScore: Math.round(listingRepo.getAverageScore() * 10) / 10,
      avgPrice: Math.round(listingRepo.getAveragePrice() * 100) / 100,
      highScore: listingRepo.countHighScore(),
      alerts: alertRepo.getSummary(),
      history: listingHistoryRepo.getSummary(),
      bySource: listingRepo.countBySource()
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
