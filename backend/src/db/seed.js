import { initDatabase, run } from './database.js';
import { logger } from '../utils/logger.js';

/**
 * Seed database with sample data for testing
 */
export async function seed() {
  logger.info('Seeding database with sample data...');
  
  await initDatabase();
  
  // Insert sample listings
  const sampleListings = [
    {
      url: 'https://www.leboncoin.fr/example1',
      source: 'leboncoin',
      title: 'Lot 150 cartes Pokemon Wizards Base Set Jungle Fossil FR',
      description: 'Collection complète de cartes Wizards en français. Bon état.',
      price: 80,
      location: 'Nice',
      latitude: 43.7102,
      longitude: 7.2620,
      image_url: 'https://example.com/image1.jpg',
      posted_at: new Date().toISOString(),
      is_wizards: 1,
      is_french: 1,
      is_lot: 1,
      card_count_estimate: 150,
      distance_km: 0,
      score: 92
    },
    {
      url: 'https://www.leboncoin.fr/example2',
      source: 'leboncoin',
      title: 'Cartes Pokemon modernes Épée et Bouclier',
      description: 'Lot de cartes récentes',
      price: 30,
      location: 'Antibes',
      latitude: 43.5808,
      longitude: 7.1239,
      posted_at: new Date().toISOString(),
      is_wizards: 0,
      is_french: 1,
      is_lot: 1,
      card_count_estimate: 50,
      distance_km: 15,
      score: 35
    },
    {
      url: 'https://www.vinted.fr/example3',
      source: 'vinted',
      title: 'Pokemon Base Set Dracaufeu Holo FR',
      description: 'Charizard première édition français',
      price: 450,
      location: 'Cannes',
      latitude: 43.5513,
      longitude: 7.0128,
      posted_at: new Date().toISOString(),
      is_wizards: 1,
      is_french: 1,
      is_lot: 0,
      card_count_estimate: 1,
      distance_km: 25,
      score: 78
    }
  ];
  
  for (const listing of sampleListings) {
    run(`
      INSERT INTO listings (
        url, source, title, description, price, location,
        latitude, longitude, image_url, posted_at,
        is_wizards, is_french, is_lot, card_count_estimate,
        distance_km, score, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `, [
      listing.url,
      listing.source,
      listing.title,
      listing.description,
      listing.price,
      listing.location,
      listing.latitude,
      listing.longitude,
      listing.image_url,
      listing.posted_at,
      listing.is_wizards,
      listing.is_french,
      listing.is_lot,
      listing.card_count_estimate,
      listing.distance_km,
      listing.score
    ]);
  }
  
  // Insert a sample scrape run
  run(`
    INSERT INTO scrape_runs (started_at, completed_at, status, total_found, errors_count)
    VALUES (?, ?, 'completed', 3, 0)
  `, [new Date().toISOString(), new Date().toISOString()]);
  
  // Insert sample keywords
  const keywords = ['wizards', 'base set', 'jungle', 'fossil', 'neo', 'première édition', 'édition 1'];
  for (const keyword of keywords) {
    run(`INSERT INTO keywords (keyword, priority) VALUES (?, 5)`, [keyword]);
  }
  
  logger.info('Database seeded successfully');
}
