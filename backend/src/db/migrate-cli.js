#!/usr/bin/env node
/**
 * CLI script to run database migrations
 */
import { migrate } from './migrations.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    logger.info('Starting database migration...');
    await migrate();
    logger.info('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    console.error(error);
    process.exit(1);
  }
}

main();
