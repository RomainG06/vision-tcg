import express from 'express';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../auth.js';
import { validateInteger, validateFloat, validateEnum } from '../../utils/url-validator.js';
import { ListingRepository } from '../../repositories/listing-repository.js';
import { ListingHistoryRepository } from '../../repositories/listing-history-repository.js';
import { assertValidListingStatus, normalizeListingStatus } from '../../services/listing-status.js';
import { mapListing, withHistory } from '../middleware/mappers.js';

const router = express.Router();
const listingRepo = new ListingRepository();
const listingHistoryRepo = new ListingHistoryRepository();

/**
 * GET /api/listings
 * Get all listings with optional filters
 */
router.get('/', (req, res) => {
  try {
    const requestedStatus = req.query.status || 'all';

    // Validate all inputs with bounds
    const filters = {
      source: validateEnum(req.query.source, ['vinted', 'leboncoin', 'facebook'], null),
      status: requestedStatus === 'all' ? 'all' : normalizeListingStatus(requestedStatus),
      minScore: req.query.min_score ? validateFloat(req.query.min_score, 0, 100, 0) : undefined,
      maxPrice: req.query.max_price ? validateFloat(req.query.max_price, 0, 999999, 10000) : undefined,
      maxDistance: req.query.max_distance ? validateFloat(req.query.max_distance, 0, 10000, 50) : undefined,
      limit: validateInteger(req.query.limit, 1, 500, 50),
      offset: validateInteger(req.query.offset, 0, 999999, 0)
    };

    const listings = listingRepo.findAll(filters).map(withHistory);
    const total = listingRepo.count(filters);

    res.json({
      listings: listings.map(mapListing),
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:id
 * Get a single listing by ID
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const listing = listingRepo.findById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(listing)));
  } catch (error) {
    logger.error(`Error fetching listing ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:id/history
 * Price/history details for a listing.
 */
router.get('/:id/history', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const listing = listingRepo.findById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({
      history: listingHistoryRepo.getListingHistory(id),
      price_events: listingHistoryRepo.getPriceEvents(id),
    });
  } catch (error) {
    logger.error(`Error fetching listing history ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/listings/:id
 * Update a listing (status, notes)
 * Protected: requires authentication
 */
router.patch('/:id', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = {};

    if (req.body.status !== undefined) {
      updates.status = assertValidListingStatus(req.body.status);
    }

    if (req.body.notes !== undefined) {
      updates.notes = req.body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    listingRepo.update(id, updates);
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(updated)));
  } catch (error) {
    logger.error(`Error updating listing ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/listings/:id/status
 * Compatibility endpoint used by the detail modal.
 */
router.patch('/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }

    listingRepo.update(id, { status: assertValidListingStatus(status) });
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(updated)));
  } catch (error) {
    logger.error(`Error updating listing status ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/listings/:id/watchlist
 * Compatibility endpoint used by the detail modal.
 */
router.post('/:id/watchlist', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const status = assertValidListingStatus(req.body.status || 'interested');

    listingRepo.update(id, { status });
    const updated = listingRepo.findById(id);

    if (!updated) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(mapListing(withHistory(updated)));
  } catch (error) {
    logger.error(`Error adding listing ${req.params.id} to watchlist:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/listings
 * Clear all local dashboard listings. Scrape history/seen cache are preserved.
 * Protected: requires authentication
 */
router.delete('/', authenticate, (req, res) => {
  try {
    const before = listingRepo.count();
    listingRepo.deleteAll();
    res.json({ deleted: before });
  } catch (error) {
    logger.error('Error clearing listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/listings/:id
 * Delete a listing from the local dashboard backlog.
 * Protected: requires authentication
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = listingRepo.findById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    listingRepo.delete(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting listing ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
