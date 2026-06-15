import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Scoring weights
  scoring: {
    wizardsWeight: 40,
    frenchWeight: 20,
    lotWeight: 20,
    priceWeight: 10,
    distanceWeight: 10
  },
  
  // Geographic constraints
  geo: {
    centerLat: 43.7102,  // Nice
    centerLon: 7.2620,
    maxDistanceKm: 50,
    maxBudget: 1500
  },
  
  // Scraping config
  scraping: {
    headless: false,  // MVP uses headful mode (required for CAPTCHA handling)
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};
