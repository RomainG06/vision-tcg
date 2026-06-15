import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { loadCookies, saveCookies } from '../utils/cookie-manager.js';

// Add stealth plugin to hide automation signals
puppeteer.use(StealthPlugin());

/**
 * Base fetcher class with common functionality
 */
export class BaseFetcher {
  constructor(source) {
    this.source = source;
    this.browser = null;
    this.page = null;
  }
  
  /**
   * Initialize browser and page
   */
  async init() {
    logger.info(`Initializing ${this.source} fetcher...`);
    
    this.browser = await puppeteer.launch({
      headless: config.chromium.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--lang=fr-FR,fr',
        '--window-size=1920,1080'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Try to load saved cookies first
    await loadCookies(this.page);
    
    // Set realistic user agent (recent Windows Chrome)
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Set language preference
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    logger.debug(`${this.source} fetcher initialized`);
  }
  
  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.debug(`${this.source} fetcher closed`);
    }
  }
  
  /**
   * Detect and handle CAPTCHA/anti-bot measures
   */
  async detectCaptcha() {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="captcha"]',
      '[class*="captcha"]',
      '[id*="captcha"]',
      'div[class*="challenge"]'
    ];
    
    for (const selector of captchaSelectors) {
      const element = await this.page.$(selector);
      if (element) {
        logger.warn(`CAPTCHA detected on ${this.source}`);
        return true;
      }
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
   * Fetch listings - to be implemented by subclasses
   */
  async fetch(query, options = {}) {
    throw new Error('fetch() must be implemented by subclass');
  }
}
