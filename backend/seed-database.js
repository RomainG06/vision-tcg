#!/usr/bin/env node
/**
 * Quick seed script - Run scraping and populate database
 * Usage: node seed-database.js
 */

import { LeboncoinFetcher } from './src/fetchers/leboncoin.js';
import { VintedFetcher } from './src/fetchers/vinted.js';
import { logger } from './src/utils/logger.js';
import { initDatabase, run, close } from './src/db/database.js';

// Silence debug logs
process.env.LOG_LEVEL = 'info';

async function seedDatabase() {
  logger.info('🌱 Starting database seed...\n');
  
  try {
    // Initialize database
    await initDatabase();
    logger.info('✅ Database initialized\n');
    
    // Check if already has data
    const db = await import('./src/db/database.js');
    const existingCount = await db.all('SELECT COUNT(*) as count FROM listings');
    
    if (existingCount[0].count > 0) {
      logger.info(`📊 Database already has ${existingCount[0].count} listings`);
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Clear and reseed? (y/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        await run('DELETE FROM listings');
        logger.info('✅ Cleared existing listings\n');
      } else {
        logger.info('❌ Seed cancelled');
        await close();
        process.exit(0);
      }
    }
    
    // Scrape Leboncoin (DISABLED - anti-bot too aggressive)
    logger.info('⏭️  Skipping Leboncoin (anti-bot protection)...\n');
    const lbcListings = [];
    
    /*
    logger.info('🔍 Scraping Leboncoin...');
    const lbcFetcher = new LeboncoinFetcher();
    const lbcListings = await lbcFetcher.fetch('pokemon cartes wizards', {
      location: 'nice',
      radius: 50,
      maxResults: 10
    });
    logger.info(`✅ Found ${lbcListings.length} listings on Leboncoin\n`);
    */
    
    // Scrape Vinted
    logger.info('🔍 Scraping Vinted...');
    const vintedFetcher = new VintedFetcher();
    const vintedListings = await vintedFetcher.fetch('pokemon cartes wizards', {
      location: 'nice',
      radius: 50,
      maxResults: 20  // Increased since Leboncoin is disabled
    });
    logger.info(`✅ Found ${vintedListings.length} listings on Vinted\n`);
    
    // Combine and save
    const allListings = [...lbcListings, ...vintedListings];
    logger.info(`💾 Saving ${allListings.length} total listings to database...`);
    
    for (const listing of allListings) {
      await run(`
        INSERT OR REPLACE INTO listings (
          id, title, description, price, url, image_url, location, 
          distance_km, platform, seller_type, published_at, card_count,
          estimated_value_min, estimated_value_max, score, confidence,
          opportunity_signals, risk_signals, explanation, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        listing.id,
        listing.title,
        listing.description || '',
        listing.price,
        listing.url,
        listing.image_url || listing.images?.[0] || null,
        listing.location,
        listing.distance_km || null,
        listing.platform,
        listing.seller_type || 'unknown',
        listing.published_at || new Date().toISOString(),
        listing.card_count || null,
        listing.estimated_value_min || null,
        listing.estimated_value_max || null,
        listing.score || 0,
        listing.confidence || null,
        JSON.stringify(listing.opportunity_signals || []),
        JSON.stringify(listing.risk_signals || []),
        listing.explanation || null,
        JSON.stringify(listing)
      ]);
    }
    
    logger.info(`✅ Saved ${allListings.length} listings to database\n`);
    
    // Display summary
    logger.info('📊 Summary:');
    logger.info(`   Leboncoin: ${lbcListings.length} listings`);
    logger.info(`   Vinted: ${vintedListings.length} listings`);
    logger.info(`   Total: ${allListings.length} listings`);
    logger.info(`   Average score: ${(allListings.reduce((sum, l) => sum + (l.score || 0), 0) / allListings.length).toFixed(1)}\n`);
    
    logger.info('✅ Database seeded successfully!');
    logger.info('🚀 Start frontend with: cd frontend && npm run dev\n');
    
    await close();
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Seed failed:', error.message);
    logger.error(error.stack);
    await close();
    process.exit(1);
  }
}

seedDatabase();
