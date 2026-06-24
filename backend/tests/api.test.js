import request from 'supertest';
import { app } from '../src/api/server.js';
import { initDatabase, run } from '../src/db/database.js';

let listingId;

describe('API Endpoints', () => {
  beforeAll(async () => {
    await initDatabase();

    const now = new Date().toISOString();
    const scrapeRunId = run(
      'INSERT INTO scrape_runs (started_at, completed_at, source, query, status, results_count) VALUES (?, ?, ?, ?, ?, ?)',
      [now, now, 'test', 'api smoke', 'completed', 1]
    );
    const externalId = `api-test-${Date.now()}`;
    listingId = run(
      `INSERT INTO listings (
        scrape_run_id, source, external_id, url, title, description,
        price, location, distance_km, images, posted_at, scraped_at, score, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scrapeRunId,
        'vinted',
        externalId,
        `https://example.com/${externalId}`,
        'Lot API test Pokémon Wizards FR',
        'Annonce de smoke test API',
        42,
        'Nice',
        5,
        '[]',
        now,
        now,
        88,
        'new',
      ]
    );
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /api/docs', () => {
    it('should return API documentation', async () => {
      const res = await request(app).get('/api/docs');
      expect(res.status).toBe(200);
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.endpoints).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: '/api/jobs/status' }),
      ]));
    });
  });

  describe('GET /api/listings', () => {
    it('should return listings array', async () => {
      const res = await request(app).get('/api/listings?status=all');
      expect(res.status).toBe(200);
      expect(res.body.listings).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });

    it('should expose posted_at to avoid NaN dates in the UI', async () => {
      const res = await request(app).get('/api/listings?status=all&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.listings[0]).toHaveProperty('posted_at');
      expect(res.body.listings[0]).toHaveProperty('published_at');
    });

    it('should paginate listings with limit and offset', async () => {
      const res = await request(app).get('/api/listings?status=all&limit=1&offset=0');
      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBeLessThanOrEqual(1);
      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.pagination.offset).toBe(0);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter by min_score', async () => {
      const res = await request(app).get('/api/listings?status=all&min_score=80');
      expect(res.status).toBe(200);
      res.body.listings.forEach(listing => {
        expect(listing.score).toBeGreaterThanOrEqual(80);
      });
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should return single listing', async () => {
      const res = await request(app).get(`/api/listings/${listingId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(listingId);
      expect(res.body.title).toBeDefined();
    });

    it('should return 404 for non-existent listing', async () => {
      const res = await request(app).get('/api/listings/999999999');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/listings/:id', () => {
    it('should update and normalize listing status aliases', async () => {
      const res = await request(app)
        .patch(`/api/listings/${listingId}`)
        .send({ status: 'passed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ignored');
    });
  });

  describe('GET /api/jobs/status', () => {
    it('should return scrape job status', async () => {
      const res = await request(app).get('/api/jobs/status');
      expect(res.status).toBe(200);
      expect(res.body.state).toBe('idle');
    });
  });

  describe('GET /api/stats', () => {
    it('should return MVP statistics', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('watchlist');
      expect(res.body).toHaveProperty('ignored');
      expect(res.body).toHaveProperty('contacted');
    });
  });
});
