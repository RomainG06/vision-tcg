import express from 'express';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../auth.js';
import { validateInteger } from '../../utils/url-validator.js';
import { priceInfoCacheRepository } from '../../repositories/price-info-cache-repository.js';
import { debugCardmarketPriceInfo } from '../../services/cardmarket-price-info.js';

const router = express.Router();

/**
 * GET /api/price-info/cache
 * Inspect cached market price estimates.
 */
router.get('/cache', authenticate, (req, res) => {
  try {
    const provider = req.query.provider || 'cardmarket';
    const limit = validateInteger(req.query.limit, 50, 1, 200);
    const entries = priceInfoCacheRepository.list({ provider, limit });
    res.json({
      provider,
      count: entries.length,
      entries: entries.map(entry => ({
        provider: entry.provider,
        cache_key: entry.cache_key,
        updated_at: entry.updated_at,
        expires_at: entry.expires_at,
        summary: entry.payload?.summary || entry.payload,
      })),
    });
  } catch (error) {
    logger.error('Error fetching price info cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/price-info/cardmarket/probe?title=...
 * Debug Cardmarket search/detail/priceGuide for one listing title.
 */
router.get('/cardmarket/probe', authenticate, async (req, res) => {
  try {
    const title = String(req.query.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'Missing title query parameter' });
    }
    const price = req.query.price !== undefined ? Number(req.query.price) : null;
    const result = await debugCardmarketPriceInfo({ title, price });
    res.json(result);
  } catch (error) {
    logger.error('Error probing Cardmarket price info:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;
