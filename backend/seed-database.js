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
    
    // Create a scrape_run entry
    logger.info('Creating scrape_run entry...');
    const scrapeRunResult = await run(`
      INSERT INTO scrape_runs (started_at, completed_at, source, query, status, results_count, errors_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      new Date().toISOString(),
      new Date().toISOString(),
      'seed-script',
      'pokemon cartes wizards',
      'completed',
      allListings.length,
      0
    ]);
    logger.info(`✅ Scrape run created (ID: ${scrapeRunResult})`);
    
    let savedCount = 0;
    for (const listing of allListings) {
      try {
        // Adapter au schéma existant (old MVP schema)
        await run(`
          INSERT OR REPLACE INTO listings (
            scrape_run_id, source, external_id, url, title, description, 
            price, location, lat, lon, distance_km, images, posted_at, 
            scraped_at, status, score, score_breakdown, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          1, // scrape_run_id (fake ID for seed)
          listing.source || listing.platform || 'unknown', // source (was platform)
          listing.external_id || listing.id || String(Date.now()), // external_id (was id)
          listing.url,
          listing.title,
          listing.description || '',
          listing.price,
          listing.location,
          listing.lat || null,
          listing.lon || null,
          listing.distance_km || null,
          JSON.stringify(listing.images || [listing.image_url].filter(Boolean)),
          listing.posted_at || listing.published_at || new Date().toISOString(),
          new Date().toISOString(),
          'new',
          listing.score || 0,
          JSON.stringify({
            signals: listing.opportunity_signals || [],
            risks: listing.risk_signals || [],
            confidence: listing.confidence,
            estimated_value_min: listing.estimated_value_min,
            estimated_value_max: listing.estimated_value_max
          }),
          listing.opportunity_explanation || listing.explanation || null
        ]);
        savedCount++;
        if (savedCount % 5 === 0) {
          logger.info(`   Progress: ${savedCount}/${allListings.length} saved...`);
        }
      } catch (insertError) {
        logger.error(`❌ Failed to insert listing "${listing.title}":`, insertError.message);
        logger.error('Listing data:', JSON.stringify({
          source: listing.source || listing.platform,
          external_id: listing.external_id || listing.id,
          title: listing.title,
          price: listing.price,
          url: listing.url,
          posted_at: listing.posted_at || listing.published_at
        }, null, 2));
        throw insertError;
      }
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
    logger.error('❌ Seed failed:', error?.message || error);
    if (error?.stack) {
      logger.error('Stack trace:', error.stack);
    }
    if (error?.code) {
      logger.error('Error code:', error.code);
    }
    await close();
    process.exit(1);
  }
}

seedDatabase();
