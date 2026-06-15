import initSqlJs from 'sql.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/dev.db');

let db = null;
let SQL = null;

export async function initDatabase() {
  // Initialiser sql.js
  SQL = await initSqlJs();
  
  // Charger la DB depuis le disque si elle existe
  try {
    const data = await fs.readFile(DB_PATH);
    db = new SQL.Database(data);
    console.log('📂 Database loaded from disk');
  } catch (err) {
    // Créer une nouvelle DB en mémoire
    db = new SQL.Database();
    console.log('✨ New database created in memory');
  }
  
  // Auto-save toutes les 30s
  setInterval(() => saveDatabase(), 30000);
  
  // Save on exit
  process.on('exit', () => {
    saveDatabase();
  });
  
  process.on('SIGINT', () => {
    saveDatabase();
    process.exit(0);
  });
  
  // Auto-migration: vérifier si les tables existent
  await runMigrations();
  
  return db;
}

async function runMigrations() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  
  try {
    // Vérifier si la table principale existe
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='listings'");
    
    if (result.length === 0) {
      // Tables n'existent pas, charger le schema
      const schema = await fs.readFile(schemaPath, 'utf-8');
      db.exec(schema);
      console.log('✅ Database schema created');
      await saveDatabase();
    } else {
      console.log('✅ Database schema already exists');
    }
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  }
}

function saveDatabase() {
  if (!db) return;
  
  try {
    const data = db.export();
    fs.writeFile(DB_PATH, data);
  } catch (err) {
    console.error('❌ Error saving database:', err);
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Execute a query and return all results
 */
export function all(query, params = []) {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

/**
 * Execute a query and return first result
 */
export function get(query, params = []) {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  
  return result;
}

/**
 * Execute a query (INSERT, UPDATE, DELETE)
 * Returns lastInsertRowid for INSERT statements
 */
export function run(query, params = []) {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  db.run(query, params);
  
  // If INSERT, return the last inserted ID
  if (query.trim().toUpperCase().startsWith('INSERT')) {
    const result = db.exec('SELECT last_insert_rowid()');
    if (result && result[0] && result[0].values && result[0].values[0]) {
      return result[0].values[0][0];
    }
  }
  
  return null;
}

/**
 * Close database connection
 */
export function close() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

export { saveDatabase };
