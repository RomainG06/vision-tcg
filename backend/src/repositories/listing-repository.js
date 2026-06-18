import { all, get, run } from '../db/database.js';

/**
 * Repository for listings table
 * Centralizes all database operations for listings
 */
export class ListingRepository {
  buildFilterClause(filters = {}) {
    let clause = 'WHERE 1=1';
    const params = [];

    if (filters.source) {
      clause += ' AND source = ?';
      params.push(filters.source);
    }

    // Handle 'all' status as no filter
    if (filters.status && filters.status !== 'all') {
      clause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.minScore !== undefined) {
      clause += ' AND score >= ?';
      params.push(filters.minScore);
    }

    if (filters.maxPrice !== undefined) {
      clause += ' AND price <= ?';
      params.push(filters.maxPrice);
    }

    if (filters.maxDistance !== undefined) {
      clause += ' AND distance_km <= ?';
      params.push(filters.maxDistance);
    }

    return { clause, params };
  }

  /**
   * Find all listings with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.source - Filter by source (leboncoin, vinted, etc.)
   * @param {string} filters.status - Filter by status (new, interested, reviewed, rejected)
   * @param {number} filters.minScore - Minimum score
   * @param {number} filters.maxPrice - Maximum price
   * @param {number} filters.maxDistance - Maximum distance in km
   * @param {number} filters.limit - Max results (default 50)
   * @param {number} filters.offset - Pagination offset (default 0)
   * @returns {Array} Array of listings
   */
  findAll(filters = {}) {
    const { clause, params } = this.buildFilterClause(filters);
    let query = `SELECT * FROM listings ${clause}`;

    // Newest scan first so the dashboard shows fresh opportunities before old backlog.
    query += ' ORDER BY scrape_run_id DESC, datetime(COALESCE(scraped_at, posted_at)) DESC, score DESC';
    
    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return all(query, params);
  }
  
  /**
   * Find a single listing by ID
   * @param {number} id - Listing ID
   * @returns {Object|null} Listing object or null if not found
   */
  findById(id) {
    return get('SELECT * FROM listings WHERE id = ?', [id]);
  }
  
  /**
   * Find listing by source and external ID
   * @param {string} source - Source platform
   * @param {string} externalId - External ID from the platform
   * @returns {Object|null} Listing object or null if not found
   */
  findBySourceAndExternalId(source, externalId) {
    return get(
      'SELECT * FROM listings WHERE source = ? AND external_id = ?',
      [source, externalId]
    );
  }

  findExternalIdsBySource(source) {
    return all('SELECT external_id FROM listings WHERE source = ?', [source])
      .map(row => String(row.external_id))
      .filter(Boolean);
  }
  
  /**
   * Create or update a listing (UPSERT)
   * @param {Object} listing - Listing data
   * @returns {number} Inserted/updated row ID
   */
  upsert(listing) {
    const {
      scrape_run_id,
      source,
      external_id,
      url,
      title,
      description,
      price,
      location,
      lat,
      lon,
      distance_km,
      images,
      posted_at,
      scraped_at,
      raw_html,
      status,
      score,
      score_breakdown,
      notes
    } = listing;
    
    const result = run(`
      INSERT INTO listings (
        scrape_run_id, source, external_id, url, title, description,
        price, location, lat, lon, distance_km, images,
        posted_at, scraped_at, raw_html, status, score, score_breakdown, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source, external_id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        price = excluded.price,
        location = excluded.location,
        lat = excluded.lat,
        lon = excluded.lon,
        distance_km = excluded.distance_km,
        images = excluded.images,
        posted_at = excluded.posted_at,
        scraped_at = excluded.scraped_at,
        raw_html = excluded.raw_html,
        score = excluded.score,
        score_breakdown = excluded.score_breakdown
    `, [
      scrape_run_id, source, external_id, url, title, description,
      price, location, lat, lon, distance_km, images,
      posted_at, scraped_at, raw_html, status || 'new', score, score_breakdown, notes
    ]);
    
    return result;
  }
  
  /**
   * Update listing status
   * @param {number} id - Listing ID
   * @param {string} status - New status (new, interested, reviewed, rejected)
   * @returns {Object} Update result
   */
  updateStatus(id, status) {
    return run('UPDATE listings SET status = ? WHERE id = ?', [status, id]);
  }
  
  /**
   * Update listing notes
   * @param {number} id - Listing ID
   * @param {string} notes - Notes text
   * @returns {Object} Update result
   */
  updateNotes(id, notes) {
    return run('UPDATE listings SET notes = ? WHERE id = ?', [notes, id]);
  }
  
  /**
   * Update both status and notes
   * @param {number} id - Listing ID
   * @param {Object} updates - Updates object
   * @param {string} updates.status - New status
   * @param {string} updates.notes - New notes
   * @returns {Object} Update result
   */
  update(id, updates) {
    const fields = [];
    const params = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      params.push(updates.notes);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    params.push(id);
    return run(`UPDATE listings SET ${fields.join(', ')} WHERE id = ?`, params);
  }
  
  /**
   * Count total listings
   * @returns {number} Total count
   */
  count(filters = {}) {
    const { clause, params } = this.buildFilterClause(filters);
    const result = get(`SELECT COUNT(*) as count FROM listings ${clause}`, params);
    return result?.count || 0;
  }
  
  /**
   * Count listings by status
   * @param {string} status - Status to count
   * @returns {number} Count
   */
  countByStatus(status) {
    const result = get('SELECT COUNT(*) as count FROM listings WHERE status = ?', [status]);
    return result?.count || 0;
  }
  
  /**
   * Get average score
   * @returns {number} Average score
   */
  getAverageScore() {
    const result = get('SELECT AVG(score) as avg FROM listings');
    return result?.avg || 0;
  }
  
  /**
   * Get average price
   * @returns {number} Average price
   */
  getAveragePrice() {
    const result = get('SELECT AVG(price) as avg FROM listings WHERE price > 0');
    return result?.avg || 0;
  }
  
  /**
   * Count high score listings (score >= 70)
   * @returns {number} Count
   */
  countHighScore() {
    const result = get('SELECT COUNT(*) as count FROM listings WHERE score >= 70');
    return result?.count || 0;
  }
  
  /**
   * Get listings grouped by source
   * @returns {Array} Array of {source, count}
   */
  countBySource() {
    return all('SELECT source, COUNT(*) as count FROM listings GROUP BY source');
  }
  
  /**
   * Delete a listing
   * @param {number} id - Listing ID
   * @returns {Object} Delete result
   */
  delete(id) {
    return run('DELETE FROM listings WHERE id = ?', [id]);
  }
  
  /**
   * Delete all listings (for testing)
   * @returns {Object} Delete result
   */
  deleteAll() {
    return run('DELETE FROM listings');
  }
}
