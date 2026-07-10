import express from 'express';
import { logger } from '../../utils/logger.js';
import { ListingRepository } from '../../repositories/listing-repository.js';
import { AlertRepository } from '../../repositories/alert-repository.js';
import { ListingHistoryRepository } from '../../repositories/listing-history-repository.js';

const router = express.Router();

// Initialize repositories
const listingRepo = new ListingRepository();
const alertRepo = new AlertRepository();
const listingHistoryRepo = new ListingHistoryRepository();

/**
 * GET /api/stats
 * Get overall statistics
 */
router.get('/', (req, res) => {
    try {
        const stats = {
            total: listingRepo.count(),
            viewed: listingRepo.countByStatus('reviewed'),
            passed: listingRepo.countByStatus('ignored'),
            ignored: listingRepo.countByStatus('ignored'),
            contacted: listingRepo.countByStatus('contacted'),
            interesting: listingRepo.countByStatus('interested'),
            watchlist: listingRepo.countByStatus('interested'),
            new: listingRepo.countByStatus('new'),
            avgScore: Math.round(listingRepo.getAverageScore() * 10) / 10,
            avgPrice: Math.round(listingRepo.getAveragePrice() * 100) / 100,
            highScore: listingRepo.countHighScore(),
            alerts: alertRepo.getSummary(),
            history: listingHistoryRepo.getSummary(),
            bySource: listingRepo.countBySource()
        };

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
