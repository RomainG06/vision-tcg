import express from 'express';
import { logger } from '../../utils/logger.js';
import { ListingRepository } from '../../repositories/listing-repository.js';
import { ScrapeRunRepository } from '../../repositories/scrape-run-repository.js';
import { AlertRepository } from '../../repositories/alert-repository.js';
import { ListingHistoryRepository } from '../../repositories/listing-history-repository.js';

const router = express.Router();

// Initialize repositories
const listingRepo = new ListingRepository();
const scrapeRunRepo = new ScrapeRunRepository();
const alertRepo = new AlertRepository();
const listingHistoryRepo = new ListingHistoryRepository();

/**
 * GET /api/scrape-runs
 * Get scrape runs history
 */
router.get('/', (req, res) => {
    try {
        const filters = {
            source: req.query.source,
            status: req.query.status,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };

        const runs = scrapeRunRepo.findAll(filters);
        const stats = scrapeRunRepo.getStats();

        res.json({
            runs,
            stats
        });
    } catch (error) {
        logger.error('Error fetching scrape runs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
