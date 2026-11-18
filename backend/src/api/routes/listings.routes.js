import express from 'express';
import { authenticate } from '../auth.js';
import { validateInteger, validateFloat, validateEnum } from '../../utils/url-validator.js';
import { ListingRepository } from '../../repositories/listing-repository.js';
import { ListingHistoryRepository } from '../../repositories/listing-history-repository.js';
import { assertValidListingStatus, normalizeListingStatus } from '../../services/listing-status.js';
import { mapListing, withHistory } from '../middleware/mappers.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler.js';

const router = express.Router();
const listingRepo = new ListingRepository();
const listingHistoryRepo = new ListingHistoryRepository();

/**
 * GET /api/listings
 * Get all listings with optional filters
 */
router.get('/', asyncHandler((req, res) => {
  const requestedStatus = req.query.status || 'all';

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
    pagination: { limit: filters.limit, offset: filters.offset, total }
  });
}));

/**
 * GET /api/listings/:id
 * Get a single listing by ID
 */
router.get('/:id', asyncHandler((req, res) => {
  const id = parseInt(req.params.id);
  const listing = listingRepo.findById(id);
  if (!listing) throw new NotFoundError('Listing');
  res.json(mapListing(withHistory(listing)));
}));

/**
 * GET /api/listings/:id/history
 * Price/history details for a listing.
 */
router.get('/:id/history', asyncHandler((req, res) => {
  const id = parseInt(req.params.id);
  if (!listingRepo.findById(id)) throw new NotFoundError('Listing');
  res.json({
    history: listingHistoryRepo.getListingHistory(id),
    price_events: listingHistoryRepo.getPriceEvents(id),
  });
}));

/**
 * PATCH /api/listings/:id
 * Update a listing (status, notes)
 * Protected: requires authentication
 */
router.patch('/:id', authenticate, asyncHandler((req, res) => {
  const id = parseInt(req.params.id);
  const updates = {};

  if (req.body.status !== undefined) updates.status = assertValidListingStatus(req.body.status);
  if (req.body.notes !== undefined) updates.notes = req.body.notes;

  if (Object.keys(updates).length === 0) throw new ValidationError('No updates provided');

  listingRepo.update(id, updates);
  const updated = listingRepo.findById(id);
  if (!updated) throw new NotFoundError('Listing');
  res.json(mapListing(withHistory(updated)));
}));

/**
 * PATCH /api/listings/:id/status
 * Compatibility endpoint used by the detail modal.
 */
router.patch('/:id/status', asyncHandler((req, res) => {
  const id = parseInt(req.params.id);
  if (!req.body.status) throw new ValidationError('Missing status');
  listingRepo.update(id, { status: assertValidListingStatus(req.body.status) });
  const updated = listingRepo.findById(id);
  if (!updated) throw new NotFoundError('Listing');
  res.json(mapListing(withHistory(updated)));
}));

/**
 * POST /api/listings/:id/watchlist
 * Compatibility endpoint used by the detail modal.
 */
router.post('/:id/watchlist', asyncHandler((req, res) => {
  const id = parseInt(req.params.id);
  const status = assertValidListingStatus(req.body.status || 'interested');
  listingRepo.update(id, { status });
  const updated = listingRepo.findById(id);
  if (!updated) throw new NotFoundError('Listing');
  res.json(mapListing(withHistory(updated)));
}));

/**
 * DELETE /api/listings
 * Clear all local dashboard listings. Scrape history/seen cache are preserved.
 * Protected: requires authentication
 */
router.delete('/', authenticate, asyncHandler((req, res) => {
  const before = listingRepo.count();
  listingRepo.deleteAll();
  res.json({ deleted: before });
}));

/**
 * DELETE /api/listings/:id
 * Delete a listing from the local dashboard backlog.
 * Protected: requires authentication
 */
router.delete('/:id', authenticate, asyncHandler((req, res) => {
  const id = parseInt(req.params.id);
  if (!listingRepo.findById(id)) throw new NotFoundError('Listing');
  listingRepo.delete(id);
  res.status(204).send();
}));

export default router;
