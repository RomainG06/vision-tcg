import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase, run } from './database.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database migrations
 */
export async function migrate() {
  logger.info('Running database migrations...');
  
  await initDatabase();
  
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      run(statement);
    } catch (error) {
      logger.error(`Migration error: ${error.message}`);
      throw error;
    }
  }
  
  logger.info('Migrations completed successfully');
}

/**
 * Check if migrations are needed
 */
export function needsMigration() {
  // For MVP, we'll just check if tables exist
  // In production, you'd use a migrations table
  return false;
}
