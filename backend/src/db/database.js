import initSqlJs from 'sql.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/dev.db');
const DB_DIR = path.dirname(DB_PATH);

let db = null;
let SQL = null;
let dbDirty = false;
let lastLoadedMtimeMs = 0;
let autosaveStarted = false;

function getDbMtimeMs() {
  try {
    return fsSync.statSync(DB_PATH).mtimeMs;
  } catch {
    return 0;
  }
}

function updateLoadedMtime() {
  lastLoadedMtimeMs = getDbMtimeMs();
}

function reloadDatabaseIfChangedSync() {
  if (!db || !SQL) return;

  // Never discard in-memory writes that are not persisted yet.
  if (dbDirty) return;

  const diskMtime = getDbMtimeMs();
  if (diskMtime > 0 && diskMtime > lastLoadedMtimeMs + 1) {
    const data = fsSync.readFileSync(DB_PATH);
    db.close();
    db = new SQL.Database(data);
    lastLoadedMtimeMs = diskMtime;
    console.log('🔄 Database reloaded from disk');
  }
}

export async function initDatabase() {
  // Initialiser sql.js
  SQL = await initSqlJs();
  
  // Créer le dossier data/ s'il n'existe pas
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    // Ignore si déjà existe
  }
  
  // Charger la DB depuis le disque si elle existe
  try {
    const data = await fs.readFile(DB_PATH);
    db = new SQL.Database(data);
    updateLoadedMtime();
    dbDirty = false;
    console.log(`📂 Database loaded from disk: ${DB_PATH}`);
  } catch (err) {
    // Créer une nouvelle DB en mémoire
    db = new SQL.Database();
    lastLoadedMtimeMs = 0;
    dbDirty = true;
    console.log(`✨ New database created in memory: ${DB_PATH}`);
  }
  
  // Auto-save toutes les 30s seulement s'il y a des écritures non persistées.
  // Important: ne pas ré-écrire une vieille DB en mémoire par-dessus un seed externe.
  if (!autosaveStarted) {
    autosaveStarted = true;
    setInterval(() => saveDatabaseSync(), 30000);
    
    // Save on exit
    process.on('exit', () => {
      saveDatabaseSync();
    });
    
    process.on('SIGINT', () => {
      saveDatabaseSync();
      process.exit(0);
    });
  }
  
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
      dbDirty = true;
      console.log('✅ Database schema created');
      await saveDatabase(true);
    } else {
      console.log('✅ Database schema already exists');
    }
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  }
}

async function saveDatabase(force = false) {
  if (!db || (!force && !dbDirty)) return;
  
  try {
    const data = db.export();
    await fs.writeFile(DB_PATH, data);
    dbDirty = false;
    updateLoadedMtime();
  } catch (err) {
    console.error('❌ Error saving database:', err);
  }
}

function saveDatabaseSync(force = false) {
  if (!db || (!force && !dbDirty)) return;
  
  try {
    const data = db.export();
    fsSync.writeFileSync(DB_PATH, data);
    dbDirty = false;
    updateLoadedMtime();
  } catch (err) {
    console.error('❌ Error saving database:', err);
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  reloadDatabaseIfChangedSync();
  return db;
}

/**
 * Execute a query and return all results
 */
export function all(query, params = []) {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  reloadDatabaseIfChangedSync();
  
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
  reloadDatabaseIfChangedSync();
  
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

  // If another process seeded the DB while this server was running,
  // reload before applying writes to avoid overwriting fresh disk data.
  reloadDatabaseIfChangedSync();
  
  db.run(query, params);
  
  // CRITICAL: Save to disk immediately after write operations
  const upperQuery = query.trim().toUpperCase();
  if (upperQuery.startsWith('INSERT') || upperQuery.startsWith('UPDATE') || upperQuery.startsWith('DELETE')) {
    dbDirty = true;
    saveDatabaseSync(true);
  }
  
  // If INSERT, return the last inserted ID
  if (upperQuery.startsWith('INSERT')) {
    const result = db.exec('SELECT last_insert_rowid()');
    if (result && result[0] && result[0].values && result[0].values[0]) {
      return result[0].values[0][0];
    }
  }
  
  return null;
}

export function getDatabaseInfo() {
  return {
    path: DB_PATH,
    exists: fsSync.existsSync(DB_PATH),
    diskMtimeMs: getDbMtimeMs(),
    lastLoadedMtimeMs,
    dirty: dbDirty,
  };
}

/**
 * Close database connection
 */
export async function close() {
  if (db) {
    await saveDatabase();
    db.close();
    db = null;
  }
}

export { saveDatabase };
