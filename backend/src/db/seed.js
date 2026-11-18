import { initDatabase, run, saveDatabase } from './database.js';
import { scoreListing } from '../scoring/scorer-simple.js';

const sampleListings = [
  {
    title: 'Lot 50 cartes Pokemon Wizards Français dont Dracaufeu',
    price: 89.99,
    location: 'Nice',
    url: 'https://example.com/1',
    description: 'Magnifique lot de 50 cartes Pokemon edition Wizards en français. Contient un Dracaufeu holographique, plusieurs éditions Jungle et Fossile. Bon état général.',
    image_url: 'https://via.placeholder.com/300x300?text=Pokemon+Lot+1',
    site: 'leboncoin',
    distance_km: 2
  },
  {
    title: 'Cartes Pokemon Wizards - Lot Complet Base Set FR',
    price: 120.00,
    location: 'Antibes',
    url: 'https://example.com/2',
    description: 'Collection complète Base Set Wizards français. Toutes les cartes communes et uncos. Quelques holos dont Alakazam et Mewtwo.',
    image_url: 'https://via.placeholder.com/300x300?text=Pokemon+Lot+2',
    site: 'vinted',
    distance_km: 12
  },
  {
    title: 'Pokemon cards lot Wizards english',
    price: 45.00,
    location: 'Cannes',
    url: 'https://example.com/3',
    description: 'Mixed lot of 30 Pokemon cards from Wizards era. English version. Base set, Jungle, Fossil. Good condition.',
    image_url: 'https://via.placeholder.com/300x300?text=Pokemon+Lot+3',
    site: 'leboncoin',
    distance_km: 25
  },
  {
    title: 'Cartes Pokemon lot 20 cartes',
    price: 15.00,
    location: 'Monaco',
    url: 'https://example.com/4',
    description: 'Petit lot de 20 cartes Pokemon récentes. Bon état. Pas de cartes rares.',
    image_url: 'https://via.placeholder.com/300x300?text=Pokemon+Lot+4',
    site: 'vinted',
    distance_km: 18
  },
  {
    title: 'RARE Lot Cartes Pokemon Wizards FR Jungle Fossile + Holos',
    price: 199.00,
    location: 'Nice',
    url: 'https://example.com/5',
    description: 'Superbe lot de 80 cartes Wizards en français ! Extensions Jungle et Fossile complètes. 15 holos dont Raichu, Magneton, Dracaufeu japonais. État proche du neuf.',
    image_url: 'https://via.placeholder.com/300x300?text=Pokemon+Lot+5',
    site: 'leboncoin',
    distance_km: 5
  }
];

async function seed() {
  console.log('🌱 Seeding database...\n');
  
  try {
    // Initialize database
    await initDatabase();
    console.log('✅ Database initialized\n');
    
    // Create a scrape run
    const now = new Date().toISOString();
    const scrapeRunId = run(
      'INSERT INTO scrape_runs (started_at, completed_at, source, query, status, results_count) VALUES (?, ?, ?, ?, ?, ?)',
      [now, now, 'seed', 'sample data', 'completed', sampleListings.length]
    );
    console.log(`📊 Created scrape run #${scrapeRunId}\n`);
    
    // Insert sample listings
    for (let i = 0; i < sampleListings.length; i++) {
      const listing = sampleListings[i];
      // Calculate score
      const score = scoreListing(listing);
      
      const now = new Date().toISOString();
      const externalId = `seed-${i + 1}`;
      
      const id = run(
        `INSERT INTO listings (
          scrape_run_id, source, external_id, url, title, description, 
          price, location, distance_km, images, scraped_at, score, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scrapeRunId,
          listing.site,
          externalId,
          listing.url,
          listing.title,
          listing.description,
          listing.price,
          listing.location,
          listing.distance_km,
          listing.image_url, // Store as single URL in TEXT field
          now,
          score,
          'new'
        ]
      );
      
      console.log(`✅ [${id}] ${listing.title}`);
      console.log(`   💰 ${listing.price}€ | 📍 ${listing.location} (${listing.distance_km}km) | ⭐ Score: ${score}`);
      console.log(`   🔗 ${listing.site}\n`);
    }
    
    console.log('🎉 Seed completed successfully!');
    console.log(`📦 Inserted ${sampleListings.length} sample listings`);
    
    // IMPORTANT: Save to disk!
    console.log('\n💾 Saving database to disk...');
    await saveDatabase();
    console.log('✅ Database saved successfully!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
