import { all, get, run } from '../db/database.js';

/**
 * Repository for scrape_runs table
 * Tracks scraping session history
 */
export class ScrapeRunRepository {
  /**
   * Create a new scrape run
   * @param {Object} scrapeRun - Scrape run data
   * @param {string} scrapeRun.source - Source platform
   * @param {string} scrapeRun.query - Search query
   * @param {string} scrapeRun.status - Status (running, completed, failed)
   * @param {number} scrapeRun.results_count - Total results found
   * @param {number} scrapeRun.errors_count - Errors encountered
   * @param {string} scrapeRun.metadata - Additional metadata (JSON string)
   * @returns {number} Inserted row ID
   */
  create(scrapeRun = {}) {
    const {
      source = 'unknown',
      query = '',
      status = 'running',
      results_count = 0,
      errors_count = 0,
      metadata = null
    } = scrapeRun;
    
    const result = run(`
      INSERT INTO scrape_runs (started_at, source, query, status, results_count, errors_count, metadata)
      VALUES (datetime('now'), ?, ?, ?, ?, ?, ?)
    `, [source, query, status, results_count, errors_count, metadata]);
    
    return result.lastInsertRowid;
  }
  
  /**
   * Find a scrape run by ID
   * @param {number} id - Scrape run ID
   * @returns {Object|null} Scrape run object or null
   */
  findById(id) {
    return get('SELECT * FROM scrape_runs WHERE id = ?', [id]);
  }
  
  /**
   * Get all scrape runs with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.source - Filter by source
   * @param {string} filters.status - Filter by status
   * @param {number} filters.limit - Max results (default 50)
   * @returns {Array} Array of scrape runs
   */
  findAll(filters = {}) {
    let query = 'SELECT * FROM scrape_runs WHERE 1=1';
    const params = [];
    
    if (filters.source) {
      query += ' AND source = ?';
      params.push(filters.source);
    }
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY started_at DESC';
    
    const limit = filters.limit || 50;
    query += ' LIMIT ?';
    params.push(limit);
    
    return all(query, params);
  }
  
  /**
   * Update scrape run
   * @param {number} id - Scrape run ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Update result
   */
  update(id, updates) {
    const fields = [];
    const params = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    
    if (updates.results_count !== undefined) {
      fields.push('results_count = ?');
      params.push(updates.results_count);
    }
    
    if (updates.errors_count !== undefined) {
      fields.push('errors_count = ?');
      params.push(updates.errors_count);
    }
    
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      params.push(updates.metadata);
    }
    
    if (updates.status === 'completed' || updates.status === 'failed') {
      fields.push('completed_at = datetime(\'now\')');
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    params.push(id);
    return run(`UPDATE scrape_runs SET ${fields.join(', ')} WHERE id = ?`, params);
  }
  
  /**
   * Mark scrape run as completed
   * @param {number} id - Scrape run ID
   * @param {Object} stats - Final stats
   * @returns {Object} Update result
   */
  complete(id, stats = {}) {
    return this.update(id, {
      status: 'completed',
      ...stats
    });
  }
  
  /**
   * Mark scrape run as failed
   * @param {number} id - Scrape run ID
   * @param {string} errorMessage - Error message
   * @returns {Object} Update result
   */
  fail(id, errorMessage) {
    return this.update(id, {
      status: 'failed',
      metadata: JSON.stringify({ error: errorMessage })
    });
  }
  
  /**
   * Get latest scrape run
   * @param {string} source - Optional source filter
   * @returns {Object|null} Latest scrape run
   */
  getLatest(source = null) {
    if (source) {
      return get(
        'SELECT * FROM scrape_runs WHERE source = ? ORDER BY started_at DESC LIMIT 1',
        [source]
      );
    }
    return get('SELECT * FROM scrape_runs ORDER BY started_at DESC LIMIT 1');
  }
  
  /**
   * Get scrape run statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const total = get('SELECT COUNT(*) as count FROM scrape_runs');
    const completed = get('SELECT COUNT(*) as count FROM scrape_runs WHERE status = "completed"');
    const failed = get('SELECT COUNT(*) as count FROM scrape_runs WHERE status = "failed"');
    const totalResults = get('SELECT SUM(results_count) as sum FROM scrape_runs WHERE status = "completed"');
    
    return {
      total: total?.count || 0,
      completed: completed?.count || 0,
      failed: failed?.count || 0,
      total_results: totalResults?.sum || 0
    };
  }
  
  /**
   * Delete old scrape runs (cleanup)
   * @param {number} daysToKeep - Keep runs from last N days
   * @returns {Object} Delete result
   */
  deleteOlderThan(daysToKeep = 30) {
    return run(`
      DELETE FROM scrape_runs 
      WHERE started_at < datetime('now', '-' || ? || ' days')
    `, [daysToKeep]);
  }
}
