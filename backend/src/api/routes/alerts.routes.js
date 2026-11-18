import express from 'express';
import { logger } from '../../utils/logger.js';
import { AlertRepository } from '../../repositories/alert-repository.js';
import { ListingHistoryRepository } from '../../repositories/listing-history-repository.js';

const router = express.Router();

// Initialize repositories
const alertRepo = new AlertRepository();
const listingHistoryRepo = new ListingHistoryRepository();

/**
 * GET /api/alerts
 * Simple MVP alerts: high score and price drop.
 */
router.get('/', (req, res) => {
  try {
    const alerts = alertRepo.findRecent({
      type: req.query.type,
      unreadOnly: req.query.unread === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    });

    res.json({
      alerts,
      summary: alertRepo.getSummary(),
      history: listingHistoryRepo.getSummary(),
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
