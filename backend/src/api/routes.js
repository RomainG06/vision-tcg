import express from 'express';
import listingsRouter from './routes/listings.routes.js';
import scrapeRouter from './routes/scrape.routes.js';
import alertsRouter from './routes/alerts.routes.js';
import priceInfoRouter from './routes/price-info.routes.js';
import scrapeRunsRouter from './routes/stats.routes.js';
import statsGeneralRouter from './routes/stats-general.routes.js';

const router = express.Router();

// Mount sub-routers
router.use('/listings', listingsRouter);
router.use('/scrape', scrapeRouter);
router.use('/alerts', alertsRouter);
router.use('/price-info', priceInfoRouter);
router.use('/scrape-runs', scrapeRunsRouter);
router.use('/stats', statsGeneralRouter);

// Legacy compatibility: /jobs/status -> /scrape/status
router.get('/jobs/status', (req, res) => {
  res.redirect(301, '/api/scrape/status');
});

/**
 * GET /api/docs
 * API documentation
 */
router.get('/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    description: 'Vision TCG API - Détection et scoring de lots Pokemon',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/api/docs', description: 'This documentation' },
      { method: 'GET', path: '/api/listings', description: 'List all listings with filters' },
      { method: 'GET', path: '/api/listings/:id', description: 'Get single listing' },
      { method: 'GET', path: '/api/listings/:id/history', description: 'Get listing price/history tracking' },
      { method: 'PATCH', path: '/api/listings/:id', description: 'Update listing' },
      { method: 'PATCH', path: '/api/listings/:id/status', description: 'Update listing status' },
      { method: 'POST', path: '/api/listings/:id/watchlist', description: 'Mark listing as interesting' },
      { method: 'DELETE', path: '/api/listings', description: 'Clear all local dashboard listings' },
      { method: 'DELETE', path: '/api/listings/:id', description: 'Delete listing' },
      { method: 'POST', path: '/api/scrape/start', description: 'Start a marketplace scrape and save results' },
      { method: 'GET', path: '/api/scrape/status', description: 'Get current scrape job status' },
      { method: 'GET', path: '/api/alerts', description: 'Get recent high-score and price-drop alerts' },
      { method: 'GET', path: '/api/price-info/cache', description: 'Inspect cached market price estimates' },
      { method: 'GET', path: '/api/price-info/cardmarket/probe', description: 'Debug Cardmarket search/detail/priceGuide for a title' },
      { method: 'GET', path: '/api/scrape-runs', description: 'Get scrape runs history' },
      { method: 'GET', path: '/api/stats', description: 'Get statistics' },
    ]
  });
});

export default router;
