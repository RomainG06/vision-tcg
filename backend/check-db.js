#!/usr/bin/env node
/**
 * Check database content
 */

import { initDatabase, all, close } from './src/db/database.js';

async function checkDB() {
  try {
    await initDatabase();
    
    const count = await all('SELECT COUNT(*) as count FROM listings');
    console.log(`📊 Total listings in DB: ${count[0].count}`);
    
    if (count[0].count > 0) {
      const sample = await all('SELECT id, title, source, price, score FROM listings LIMIT 5');
      console.log('\n📋 Sample listings:');
      sample.forEach(l => {
        console.log(`  [${l.id}] ${l.title} - ${l.price}€ (${l.source}) score=${l.score}`);
      });
    } else {
      console.log('\n⚠️  Database is EMPTY. Run: node seed-database.js');
    }
    
    await close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDB();
