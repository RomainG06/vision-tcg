import { Router } from 'express';
import Database from 'better-sqlite3';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export const router = Router();

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
    
    const db = new Database(config.database.path, { readonly: true });
    
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
    
    const listings = db.prepare(query).all(...params);
    
    const total = db.prepare('SELECT COUNT(*) as count FROM listings WHERE 1=1').get();
    
    db.close();
    
    res.json({
      listings,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: total.count
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
    const db = new Database(config.database.path, { readonly: true });
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    db.close();
    
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
    const db = new Database(config.database.path);
    
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
      db.close();
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    params.push(req.params.id);
    
    const result = db.prepare(`
      UPDATE listings 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `).run(...params);
    
    if (result.changes === 0) {
      db.close();
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    db.close();
    
    res.json(updated);
  } catch (error) {
    logger.error('Error updating listing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scrape-runs
 * Get scraping run history
 */
router.get('/scrape-runs', (req, res) => {
  try {
    const db = new Database(config.database.path, { readonly: true });
    const runs = db.prepare(`
      SELECT * FROM scrape_runs 
      ORDER BY started_at DESC 
      LIMIT 50
    `).all();
    db.close();
    
    res.json({ runs });
  } catch (error) {
    logger.error('Error fetching scrape runs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Get summary statistics
 */
router.get('/stats', (req, res) => {
  try {
    const db = new Database(config.database.path, { readonly: true });
    
    const stats = {
      total_listings: db.prepare('SELECT COUNT(*) as count FROM listings').get().count,
      by_status: db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM listings 
        GROUP BY status
      `).all(),
      by_source: db.prepare(`
        SELECT source, COUNT(*) as count 
        FROM listings 
        GROUP BY source
      `).all(),
      avg_score: db.prepare('SELECT AVG(score) as avg FROM listings').get().avg,
      high_score_count: db.prepare('SELECT COUNT(*) as count FROM listings WHERE score >= 70').get().count,
      wizards_count: db.prepare('SELECT COUNT(*) as count FROM listings WHERE is_wizards = 1').get().count
    };
    
    db.close();
    
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/docs
 * Simple API documentation
 */
router.get('/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    endpoints: {
      'GET /api/listings': 'List all listings with filters',
      'GET /api/listings/:id': 'Get single listing',
      'PATCH /api/listings/:id': 'Update listing status/notes',
      'GET /api/scrape-runs': 'Get scraping history',
      'GET /api/stats': 'Get summary statistics',
      'GET /health': 'Health check'
    }
  });
});
