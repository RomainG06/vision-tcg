#!/usr/bin/env node
/**
 * Test script for real scraping
 * Tests fetchers against live sites
 */

import { LeboncoinFetcher } from './src/fetchers/leboncoin.js';
import { VintedFetcher } from './src/fetchers/vinted.js';
import { logger } from './src/utils/logger.js';
import { initDatabase, run, all, close } from './src/db/database.js';
import { scoreListing } from './src/scoring/scorer.js';

process.env.LOG_LEVEL = 'debug';

/**
 * Test Leboncoin scraping
 */
async function testLeboncoin() {
  logger.info('🔍 Testing Leboncoin scraper...\n');
  
  const fetcher = new LeboncoinFetcher();
  
  try {
    const listings = await fetcher.fetch('pokemon cartes wizards', {
      location: 'nice',
      radius: 50,
      maxResults: 3  // Limit to 3 for testing
    });
    
    logger.info(`✅ Found ${listings.length} listings on Leboncoin\n`);
    
    // Display results
    listings.forEach((listing, index) => {
      logger.info(`\n📦 Listing ${index + 1}:`);
      logger.info(`   Title: ${listing.title}`);
      logger.info(`   Price: ${listing.price}€`);
      logger.info(`   Location: ${listing.location}`);
      logger.info(`   Distance: ${listing.distance_km}km`);
      logger.info(`   Score: ${listing.score}`);
      logger.info(`   URL: ${listing.url}`);
      logger.info(`   Wizards: ${listing.is_wizards ? '⭐ YES' : 'NO'}`);
      logger.info(`   French: ${listing.is_french ? '🇫🇷 YES' : 'NO'}`);
      logger.info(`   Lot: ${listing.is_lot ? '📦 YES' : 'NO'}`);
    });
    
    return listings;
    
  } catch (error) {
    logger.error(`❌ Leboncoin scraping failed: ${error.message}`);
    if (error.message.includes('CAPTCHA')) {
      logger.warn('⚠️  CAPTCHA detected - manual intervention required');
      logger.warn('   Check screenshots/ directory for debug info');
    }
    throw error;
  } finally {
    await fetcher.close();
  }
}

/**
 * Test Vinted scraping
 */
async function testVinted() {
  logger.info('🔍 Testing Vinted scraper...\n');
  
  const fetcher = new VintedFetcher();
  
  try {
    const listings = await fetcher.fetch('pokemon cartes wizards', {
      maxResults: 3
    });
    
    logger.info(`✅ Found ${listings.length} listings on Vinted\n`);
    
    listings.forEach((listing, index) => {
      logger.info(`\n📦 Listing ${index + 1}:`);
      logger.info(`   Title: ${listing.title}`);
      logger.info(`   Price: ${listing.price}€`);
      logger.info(`   URL: ${listing.url}`);
    });
    
    return listings;
    
  } catch (error) {
    logger.error(`❌ Vinted scraping failed: ${error.message}`);
    throw error;
  } finally {
    await fetcher.close();
  }
}

/**
 * Save listings to database
 */
async function saveToDatabase(listings, source) {
  await initDatabase();
  
  // Insert scrape run
  const scrapeRunId = run(`
    INSERT INTO scrape_runs (source, query, total_found, status, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [source, 'pokemon cartes wizards', listings.length, 'completed', new Date().toISOString(), new Date().toISOString()]);
  
  logger.info(`\n💾 Saving ${listings.length} listings to database...`);
  
  // Insert listings
  for (const listing of listings) {
    run(`
      INSERT INTO listings (
        scrape_run_id, source, external_id, url, title, description,
        price, location, lat, lon, distance_km, image_url, posted_at,
        is_wizards, is_french, is_lot, card_count_estimate, score, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      scrapeRunId,
      listing.source,
      listing.external_id,
      listing.url,
      listing.title,
      listing.description,
      listing.price,
      listing.location,
      listing.lat,
      listing.lon,
      listing.distance_km,
      listing.image_url,
      listing.posted_at,
      listing.is_wizards ? 1 : 0,
      listing.is_french ? 1 : 0,
      listing.is_lot ? 1 : 0,
      listing.card_count_estimate,
      listing.score,
      'new'
    ]);
  }
  
  logger.info('✅ Listings saved to database');
  
  close();
}

/**
 * Main test runner
 */
async function main() {
  logger.info('🚀 Starting real scraping test...\n');
  logger.info('⚠️  This will connect to real websites with headful browser\n');
  
  const args = process.argv.slice(2);
  const site = args[0] || 'leboncoin'; // Default to leboncoin
  const saveToDb = args.includes('--save');
  
  try {
    let listings = [];
    
    if (site === 'leboncoin' || site === 'all') {
      listings = await testLeboncoin();
      if (saveToDb && listings.length > 0) {
        await saveToDatabase(listings, 'leboncoin');
      }
    }
    
    if (site === 'vinted' || site === 'all') {
      logger.info('\n' + '='.repeat(60) + '\n');
      listings = await testVinted();
      if (saveToDb && listings.length > 0) {
        await saveToDatabase(listings, 'vinted');
      }
    }
    
    logger.info('\n✅ Test completed successfully!');
    logger.info(`\n📊 Summary:`);
    logger.info(`   - Site: ${site}`);
    logger.info(`   - Listings found: ${listings.length}`);
    logger.info(`   - Saved to DB: ${saveToDb ? 'YES' : 'NO (use --save flag)'}`);
    
    process.exit(0);
    
  } catch (error) {
    logger.error(`\n❌ Test failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

main();
