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
        // Try multiple selectors
        const selectors = [
          'article.feed-grid__item',
          'div.feed-grid__item',
          'article[data-testid*="item"]',
          '.new-item-box'
        ];
        
        let selectorFound = null;
        for (const selector of selectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            selectorFound = selector;
            logger.info(`✅ Found elements with selector: ${selector}`);
            break;
          } catch (e) {
            logger.debug(`Selector ${selector} not found`);
          }
        }
        
        if (!selectorFound) {
          throw new Error('No valid selector found');
        }
      } catch (error) {
        logger.warn('No listings found or page structure changed');
        await this.saveDebugInfo('no_results');
        return [];
      }
      
      // Extract listing URLs - try multiple strategies
      const listingUrls = await this.page.evaluate(() => {
        // Strategy 1: article links
        let items = Array.from(document.querySelectorAll('article a[href*="/items/"]'));
        console.log(`Strategy 1 (article a): Found ${items.length} links`);
        
        // Strategy 2: any link with /items/
        if (items.length === 0) {
          items = Array.from(document.querySelectorAll('a[href*="/items/"]'));
          console.log(`Strategy 2 (a[href*="/items/"]): Found ${items.length} links`);
        }
        
        // Strategy 3: feed-grid items
        if (items.length === 0) {
          items = Array.from(document.querySelectorAll('.feed-grid a, [class*="feed"] a'));
          console.log(`Strategy 3 (feed-grid): Found ${items.length} links`);
        }
        
        const urls = items
          .map(a => a.href)
          .filter(href => href && href.includes('/items/'))
          // Remove duplicates
          .filter((url, index, self) => self.indexOf(url) === index);
        
        console.log(`Total unique URLs: ${urls.length}`);
        if (urls.length > 0) {
          console.log(`First URL sample: ${urls[0]}`);
        }
        
        return urls.slice(0, 50);
      });
      
      logger.info(`Found ${listingUrls.length} listing URLs on Vinted`);
      if (listingUrls.length > 0) {
        logger.debug(`First URL: ${listingUrls[0]}`);
      } else {
        logger.error('❌ No URLs extracted! Saving debug info...');
        await this.saveDebugInfo('no_urls_extracted');
        return [];
      }
      
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
