import { initDatabase } from './database.js';

async function migrate() {
  console.log('🔧 Running database migrations...');
  await initDatabase();
  console.log('✅ Migrations completed');
  process.exit(0);
}

migrate();
