import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { keywordsCache } from '../scoring/keywords-cache.js';
import { browserPool } from '../fetchers/browser-pool.js';
import router from './routes.js';
import profileRoutes from './routes-profiles.js';
import { initDatabase } from '../db/database.js';

export const app = express();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

// Security middleware
app.use(helmet());

// CORS - Restrict to frontend URL only
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

// Global rate limiting (applies to all /api/* routes)
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Login is public: keep a stricter limiter to reduce token guessing.
const loginLimiter = rateLimit({
  windowMs: config.auth.loginRateLimit.windowMs,
  max: config.auth.loginRateLimit.max,
  message: { error: 'Too many login attempts', message: 'Trop de tentatives de connexion. Réessaie plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/', globalLimiter);

// Strict rate limiting for scraping endpoints (1 request per minute)
const scrapeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: 'Scraping too frequently. Please wait before starting another hunt.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Apply strict limiter to scrape endpoints
app.use('/api/scrape', scrapeLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', router);
app.use('/api', profileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Start the server
 */
export async function start() {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await initDatabase();
    logger.info('Database initialized');

    // Initialize keywords cache for scoring performance
    logger.info('Loading keywords cache...');
    keywordsCache.getKeywords();
    logger.info(`Keywords cache loaded: ${keywordsCache.getStats().cached} keywords`);

    // Start server
    const port = config.port;
    const server = app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API docs: http://localhost:${port}/api/docs`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use. Try: PORT=3001 npm run dev`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  start();
}
