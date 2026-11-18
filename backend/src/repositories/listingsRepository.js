/**
 * Listings Repository
 * Interface d'accès aux annonces en base
 */

import { getDatabase } from '../db/database.js';

/**
 * Insère ou met à jour une annonce
 * @param {Object} listing - Annonce normalisée
 * @returns {number} ID de l'annonce insérée/mise à jour
 */
export function upsertListing(listing) {
  const db = getDatabase();
  
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
    notes,
  } = listing;

  const stmt = db.prepare(`
    INSERT INTO listings (
      scrape_run_id, source, external_id, url, title, description,
      price, location, lat, lon, distance_km, images, posted_at,
      scraped_at, raw_html, status, score, score_breakdown, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, external_id) DO UPDATE SET
      url = excluded.url,
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
      raw_html = excluded.raw_html
  `);

  stmt.run([
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
    notes,
  ]);

  stmt.free();

  // Récupérer l'ID de la row insérée/mise à jour
  const result = db.exec(`
    SELECT id FROM listings 
    WHERE source = ? AND external_id = ?
  `, [source, external_id]);

  return result[0]?.values[0]?.[0] || null;
}

/**
 * Récupère toutes les annonces avec filtres
 * @param {Object} filters - Filtres optionnels
 * @returns {Array} Annonces
 */
export function getListings(filters = {}) {
  const db = getDatabase();
  
  let query = 'SELECT * FROM listings WHERE 1=1';
  const params = [];

  // Filtres
  if (filters.source) {
    query += ' AND source = ?';
    params.push(filters.source);
  }

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.min_price !== undefined) {
    query += ' AND price >= ?';
    params.push(filters.min_price);
  }

  if (filters.max_price !== undefined) {
    query += ' AND price <= ?';
    params.push(filters.max_price);
  }

  if (filters.max_distance_km !== undefined) {
    query += ' AND distance_km <= ?';
    params.push(filters.max_distance_km);
  }

  if (filters.min_score !== undefined) {
    query += ' AND score >= ?';
    params.push(filters.min_score);
  }

  // Tri par défaut: score DESC, puis date DESC
  const orderBy = filters.order_by || 'score';
  const orderDir = filters.order_dir || 'DESC';
  query += ` ORDER BY ${orderBy} ${orderDir}`;

  // Pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = db.exec(query, params);
  
  if (!result.length) return [];

  const columns = result[0].columns;
  const rows = result[0].values;

  return rows.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

/**
 * Récupère une annonce par ID
 */
export function getListingById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM listings WHERE id = ?', [id]);
  
  if (!result.length || !result[0].values.length) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];

  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });

  return obj;
}

/**
 * Met à jour le statut d'une annonce
 */
export function updateListingStatus(id, status, notes = null) {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE listings 
    SET status = ?, notes = ?
    WHERE id = ?
  `);

  stmt.run([status, notes, id]);
  stmt.free();
}

/**
 * Met à jour le score d'une annonce
 */
export function updateListingScore(id, score, scoreBreakdown = null) {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE listings 
    SET score = ?, score_breakdown = ?
    WHERE id = ?
  `);

  stmt.run([score, JSON.stringify(scoreBreakdown), id]);
  stmt.free();
}

/**
 * Compte les annonces selon les filtres
 */
export function countListings(filters = {}) {
  const db = getDatabase();
  
  let query = 'SELECT COUNT(*) as count FROM listings WHERE 1=1';
  const params = [];

  if (filters.source) {
    query += ' AND source = ?';
    params.push(filters.source);
  }

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.min_price !== undefined) {
    query += ' AND price >= ?';
    params.push(filters.min_price);
  }

  if (filters.max_price !== undefined) {
    query += ' AND price <= ?';
    params.push(filters.max_price);
  }

  if (filters.max_distance_km !== undefined) {
    query += ' AND distance_km <= ?';
    params.push(filters.max_distance_km);
  }

  if (filters.min_score !== undefined) {
    query += ' AND score >= ?';
    params.push(filters.min_score);
  }

  const result = db.exec(query, params);
  return result[0]?.values[0]?.[0] || 0;
}
