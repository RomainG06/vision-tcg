import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    path: process.env.DB_PATH || './dev.db'
  },
  
  chromium: {
    ws: process.env.CHROMIUM_WS || 'ws://localhost:3001',
    headless: process.env.CHROMIUM_HEADLESS === 'true'
  },
  
  scraping: {
    maxResults: parseInt(process.env.MAX_RESULTS || '50'),
    timeout: parseInt(process.env.SCRAPE_TIMEOUT || '60000')
  },
  
  scoring: {
    maxBudget: parseFloat(process.env.MAX_BUDGET || '1500'),
    target: {
      lat: parseFloat(process.env.TARGET_LAT || '43.7102'),
      lon: parseFloat(process.env.TARGET_LON || '7.2620')
    },
    maxDistanceKm: parseFloat(process.env.MAX_DISTANCE_KM || '50')
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
