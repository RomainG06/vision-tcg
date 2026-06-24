import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';

export async function migrate() {
  console.log('🔧 Running database migrations...');
  await initDatabase();
  console.log('✅ Migrations completed');
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migrations failed:', error);
      process.exit(1);
    });
}
