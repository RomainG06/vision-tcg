import express from 'express';
import { logger } from '../utils/logger.js';
import { ListingRepository } from '../repositories/listing-repository.js';
import { ScrapeRunRepository } from '../repositories/scrape-run-repository.js';
import { getDatabaseInfo } from '../db/database.js';
import { startScrape } from '../services/scrape-service.js';

const router = express.Router();

// Initialize repositories
const listingRepo = new ListingRepository();
const scrapeRunRepo = new ScrapeRunRepository();

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
    opportunity_signals: scoreBreakdown.signals || [],
    risk_signals: scoreBreakdown.risks || [],
    quality: scoreBreakdown.quality || null,
    quality_tier: scoreBreakdown.quality?.quality_tier || null,
    action_suggestion: scoreBreakdown.quality?.action_suggestion || null,
    positive_reasons: scoreBreakdown.quality?.positive_reasons || [],
    risk_reasons: scoreBreakdown.quality?.risk_reasons || [],
    explanation: listing.notes || null, // Map 'notes' to 'explanation'
    
    // Metadata
    scraped_at: listing.scraped_at
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
      { method: 'PATCH', path: '/api/listings/:id', description: 'Update listing' },
      { method: 'PATCH', path: '/api/listings/:id/status', description: 'Update listing status' },
      { method: 'POST', path: '/api/listings/:id/watchlist', description: 'Mark listing as interesting' },
      { method: 'DELETE', path: '/api/listings/:id', description: 'Delete listing' },
      { method: 'POST', path: '/api/scrape/start', description: 'Start a marketplace scrape and save results' },
      { method: 'GET', path: '/api/scrape-runs', description: 'Get scrape runs history' },
      { method: 'GET', path: '/api/stats', description: 'Get statistics' },
      { method: 'GET', path: '/api/debug/db', description: 'Debug database path/count (dev)' }
    ]
  });
});

router.get('/debug/db', (req, res) => {
  try {
    res.json({
      ...getDatabaseInfo(),
      listing_count: listingRepo.count(),
      sample: listingRepo.findAll({ limit: 3, offset: 0, status: 'all' }).map((listing) => ({
        id: listing.id,
        title: listing.title,
        status: listing.status,
        source: listing.source,
      })),
    });
  } catch (error) {
    logger.error('Error fetching DB debug info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/scrape/start
 * Start a marketplace scrape. MVP is synchronous so the UI can show immediate results.
 */
router.post('/scrape/start', async (req, res) => {
  try {
    const result = await startScrape(req.body || {});
    res.json(result);
  } catch (error) {
    logger.error('Error starting scrape:', error);
    res.status(500).json({
      error: 'Scrape failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/listings
 * Get all listings with optional filters
 */
router.get('/listings', (req, res) => {
  try {
    const filters = {
      source: req.query.source,
      status: req.query.status || 'all', // Changed from 'new' to 'all' - show everything by default
      minScore: req.query.min_score ? parseFloat(req.query.min_score) : undefined,
      maxPrice: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
      maxDistance: req.query.max_distance ? parseFloat(req.query.max_distance) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const listings = listingRepo.findAll(filters);
    const total = listingRepo.count();
    
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
    
    res.json(mapListing(listing));
  } catch (error) {
    logger.error(`Error fetching listing ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/listings/:id
 * Update a listing (status, notes)
 */
router.patch('/listings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = {};
    
    if (req.body.status !== undefined) {
      updates.status = req.body.status;
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
    
    res.json(mapListing(updated));
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

    listingRepo.update(id, { status });
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(updated));
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
    const status = req.body.status || 'interested';

    listingRepo.update(id, { status });
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(updated));
  } catch (error) {
    logger.error(`Error adding listing ${req.params.id} to watchlist:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/listings/:id
 * Delete a listing from the local dashboard backlog.
 */
router.delete('/listings/:id', (req, res) => {
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
      passed: listingRepo.countByStatus('rejected'),
      interesting: listingRepo.countByStatus('interested'),
      new: listingRepo.countByStatus('new'),
      avgScore: Math.round(listingRepo.getAverageScore() * 10) / 10,
      avgPrice: Math.round(listingRepo.getAveragePrice() * 100) / 100,
      highScore: listingRepo.countHighScore(),
      bySource: listingRepo.countBySource()
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
