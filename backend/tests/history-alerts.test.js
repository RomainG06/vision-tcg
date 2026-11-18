import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/api/server.js';
import { initDatabase } from '../src/db/database.js';
import { ListingRepository } from '../src/repositories/listing-repository.js';
import { ScrapeRunRepository } from '../src/repositories/scrape-run-repository.js';
import { ListingHistoryRepository } from '../src/repositories/listing-history-repository.js';
import { AlertRepository } from '../src/repositories/alert-repository.js';

const unique = `history-alerts-${Date.now()}`;

describe('listing history and simple alerts', () => {
  let listingRepo;
  let scrapeRunRepo;
  let historyRepo;
  let alertRepo;
  let scrapeRunId;

  beforeAll(async () => {
    await initDatabase();
    listingRepo = new ListingRepository();
    scrapeRunRepo = new ScrapeRunRepository();
    historyRepo = new ListingHistoryRepository();
    alertRepo = new AlertRepository();
    scrapeRunId = scrapeRunRepo.create({
      source: 'vinted',
      query: 'history alerts smoke',
      status: 'completed',
      results_count: 1,
    });
  });

  test('records first/current price and emits high-score alert on first detection', () => {
    const listingId = listingRepo.upsert({
      scrape_run_id: scrapeRunId,
      source: 'vinted',
      external_id: `${unique}-high-score`,
      url: `https://example.com/${unique}-high-score`,
      title: 'Lot Pokémon Wizards FR high score',
      description: 'Test historique alerte score élevé',
      price: 120,
      location: 'Nice',
      distance_km: 5,
      images: '[]',
      posted_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      status: 'new',
      score: 86,
      score_breakdown: JSON.stringify({ quality: { action_suggestion: 'contacter_rapidement' } }),
    });

    const history = historyRepo.getListingHistory(listingId);
    expect(history).toMatchObject({
      listing_id: listingId,
      first_price: 120,
      current_price: 120,
      detection_count: 1,
      price_drop_amount: 0,
      price_drop_percent: 0,
    });

    const alerts = alertRepo.findRecent({ limit: 10 });
    expect(alerts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        listing_id: listingId,
        type: 'high_score',
        severity: 'high',
        score: 86,
      }),
    ]));
  });

  test('updates current price and emits price-drop alert when a known listing drops', () => {
    const externalId = `${unique}-price-drop`;
    const listingId = listingRepo.upsert({
      scrape_run_id: scrapeRunId,
      source: 'vinted',
      external_id: externalId,
      url: `https://example.com/${externalId}`,
      title: 'Lot Pokémon Wizards FR baisse prix',
      description: 'Test historique baisse prix',
      price: 200,
      location: 'Nice',
      distance_km: 5,
      images: '[]',
      posted_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      status: 'new',
      score: 72,
      score_breakdown: '{}',
    });

    listingRepo.upsert({
      scrape_run_id: scrapeRunId,
      source: 'vinted',
      external_id: externalId,
      url: `https://example.com/${externalId}`,
      title: 'Lot Pokémon Wizards FR baisse prix',
      description: 'Test historique baisse prix',
      price: 150,
      location: 'Nice',
      distance_km: 5,
      images: '[]',
      posted_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      status: 'new',
      score: 72,
      score_breakdown: '{}',
    });

    const history = historyRepo.getListingHistory(listingId);
    expect(history).toMatchObject({
      listing_id: listingId,
      first_price: 200,
      current_price: 150,
      lowest_price: 150,
      detection_count: 2,
      price_drop_amount: 50,
      price_drop_percent: 25,
    });

    const priceEvents = historyRepo.getPriceEvents(listingId);
    expect(priceEvents.map(event => event.price)).toEqual([150, 200]);

    const alerts = alertRepo.findRecent({ type: 'price_drop', limit: 10 });
    expect(alerts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        listing_id: listingId,
        type: 'price_drop',
        severity: 'medium',
      }),
    ]));
  });

  test('exposes alerts and history summary through the API', async () => {
    const res = await request(app).get('/api/alerts?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.alerts).toBeInstanceOf(Array);
    expect(res.body.summary).toMatchObject({
      unread: expect.any(Number),
      high_score: expect.any(Number),
      price_drop: expect.any(Number),
    });
  });
});
