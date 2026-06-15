import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';

/**
 * Cookie manager for persistent browser sessions
 * Saves cookies after CAPTCHA resolution and reuses them
 */

const COOKIES_DIR = 'cookies';
const COOKIE_FILE = join(COOKIES_DIR, 'browser-cookies.json');

/**
 * Save cookies to file
 */
export async function saveCookies(page) {
  try {
    // Create cookies directory if it doesn't exist
    if (!existsSync(COOKIES_DIR)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(COOKIES_DIR, { recursive: true });
    }
    
    const cookies = await page.cookies();
    writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
    logger.info(`✅ Saved ${cookies.length} cookies to ${COOKIE_FILE}`);
    return true;
  } catch (error) {
    logger.error('Failed to save cookies:', error);
    return false;
  }
}

/**
 * Load cookies from file and set them in the page
 */
export async function loadCookies(page) {
  try {
    if (!existsSync(COOKIE_FILE)) {
      logger.debug('No saved cookies found');
      return false;
    }
    
    const cookiesString = readFileSync(COOKIE_FILE, 'utf-8');
    const cookies = JSON.parse(cookiesString);
    
    if (cookies.length === 0) {
      logger.debug('Cookie file is empty');
      return false;
    }
    
    await page.setCookie(...cookies);
    logger.info(`✅ Loaded ${cookies.length} cookies from ${COOKIE_FILE}`);
    return true;
  } catch (error) {
    logger.error('Failed to load cookies:', error);
    return false;
  }
}

/**
 * Clear saved cookies
 */
export async function clearCookies() {
  try {
    if (existsSync(COOKIE_FILE)) {
      const { unlinkSync } = await import('fs');
      unlinkSync(COOKIE_FILE);
      logger.info('✅ Cleared saved cookies');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to clear cookies:', error);
    return false;
  }
}
