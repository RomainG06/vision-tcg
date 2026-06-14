import request from 'supertest';
import { app } from '../src/api/server.js';
import { migrate } from '../src/db/migrations.js';
import { seed } from '../src/db/seed.js';

describe('API Endpoints', () => {
  beforeAll(() => {
    process.env.DB_PATH = ':memory:';
    migrate();
    seed();
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
      expect(res.body.endpoints).toBeDefined();
    });
  });
  
  describe('GET /api/listings', () => {
    it('should return listings array', async () => {
      const res = await request(app).get('/api/listings');
      expect(res.status).toBe(200);
      expect(res.body.listings).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });
    
    it('should filter by min_score', async () => {
      const res = await request(app).get('/api/listings?min_score=80');
      expect(res.status).toBe(200);
      res.body.listings.forEach(listing => {
        expect(listing.score).toBeGreaterThanOrEqual(80);
      });
    });
  });
  
  describe('GET /api/listings/:id', () => {
    it('should return single listing', async () => {
      const res = await request(app).get('/api/listings/1');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.title).toBeDefined();
    });
    
    it('should return 404 for non-existent listing', async () => {
      const res = await request(app).get('/api/listings/999999');
      expect(res.status).toBe(404);
    });
  });
  
  describe('PATCH /api/listings/:id', () => {
    it('should update listing status', async () => {
      const res = await request(app)
        .patch('/api/listings/1')
        .send({ status: 'interested' });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('interested');
    });
  });
  
  describe('GET /api/stats', () => {
    it('should return statistics', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(200);
      expect(res.body.total_listings).toBeGreaterThan(0);
      expect(res.body.by_status).toBeInstanceOf(Array);
    });
  });
});
