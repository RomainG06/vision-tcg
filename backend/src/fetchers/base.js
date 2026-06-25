import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { browserPool } from './browser-pool.js';
import { isValidScrapingUrl, sanitizeSearchQuery } from '../utils/url-validator.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCookies, saveCookies } from '../utils/cookie-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Base fetcher class with common functionality
 * Uses browser pool for better performance
 */
export class BaseFetcher {
  constructor(source) {
    this.source = source;
    this.browser = null;
    this.page = null;
    this.requestListener = null;
  }

  /**
   * Initialize browser and page using browser pool
   */
  async init() {
    logger.info(`Initializing ${this.source} fetcher...`);

    // Acquire browser from pool instead of launching new one
    this.browser = await browserPool.acquire({ source: this.source });
    logger.debug(`Acquired browser from pool for ${this.source}`);

    this.page = await this.browser.newPage();

    // Remove automation indicators
    await this.page.evaluateOnNewDocument(() => {
      // Override the navigator.webdriver flag
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      // Mock plugins and languages
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en'] });
    });

    // Try to load saved cookies first
    await loadCookies(this.page);

    // Set realistic user agent (recent Windows Chrome)
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Set language preference
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    // Set viewport with slight randomization
    await this.page.setViewport({
      width: 1920,
      height: 1080
    });

    logger.debug(`${this.source} fetcher initialized`);
  }

  /**
   * Close browser and release back to pool
   */
  async close() {
    try {
      if (this.page) {
        // Remove all event listeners to prevent memory leaks
        this.page.removeAllListeners();
        await this.page.close();
        this.page = null;
        logger.debug(`${this.source} page closed`);
      }

      if (this.browser) {
        // Release browser back to pool instead of closing
        browserPool.release(this.browser);
        this.browser = null;
        logger.debug(`${this.source} browser released to pool`);
      }
    } catch (error) {
      logger.error(`Error closing ${this.source} fetcher:`, error);
    }
  }

  /**
   * Detect and handle CAPTCHA/anti-bot measures
   */
  async detectCaptcha() {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="captcha"]',
      'iframe[src*="datadome"]',
      'iframe[src*="challenges.cloudflare"]',
      '[class*="captcha"]',
      '[id*="captcha"]',
      '[class*="datadome"]',
      '[id*="datadome"]',
      '[data-testid*="captcha"]',
      'div[class*="challenge"]'
    ];

    for (const selector of captchaSelectors) {
      const element = await this.page.$(selector);
      if (element) {
        logger.warn(`CAPTCHA detected on ${this.source}`);
        return true;
      }
    }

    const pageText = await this.page.evaluate(() => document.body?.innerText || '').catch(() => '');
    if (/datadome|captcha|vérifions que vous n'êtes pas un robot|verifions que vous n'etes pas un robot|ippoll_reasoncode/i.test(pageText)) {
      logger.warn(`CAPTCHA/anti-bot text detected on ${this.source}`);
      return true;
    }

    return false;
  }

  /**
   * Save screenshot and HTML for debugging
   */
  async saveDebugInfo(reason = 'debug') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotsDir = 'screenshots';

    // Create screenshots directory if it doesn't exist
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
      logger.debug(`Created ${screenshotsDir} directory`);
    }

    const screenshotPath = join(screenshotsDir, `${this.source}_${reason}_${timestamp}.png`);
    const htmlPath = join(screenshotsDir, `${this.source}_${reason}_${timestamp}.html`);

    try {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      const html = await this.page.content();
      writeFileSync(htmlPath, html);

      logger.info(`Debug info saved: ${screenshotPath}, ${htmlPath}`);

      return { screenshotPath, htmlPath };
    } catch (error) {
      logger.error('Failed to save debug info:', error);
      return null;
    }
  }

  /**
   * Wait with random delay to appear more human
   */
  async randomDelay(min = 1000, max = 3000) {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Save cookies after manual CAPTCHA resolution
   */
  async saveCookiesAfterCaptcha() {
    return await saveCookies(this.page);
  }

  /**
   * Navigate to URL with validation
   * Prevents SSRF attacks by checking URL against whitelist
   */
  async safeGoto(url, options = {}) {
    // Validate URL before navigation
    if (!isValidScrapingUrl(url)) {
      throw new Error(`Invalid or unsafe URL: ${url}`);
    }

    logger.debug(`Navigating to validated URL: ${url}`);
    return await this.page.goto(url, options);
  }

  /**
   * Fetch listings - to be implemented by subclasses
   */
  async fetch(query, options = {}) {
    throw new Error('fetch() must be implemented by subclass');
  }
}
