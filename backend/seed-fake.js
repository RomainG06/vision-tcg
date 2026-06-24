#!/usr/bin/env node
/**
 * Quick seed with fake data - NO SCRAPING
 * Usage: node seed-fake.js
 */

import { initDatabase, run, close } from './src/db/database.js';
import { logger } from './src/utils/logger.js';

const fakeListings = [
  { title: "Dracaufeu Holo 4/102 Set de Base Wizards FR", price: 450, score: 85, signals: ["WIZARDS", "FR", "HOLO"], risks: [] },
  { title: "Lot 50 cartes Jungle Wizards françaises", price: 80, score: 78, signals: ["WIZARDS", "FR", "LOT"], risks: ["CONDITION_UNKNOWN"] },
  { title: "Mewtwo 10/102 Set de Base Wizards shadowless", price: 120, score: 82, signals: ["WIZARDS", "SHADOWLESS"], risks: [] },
  { title: "Ronflex Holo Jungle 11/64 Wizards français", price: 35, score: 72, signals: ["WIZARDS", "FR", "HOLO"], risks: [] },
  { title: "Lot 100 cartes Pokémon années 90 Wizards", price: 150, score: 88, signals: ["WIZARDS", "LOT", "VINTAGE"], risks: [] },
  { title: "Electhor Holo 16/62 Fossil Wizards FR", price: 45, score: 70, signals: ["WIZARDS", "FR", "HOLO"], risks: [] },
  { title: "Tortank Holo 2/102 Set de Base Wizards", price: 280, score: 80, signals: ["WIZARDS", "HOLO"], risks: ["LANGUAGE_UNKNOWN"] },
  { title: "Lot cartes Neo Genesis Wizards français", price: 95, score: 75, signals: ["WIZARDS", "FR", "LOT"], risks: [] },
  { title: "Florizarre Holo 15/102 Set de Base Wizards FR", price: 220, score: 83, signals: ["WIZARDS", "FR", "HOLO"], risks: [] },
  { title: "Alakazam Holo 1/102 Set de Base Wizards", price: 65, score: 68, signals: ["WIZARDS", "HOLO"], risks: [] },
  { title: "Lot 30 cartes Team Rocket Wizards françaises", price: 55, score: 71, signals: ["WIZARDS", "FR", "LOT"], risks: [] },
  { title: "Condition Holo 13/62 Fossil Wizards FR", price: 30, score: 65, signals: ["WIZARDS", "FR", "HOLO"], risks: [] },
  { title: "Magicarpe Holo Team Rocket Wizards français", price: 25, score: 60, signals: ["WIZARDS", "FR"], risks: ["LOW_VALUE"] },
  { title: "Lot 200 cartes Wizards toutes éditions", price: 320, score: 90, signals: ["WIZARDS", "LOT", "BULK"], risks: [] },
  { title: "Ptera Holo 1/62 Fossil Wizards français", price: 55, score: 72, signals: ["WIZARDS", "FR", "HOLO"], risks: [] },
  { title: "Machamp Holo 8/102 Set de Base Wizards", price: 18, score: 58, signals: ["WIZARDS"], risks: ["LOW_VALUE", "COMMON"] },
  { title: "Lot cartes Gym Heroes Wizards français", price: 110, score: 76, signals: ["WIZARDS", "FR", "LOT"], risks: [] },
  { title: "Nidoking Holo Set de Base Wizards FR", price: 75, score: 70, signals: ["WIZARDS", "FR", "HOLO"], risks: [] },
  { title: "Lot 500 cartes Wizards en vrac années 90", price: 580, score: 92, signals: ["WIZARDS", "LOT", "BULK", "VINTAGE"], risks: ["CONDITION_UNKNOWN"] },
  { title: "Leviator Holo Jungle Wizards français", price: 40, score: 68, signals: ["WIZARDS", "FR", "HOLO"], risks: [] }
];

async function seedFake() {
  try {
    logger.info('🌱 Starting FAKE seed (test data)...');
    
    await initDatabase();
    
    // Create scrape_run
    logger.info('Creating scrape_run entry...');
    await run(`
      INSERT INTO scrape_runs (started_at, completed_at, source, query, status, results_count, errors_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      new Date().toISOString(),
      new Date().toISOString(),
      'fake-seed',
      'pokemon cartes wizards',
      'completed',
      fakeListings.length,
      0
    ]);
    
    logger.info(`💾 Inserting ${fakeListings.length} fake listings...`);
    
    for (let i = 0; i < fakeListings.length; i++) {
      const listing = fakeListings[i];
      
      const explanation = `**Pourquoi cette annonce est intéressante :**\n\n${listing.signals.map(s => `✅ ${s}`).join('\n')}`;
      
      await run(`
        INSERT INTO listings (
          scrape_run_id, source, external_id, url, title, description,
          price, location, lat, lon, distance_km, images, posted_at,
          scraped_at, status, score, score_breakdown, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        1,
        'vinted',
        `fake-${i + 1}`,
        `https://www.vinted.fr/items/fake-${i + 1}`,
        listing.title,
        'Carte en bon état, photos disponibles',
        listing.price,
        'Nice',
        43.70313,
        7.26608,
        5,
        JSON.stringify(['https://via.placeholder.com/400x300?text=Pokemon+Card']),
        new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        'new',
        listing.score,
        JSON.stringify({
          signals: listing.signals,
          risks: listing.risks,
          confidence: 0.75,
          estimated_value_min: Math.round(listing.price * 1.2),
          estimated_value_max: Math.round(listing.price * 2.5)
        }),
        explanation
      ]);
      
      if ((i + 1) % 5 === 0) {
        logger.info(`   Progress: ${i + 1}/${fakeListings.length} saved...`);
      }
    }
    
    logger.info(`✅ Saved ${fakeListings.length} fake listings\n`);
    
    logger.info('📊 Summary:');
    logger.info(`   Total: ${fakeListings.length} listings`);
    logger.info(`   Average score: ${Math.round(fakeListings.reduce((sum, l) => sum + l.score, 0) / fakeListings.length)}`);
    logger.info('');
    logger.info('✅ Database seeded successfully!');
    logger.info('🚀 Start backend: npm run dev');
    logger.info('🚀 Start frontend: cd frontend && npm run dev');
    
    await close();
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Seed failed:', error?.message || error);
    if (error?.stack) {
      logger.error('Stack trace:', error.stack);
    }
    await close();
    process.exit(1);
  }
}

seedFake();
