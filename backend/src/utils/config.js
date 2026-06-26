import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function optionalString(value) {
  const text = String(value || '').trim();
  return text.length > 0 ? text : undefined;
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Security
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  skipAuth: process.env.SKIP_AUTH === 'true', // Only for development

  // Rate limiting (global)
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 30 // limit each IP to 30 requests per minute
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
    // Default: invisible browser for comfort. Per-source defaults keep LBC visible for CAPTCHA.
    headless: parseBoolean(process.env.CHROMIUM_HEADLESS, true),
    headlessBySource: {
      vinted: parseBoolean(process.env.VINTED_HEADLESS, true),
      leboncoin: parseBoolean(process.env.LEBONCOIN_HEADLESS, false),
      facebook: parseBoolean(process.env.FACEBOOK_HEADLESS, false)
    },
    executablePathBySource: {
      leboncoin: optionalString(process.env.LEBONCOIN_CHROME_PATH)
    },
    userDataDirBySource: {
      leboncoin: optionalString(process.env.LEBONCOIN_USER_DATA_DIR)
    },
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    delayMin: parseInt(process.env.SCRAPE_DELAY_MIN_MS || '2000'),
    delayMax: parseInt(process.env.SCRAPE_DELAY_MAX_MS || '4000'),
    retryMax: parseInt(process.env.SCRAPE_RETRY_MAX || '3'),
    retryBackoffMs: parseInt(process.env.SCRAPE_RETRY_BACKOFF_MS || '2000')
  }
};
