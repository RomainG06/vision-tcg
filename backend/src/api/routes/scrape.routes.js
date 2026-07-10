import express from 'express';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../auth.js';
import { createScrapeJobManager, ScrapeAlreadyRunningError } from '../../services/scrape-job-manager.js';

const router = express.Router();

// Initialize scrape job manager
const scrapeJobManager = createScrapeJobManager({
  startScrape: async (payload) => {
    const { startScrape } = await import('../../services/scrape-service.js');
    return startScrape(payload);
  },
});

/**
 * POST /api/scrape/start
 * Start a marketplace scrape. MVP is synchronous so the UI can show immediate results.
 * Protected: requires authentication
 */
router.post('/start', authenticate, async (req, res) => {
  try {
    const result = await scrapeJobManager.start(req.body || {});
    res.json(result);
  } catch (error) {
    if (error instanceof ScrapeAlreadyRunningError) {
      return res.status(409).json({
        error: 'Scrape already running',
        message: 'Une chasse est déjà en cours. Attends la fin avant de relancer.',
        job: error.status,
      });
    }

    logger.error('Error starting scrape:', error);
    res.status(500).json({
      error: 'Scrape failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/jobs/status
 * Get current scrape job status
 */
router.get('/status', (req, res) => {
  res.json(scrapeJobManager.getStatus());
});

export default router;
