/**
 * Listings Routes
 * Endpoints API pour les annonces
 */

import express from 'express';
import * as listingsRepo from '../repositories/listingsRepository.js';

const router = express.Router();

/**
 * GET /api/listings
 * Récupère la liste des annonces avec filtres
 */
router.get('/', (req, res) => {
  try {
    const filters = {
      source: req.query.source,
      status: req.query.status || 'new',
      min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price) : 1500, // Budget max par défaut
      max_distance_km: req.query.max_distance_km ? parseFloat(req.query.max_distance_km) : 50, // Zone Nice ±50km
      min_score: req.query.min_score ? parseFloat(req.query.min_score) : undefined,
      order_by: req.query.order_by || 'score',
      order_dir: req.query.order_dir || 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
    };

    const listings = listingsRepo.getListings(filters);
    const total = listingsRepo.countListings(filters);

    res.json({
      success: true,
      data: listings,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        has_more: filters.offset + listings.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings',
      message: error.message,
    });
  }
});

/**
 * GET /api/listings/:id
 * Récupère une annonce par ID
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const listing = listingsRepo.getListingById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found',
      });
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listing',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/listings/:id/status
 * Met à jour le statut d'une annonce
 */
router.patch('/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const validStatuses = ['new', 'interested', 'contacted', 'ignored', 'purchased'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    listingsRepo.updateListingStatus(id, status, notes);

    res.json({
      success: true,
      message: 'Status updated',
    });
  } catch (error) {
    console.error('Error updating listing status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/listings/:id/score
 * Met à jour le score d'une annonce
 */
router.patch('/:id/score', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { score, score_breakdown } = req.body;

    if (score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Score is required',
      });
    }

    listingsRepo.updateListingScore(id, score, score_breakdown);

    res.json({
      success: true,
      message: 'Score updated',
    });
  } catch (error) {
    console.error('Error updating listing score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update score',
      message: error.message,
    });
  }
});

export default router;
