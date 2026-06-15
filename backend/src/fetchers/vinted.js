import { BaseFetcher } from './base.js';
import { parseVintedListing } from '../parsers/parser-vinted.js';
import { logger } from '../utils/logger.js';

/**
 * Vinted fetcher
 * Fetches Pokemon card listings from Vinted
 */
export class VintedFetcher extends BaseFetcher {
  constructor() {
    super('vinted');
    this.baseUrl = 'https://www.vinted.fr';
  }
  
  /**
   * Build search URL
   */
  buildSearchUrl(query) {
    // Vinted uses simple search parameter in path
    const searchQuery = encodeURIComponent(query);
    return `${this.baseUrl}/vetements?search_text=${searchQuery}&order=newest_first`;
  }
  
  /**
   * Fetch listings from Vinted
   */
  async fetch(query, options = {}) {
    const { maxResults = 50, waitForCaptcha = 60 } = options;
    
    try {
      await this.init();
      
      // Step 1: Visit homepage first (more human-like)
      logger.info('Visiting Vinted homepage first...');
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.randomDelay(2000, 4000);
      
      // Step 2: Navigate to search
      const searchUrl = this.buildSearchUrl(query, options);
      logger.info(`Navigating to: ${searchUrl}`);
      
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.randomDelay(2000, 3000);
      
      // Check for CAPTCHA
      if (await this.detectCaptcha()) {
        const debugInfo = await this.saveDebugInfo('captcha');
        logger.warn(`⏳ CAPTCHA détecté ! Tu as ${waitForCaptcha} secondes pour le résoudre manuellement...`);
        logger.warn(`   Screenshots sauvegardés : ${debugInfo?.screenshotPath}`);
        logger.warn(`   Le script attend... résous le CAPTCHA dans le navigateur ouvert.`);
        
        // Wait for user to solve CAPTCHA
        await new Promise(resolve => setTimeout(resolve, waitForCaptcha * 1000));
        
        // Check again after waiting
        if (await this.detectCaptcha()) {
          logger.error('❌ CAPTCHA toujours présent après attente');
          throw new Error(`CAPTCHA not resolved after ${waitForCaptcha}s. Debug info: ${JSON.stringify(debugInfo)}`);
        }
        
        logger.info('✅ CAPTCHA résolu ! Sauvegarde des cookies...');
        await this.saveCookiesAfterCaptcha();
      }
      
      // Wait for listings to load
      try {
        await this.page.waitForSelector('article.feed-grid__item', { timeout: 10000 });
      } catch (error) {
        logger.warn('No listings found or page structure changed');
        await this.saveDebugInfo('no_results');
        return [];
      }
      
      // Extract listing URLs
      const listingUrls = await this.page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('article.feed-grid__item a[href*="/items/"]'));
        return items
          .map(a => a.href)
          .filter(href => href && href.includes('/items/'))
          .slice(0, 50);
      });
      
      logger.info(`Found ${listingUrls.length} listings on Vinted`);
      
      // Fetch details for each listing
      const listings = [];
      for (const url of listingUrls.slice(0, maxResults)) {
        try {
          logger.debug(`Fetching listing: ${url}`);
          await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
          await this.randomDelay(500, 1500);
          
          const html = await this.page.content();
          const listing = await parseVintedListing(html, url);
          
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          logger.error(`Failed to fetch listing ${url}:`, error.message);
        }
      }
      
      return listings;
    } catch (error) {
      logger.error('Vinted fetch error:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

/**
 * Convenience function
 */
export async function fetchVinted(query, options = {}) {
  const fetcher = new VintedFetcher();
  return await fetcher.fetch(query, options);
}
