import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { router } from './routes.js';
import { initDatabase } from '../db/database.js';

export const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

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

// Start if running directly
// Note: Always start the server when this file is imported as the main module
// The original condition doesn't work reliably on Windows
start();
