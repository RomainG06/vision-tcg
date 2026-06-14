import puppeteer from 'puppeteer';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

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
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    
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
    const screenshotPath = join('screenshots', `${this.source}_${reason}_${timestamp}.png`);
    const htmlPath = join('screenshots', `${this.source}_${reason}_${timestamp}.html`);
    
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
   * Fetch listings - to be implemented by subclasses
   */
  async fetch(query, options = {}) {
    throw new Error('fetch() must be implemented by subclass');
  }
}
