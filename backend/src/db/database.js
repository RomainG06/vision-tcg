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

export { saveDatabase };
