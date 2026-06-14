import { initDatabase, run } from './database.js';
import { logger } from '../utils/logger.js';

/**
 * Seed database with sample data for testing
 */
export async function seed() {
  logger.info('Seeding database with sample data...');
  
  await initDatabase();
  
  // First, create a scrape run (required for foreign key)
  logger.info('Creating sample scrape run...');
  run(`
    INSERT INTO scrape_runs (started_at, completed_at, status, source, query, total_found, errors)
    VALUES (?, ?, 'completed', 'leboncoin', 'pokemon wizards', 3, NULL)
  `, [new Date().toISOString(), new Date().toISOString()]);
  
  // Get the scrape_run_id we just created
  const scrapeRunId = 1; // First insert, ID will be 1
  
  // Sample listings with correct column names matching schema.sql
  const sampleListings = [
    {
      scrape_run_id: scrapeRunId,
      source: 'leboncoin',
      external_id: 'lbc_12345',
      url: 'https://www.leboncoin.fr/jeux_jouets/2345678901.htm',
      title: 'Lot 150 cartes Pokemon Wizards Base Set Jungle Fossil FR',
      description: 'Collection complète de cartes Wizards en français. Excellent état. Base Set, Jungle, Fossil.',
      price: 80.00,
      location: 'Nice, 06000',
      lat: 43.7102,
      lon: 7.2620,
      distance_km: 0,
      image_url: 'https://img.leboncoin.fr/api/v1/lbcpb1/images/example1.jpg',
      posted_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      is_wizards: 1,
      is_french: 1,
      is_lot: 1,
      card_count_estimate: 150,
      score: 92,
      status: 'new'
    },
    {
      scrape_run_id: scrapeRunId,
      source: 'leboncoin',
      external_id: 'lbc_12345679',
      url: 'https://www.leboncoin.fr/jeux_jouets/2345678902.htm',
      title: 'Cartes Pokemon modernes Épée et Bouclier',
      description: 'Lot de cartes récentes, bon état',
      price: 30.00,
      location: 'Antibes, 06600',
      lat: 43.5808,
      lon: 7.1239,
      distance_km: 15.2,
      image_url: 'https://img.leboncoin.fr/api/v1/lbcpb1/images/example2.jpg',
      posted_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      is_wizards: 0,
      is_french: 1,
      is_lot: 1,
      card_count_estimate: 50,
      score: 35,
      status: 'new'
    },
    {
      scrape_run_id: scrapeRunId,
      source: 'vinted',
      external_id: 'vinted_987654',
      url: 'https://www.vinted.fr/items/3456789012',
      title: 'Pokemon Base Set Dracaufeu Holo FR',
      description: 'Charizard première édition français, excellent état',
      price: 450.00,
      location: 'Cannes',
      lat: 43.5513,
      lon: 7.0128,
      distance_km: 25.8,
      image_url: 'https://images.vinted.net/example3.jpg',
      posted_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      is_wizards: 1,
      is_french: 1,
      is_lot: 0,
      card_count_estimate: 1,
      score: 78,
      status: 'interested'
    }
  ];
  
  logger.info(`Inserting ${sampleListings.length} sample listings...`);
  
  for (const listing of sampleListings) {
    run(`
      INSERT INTO listings (
        scrape_run_id, source, external_id, url, title, description, 
        price, location, lat, lon, distance_km, image_url, posted_at,
        is_wizards, is_french, is_lot, card_count_estimate, score, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      listing.scrape_run_id,
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
      listing.is_wizards,
      listing.is_french,
      listing.is_lot,
      listing.card_count_estimate,
      listing.score,
      listing.status
    ]);
  }
  
  logger.info('✅ Database seeded successfully');
  logger.info(`   - ${sampleListings.length} listings created`);
  logger.info(`   - 1 scrape run created`);
  logger.info(`   - Keywords already seeded via schema.sql`);
}
