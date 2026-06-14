import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

let db = null;
let SQL = null;

/**
 * Initialize SQL.js and load/create database
 */
export async function initDatabase() {
  if (db) return db;
  
  SQL = await initSqlJs();
  
  const dbPath = config.database.path;
  
  if (existsSync(dbPath)) {
    logger.info(`Loading existing database from ${dbPath}`);
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    logger.info(`Creating new database at ${dbPath}`);
    db = new SQL.Database();
  }
  
  return db;
}

/**
 * Save database to disk
 */
export function saveDatabase() {
  if (!db) return;
  
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(config.database.path, buffer);
  logger.debug(`Database saved to ${config.database.path}`);
}

/**
 * Execute a query and return results
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Results
 */
export function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL statement
 * @param {Array} params - Statement parameters
 */
export function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  
  db.run(sql, params);
  saveDatabase(); // Auto-save after writes
}

/**
 * Execute multiple statements in a transaction
 * @param {Function} callback - Function containing db operations
 */
export function transaction(callback) {
  if (!db) throw new Error('Database not initialized');
  
  try {
    db.run('BEGIN TRANSACTION');
    callback();
    db.run('COMMIT');
    saveDatabase();
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}

/**
 * Get a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null}
 */
export function get(sql, params = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Get all rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array}
 */
export function all(sql, params = []) {
  return query(sql, params);
}

/**
 * Close database connection
 */
export function close() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    logger.info('Database closed');
  }
}

// Auto-save every 30 seconds
setInterval(() => {
  if (db) {
    saveDatabase();
  }
}, 30000);

// Save on process exit
process.on('exit', () => {
  close();
});

process.on('SIGINT', () => {
  close();
  process.exit(0);
});

export { db };
