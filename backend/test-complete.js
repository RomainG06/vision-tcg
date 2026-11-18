#!/usr/bin/env node
/**
 * Complete test: migrate + seed + query
 */
import { migrate } from './src/db/migrations.js';
import { seed } from './src/db/seed.js';
import { all, get } from './src/db/database.js';
import { logger } from './src/utils/logger.js';
import { unlinkSync, existsSync } from 'fs';

async function test() {
  const testDbPath = './test-complete.db';
  
  // Clean up previous test db
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
    logger.info('Cleaned up previous test database');
  }
  
  // Override DB path for test
  process.env.DB_PATH = testDbPath;
  
  try {
    logger.info('🧪 Starting complete database test...\n');
    
    // Step 1: Migrate
    logger.info('Step 1: Running migrations...');
    await migrate();
    logger.info('✅ Migrations successful\n');
    
    // Step 2: Seed
    logger.info('Step 2: Seeding database...');
    await seed();
    logger.info('✅ Seeding successful\n');
    
    // Step 3: Query data
    logger.info('Step 3: Querying data...');
    
    const scrapeRuns = all('SELECT * FROM scrape_runs');
    logger.info(`   Scrape runs: ${scrapeRuns.length}`);
    
    const listings = all('SELECT * FROM listings');
    logger.info(`   Listings: ${listings.length}`);
    
    const keywords = all('SELECT * FROM keywords');
    logger.info(`   Keywords: ${keywords.length}`);
    
    // Step 4: Test queries
    logger.info('\nStep 4: Testing queries...');
    
    const wizardsListings = all('SELECT * FROM listings WHERE is_wizards = 1');
    logger.info(`   Wizards listings: ${wizardsListings.length}`);
    
    const highScoreListings = all('SELECT * FROM listings WHERE score >= 70 ORDER BY score DESC');
    logger.info(`   High score (>=70): ${highScoreListings.length}`);
    
    const topListing = get('SELECT * FROM listings ORDER BY score DESC LIMIT 1');
    logger.info(`   Top listing: "${topListing.title}" (score: ${topListing.score})`);
    
    // Step 5: Display sample data
    logger.info('\n📋 Sample Listings:');
    for (const listing of listings) {
      logger.info(`   ${listing.id}. [${listing.score}] ${listing.title}`);
      logger.info(`      Source: ${listing.source} | Price: ${listing.price}€ | Distance: ${listing.distance_km}km`);
    }
    
    logger.info('\n✅ ALL TESTS PASSED!');
    logger.info(`\n📦 Test database created: ${testDbPath}`);
    logger.info('🚀 You can now safely run:');
    logger.info('   npm run db:migrate');
    logger.info('   npm run db:seed');
    logger.info('   npm run dev');
    
    process.exit(0);
    
  } catch (error) {
    logger.error('\n❌ TEST FAILED:', error);
    console.error(error);
    process.exit(1);
  }
}

test();
