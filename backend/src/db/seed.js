import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || './dev.db';

/**
 * Seed database with sample data for testing
 */
export function seed() {
  const db = new Database(DB_PATH);
  
  console.log('Seeding database...');
  
  try {
    // Create a sample scrape run
    const runResult = db.prepare(`
      INSERT INTO scrape_runs (started_at, completed_at, status, source, query, total_found)
      VALUES (datetime('now'), datetime('now'), 'completed', 'leboncoin', 'pokemon wizards', 3)
    `).run();
    
    const scrapeRunId = runResult.lastInsertRowid;
    
    // Insert sample listings
    const listings = [
      {
        scrape_run_id: scrapeRunId,
        source: 'leboncoin',
        external_id: 'lbc_123',
        url: 'https://leboncoin.fr/ad/123',
        title: 'Lot cartes Pokemon Wizards Base Set Française',
        description: 'Beau lot de 150 cartes Pokemon édition Wizards en français',
        price: 80,
        location: 'Nice',
        lat: 43.7102,
        lon: 7.2620,
        distance_km: 0,
        score: 95.5,
        is_wizards: 1,
        is_french: 1,
        is_lot: 1,
        card_count_estimate: 150
      },
      {
        scrape_run_id: scrapeRunId,
        source: 'vinted',
        external_id: 'vinted_456',
        url: 'https://vinted.fr/items/456',
        title: 'Cartes Pokémon Jungle et Fossil',
        description: 'Quelques cartes des extensions Jungle et Fossil',
        price: 25,
        location: 'Antibes',
        lat: 43.5808,
        lon: 7.1239,
        distance_km: 15,
        score: 72.3,
        is_wizards: 1,
        is_french: 0,
        is_lot: 0,
        card_count_estimate: 30
      },
      {
        scrape_run_id: scrapeRunId,
        source: 'leboncoin',
        external_id: 'lbc_789',
        url: 'https://leboncoin.fr/ad/789',
        title: 'Collection Pokemon moderne',
        description: 'Cartes récentes Épée et Bouclier',
        price: 120,
        location: 'Cannes',
        lat: 43.5528,
        lon: 7.0174,
        distance_km: 25,
        score: 15.2,
        is_wizards: 0,
        is_french: 1,
        is_lot: 1,
        card_count_estimate: 200
      }
    ];
    
    const insertStmt = db.prepare(`
      INSERT INTO listings (
        scrape_run_id, source, external_id, url, title, description,
        price, location, lat, lon, distance_km,
        score, is_wizards, is_french, is_lot, card_count_estimate
      ) VALUES (
        @scrape_run_id, @source, @external_id, @url, @title, @description,
        @price, @location, @lat, @lon, @distance_km,
        @score, @is_wizards, @is_french, @is_lot, @card_count_estimate
      )
    `);
    
    listings.forEach(listing => insertStmt.run(listing));
    
    console.log(`✅ Seeded ${listings.length} sample listings`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
