import { getDatabase, saveDatabase } from './database.js';

async function seed() {
  const db = getDatabase();
  
  console.log('🌱 Seeding database...');
  
  // Insérer un scrape_run de test
  db.run(`
    INSERT INTO scrape_runs (started_at, completed_at, source, query, status, results_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    new Date().toISOString(),
    new Date().toISOString(),
    'leboncoin',
    'pokemon wizards',
    'completed',
    5
  ]);
  
  const scrapeRunId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  
  // Insérer des listings de test
  const listings = [
    {
      source: 'leboncoin',
      external_id: 'lbc_001',
      url: 'https://www.leboncoin.fr/example/001',
      title: 'Lot 50 cartes Pokémon Wizards 1ère édition FR',
      description: 'Collection de 50 cartes dont plusieurs rares. Wizards of the Coast. État excellent.',
      price: 450,
      location: 'Nice (06000)',
      lat: 43.7102,
      lon: 7.2620,
      distance_km: 0,
      images: JSON.stringify(['https://example.com/img1.jpg']),
      posted_at: '2026-06-14T10:00:00Z',
      scraped_at: new Date().toISOString(),
      status: 'new',
      score: 95.5,
      score_breakdown: JSON.stringify({
        wizards: 40,
        french: 20,
        lot: 20,
        price: 10,
        distance: 5.5
      })
    },
    {
      source: 'leboncoin',
      external_id: 'lbc_002',
      url: 'https://www.leboncoin.fr/example/002',
      title: 'Cartes Pokémon vintage lot 30 cartes',
      description: 'Lot de cartes Pokémon des années 90-2000.',
      price: 120,
      location: 'Cannes (06400)',
      lat: 43.5528,
      lon: 7.0174,
      distance_km: 15,
      images: JSON.stringify(['https://example.com/img2.jpg']),
      posted_at: '2026-06-13T15:30:00Z',
      scraped_at: new Date().toISOString(),
      status: 'new',
      score: 72.0,
      score_breakdown: JSON.stringify({
        wizards: 20,
        french: 15,
        lot: 20,
        price: 10,
        distance: 7.0
      })
    },
    {
      source: 'vinted',
      external_id: 'vnt_001',
      url: 'https://www.vinted.fr/example/001',
      title: 'Lot Pokémon 100 cartes Wizards FR rare',
      description: 'Grosse collection Wizards, état neuf, majoritairement françaises.',
      price: 850,
      location: 'Antibes (06600)',
      lat: 43.5808,
      lon: 7.1251,
      distance_km: 12,
      images: JSON.stringify(['https://example.com/img3.jpg']),
      posted_at: '2026-06-12T08:00:00Z',
      scraped_at: new Date().toISOString(),
      status: 'new',
      score: 88.0,
      score_breakdown: JSON.stringify({
        wizards: 40,
        french: 18,
        lot: 20,
        price: 3,
        distance: 7.0
      })
    },
    {
      source: 'facebook',
      external_id: 'fb_001',
      url: 'https://www.facebook.com/marketplace/example/001',
      title: 'Cartes Pokémon à vendre',
      description: 'Quelques cartes pokémon en vrac.',
      price: 50,
      location: 'Menton (06500)',
      lat: 43.7764,
      lon: 7.5003,
      distance_km: 28,
      images: JSON.stringify([]),
      posted_at: '2026-06-10T12:00:00Z',
      scraped_at: new Date().toISOString(),
      status: 'new',
      score: 35.5,
      score_breakdown: JSON.stringify({
        wizards: 0,
        french: 5,
        lot: 10,
        price: 10,
        distance: 10.5
      })
    },
    {
      source: 'leboncoin',
      external_id: 'lbc_003',
      url: 'https://www.leboncoin.fr/example/003',
      title: 'Lot complet cartes Pokémon Wizards 1999 FR édition 1',
      description: 'Collection complète jungle et fossile édition française 1ère édition. État mint.',
      price: 1200,
      location: 'Nice (06100)',
      lat: 43.7102,
      lon: 7.2620,
      distance_km: 2,
      images: JSON.stringify(['https://example.com/img4.jpg', 'https://example.com/img5.jpg']),
      posted_at: '2026-06-15T09:00:00Z',
      scraped_at: new Date().toISOString(),
      status: 'interested',
      score: 98.0,
      score_breakdown: JSON.stringify({
        wizards: 40,
        french: 20,
        lot: 20,
        price: 8,
        distance: 10.0
      })
    }
  ];
  
  for (const listing of listings) {
    db.run(`
      INSERT INTO listings (
        scrape_run_id, source, external_id, url, title, description,
        price, location, lat, lon, distance_km, images,
        posted_at, scraped_at, status, score, score_breakdown
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      listing.images,
      listing.posted_at,
      listing.scraped_at,
      listing.status,
      listing.score,
      listing.score_breakdown
    ]);
  }
  
  saveDatabase();
  
  console.log('✅ Database seeded with 5 sample listings');
  console.log('📊 Top listing: "Lot complet cartes Pokémon Wizards 1999 FR édition 1" (score: 98.0)');
}

export { seed };
