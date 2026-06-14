import { BaseFetcher } from './base.js';
import { parseLeboncoinListing } from '../parsers/parser-lbc.js';
import { logger } from '../utils/logger.js';

/**
 * Leboncoin fetcher
 * Fetches Pokemon card listings from Leboncoin
 */
export class LeboncoinFetcher extends BaseFetcher {
  constructor() {
    super('leboncoin');
    this.baseUrl = 'https://www.leboncoin.fr';
  }
  
  /**
   * Build search URL
   */
  buildSearchUrl(query, options = {}) {
    const { location = 'nice', radius = 50 } = options;
    
    // Leboncoin search URL structure
    const params = new URLSearchParams({
      text: query,
      category: '40', // Jeux & Jouets
      locations: `Nice_06000__43.70313_7.26608_${radius * 1000}` // radius in meters
    });
    
    return `${this.baseUrl}/recherche?${params.toString()}`;
  }
  
  /**
   * Fetch listings from Leboncoin
   */
  async fetch(query, options = {}) {
    const { maxResults = 50 } = options;
    
    try {
      await this.init();
      
      const searchUrl = this.buildSearchUrl(query, options);
      logger.info(`Navigating to: ${searchUrl}`);
      
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.randomDelay();
      
      // Check for CAPTCHA
      if (await this.detectCaptcha()) {
        const debugInfo = await this.saveDebugInfo('captcha');
        throw new Error(`CAPTCHA detected. Debug info saved: ${JSON.stringify(debugInfo)}`);
      }
      
      // Wait for listings to load
      try {
        await this.page.waitForSelector('[data-qa-id="aditem_container"]', { timeout: 10000 });
      } catch (error) {
        logger.warn('No listings found or page structure changed');
        await this.saveDebugInfo('no_results');
        return [];
      }
      
      // Extract listing URLs
      const listingUrls = await this.page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[data-qa-id="aditem_container"] a'));
        return items
          .map(a => a.href)
          .filter(href => href && href.includes('/ad/'))
          .slice(0, 50);
      });
      
      logger.info(`Found ${listingUrls.length} listings on Leboncoin`);
      
      // Fetch details for each listing
      const listings = [];
      for (const url of listingUrls.slice(0, maxResults)) {
        try {
          logger.debug(`Fetching listing: ${url}`);
          await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
          await this.randomDelay(500, 1500);
          
          const html = await this.page.content();
          const listing = await parseLeboncoinListing(html, url);
          
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          logger.error(`Failed to fetch listing ${url}:`, error.message);
        }
      }
      
      return listings;
    } catch (error) {
      logger.error('Leboncoin fetch error:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

/**
 * Convenience function
 */
export async function fetchLeboncoin(query, options = {}) {
  const fetcher = new LeboncoinFetcher();
  return await fetcher.fetch(query, options);
}
