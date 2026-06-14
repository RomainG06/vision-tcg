import { Router } from 'express';
import { all, get as getOne, run } from '../db/database.js';
import { logger } from '../utils/logger.js';

export const router = Router();

/**
 * GET /api/docs - API documentation
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
      { method: 'GET', path: '/api/scrape-runs', description: 'Get scrape runs history' },
      { method: 'GET', path: '/api/stats', description: 'Get statistics' }
    ]
  });
});

/**
 * GET /api/listings
 * Get all listings with optional filters
 */
router.get('/listings', (req, res) => {
  try {
    const { 
      source, 
      status = 'new',
      min_score,
      max_price,
      max_distance,
      limit = 50,
      offset = 0
    } = req.query;
    
    let query = 'SELECT * FROM listings WHERE 1=1';
    const params = [];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (min_score) {
      query += ' AND score >= ?';
      params.push(parseFloat(min_score));
    }
    
    if (max_price) {
      query += ' AND price <= ?';
      params.push(parseFloat(max_price));
    }
    
    if (max_distance) {
      query += ' AND distance_km <= ?';
      params.push(parseFloat(max_distance));
    }
    
    query += ' ORDER BY score DESC, scraped_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const listings = all(query, params);
    
    const totalResult = getOne('SELECT COUNT(*) as count FROM listings WHERE 1=1');
    
    res.json({
      listings,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalResult ? totalResult.count : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching listings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/listings/:id
 * Get single listing by ID
 */
router.get('/listings/:id', (req, res) => {
  try {
    const listing = getOne('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(listing);
  } catch (error) {
    logger.error('Error fetching listing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/listings/:id
 * Update listing status or notes
 */
router.patch('/listings/:id', (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);
    
    run(`UPDATE listings SET ${updates.join(', ')} WHERE id = ?`, params);
    
    const updated = getOne('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    
    res.json(updated);
  } catch (error) {
    logger.error('Error updating listing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scrape-runs
 * Get scraping runs history
 */
router.get('/scrape-runs', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const runs = all(
      'SELECT * FROM scrape_runs ORDER BY started_at DESC LIMIT ?',
      [parseInt(limit)]
    );
    
    res.json({ runs });
  } catch (error) {
    logger.error('Error fetching scrape runs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Get statistics
 */
router.get('/stats', (req, res) => {
  try {
    const total = getOne('SELECT COUNT(*) as count FROM listings');
    const wizards = getOne('SELECT COUNT(*) as count FROM listings WHERE is_wizards = 1');
    const french = getOne('SELECT COUNT(*) as count FROM listings WHERE is_french = 1');
    const highScore = getOne('SELECT COUNT(*) as count FROM listings WHERE score >= 70');
    const avgScore = getOne('SELECT AVG(score) as avg FROM listings');
    const avgPrice = getOne('SELECT AVG(price) as avg FROM listings');
    
    const byStatus = all(`
      SELECT status, COUNT(*) as count 
      FROM listings 
      GROUP BY status
    `);
    
    const bySource = all(`
      SELECT source, COUNT(*) as count 
      FROM listings 
      GROUP BY source
    `);
    
    res.json({
      total_listings: total ? total.count : 0,
      wizards_count: wizards ? wizards.count : 0,
      french_count: french ? french.count : 0,
      high_score_count: highScore ? highScore.count : 0,
      avg_score: avgScore ? avgScore.avg : 0,
      avg_price: avgPrice ? avgPrice.avg : 0,
      by_status: byStatus,
      by_source: bySource
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
