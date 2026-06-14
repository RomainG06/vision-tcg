#!/usr/bin/env node
/**
 * CLI script to seed database
 */
import { migrate } from './migrations.js';
import { seed } from './seed.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    logger.info('Running migrations first...');
    await migrate();
    
    logger.info('Seeding database...');
    await seed();
    
    logger.info('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    console.error(error);
    process.exit(1);
  }
}

main();
