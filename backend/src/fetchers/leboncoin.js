import { BaseFetcher } from './base.js';
import { parseLeboncoinListing } from '../parsers/parser-lbc.js';
import { logger } from '../utils/logger.js';
import { sanitizeSearchQuery } from '../utils/url-validator.js';

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

    // Sanitize query to prevent injection
    const safeQuery = sanitizeSearchQuery(query);

    // Leboncoin search URL structure
    const params = new URLSearchParams({
      text: safeQuery,
      category: '40', // Jeux & Jouets
      locations: `Nice_06000__43.70313_7.26608_${radius * 1000}` // radius in meters
    });

    return `${this.baseUrl}/recherche?${params.toString()}`;
  }

  /**
   * Fetch listings from Leboncoin
   */
  async fetch(query, options = {}) {
    const { maxResults = 50, waitForCaptcha = 60 } = options; // 60s par défaut pour résoudre CAPTCHA

    try {
      await this.init();

      // Step 1: Visit homepage first (more human-like)
      logger.info('Visiting Leboncoin homepage first...');
      await this.safeGoto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.randomDelay(2000, 4000);

      // Step 2: Navigate to search
      const searchUrl = this.buildSearchUrl(query, options);
      logger.info(`Navigating to: ${searchUrl}`);

      await this.safeGoto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
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
          .filter(href =>
            href &&
            href.includes('/ad/') &&
            href.startsWith('https://www.leboncoin.fr/')
          )
          .slice(0, 50);
      });

      logger.info(`Found ${listingUrls.length} listings on Leboncoin`);

      // Fetch details for each listing
      const listings = [];
      for (const url of listingUrls.slice(0, maxResults)) {
        try {
          logger.debug(`Fetching listing: ${url}`);

          // Validate URL before navigating
          if (!url.startsWith('https://www.leboncoin.fr/')) {
            logger.warn(`Skipping invalid URL: ${url}`);
            continue;
          }

          // Longer delay between page loads to avoid rate limiting
          await this.randomDelay(2000, 4000);

          await this.safeGoto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
          });

          // Random scroll to simulate human behavior
          await this.page.evaluate(() => {
            window.scrollTo(0, Math.random() * 500);
          });

          await this.randomDelay(1000, 2000);

          const html = await this.page.content();
          const listing = await parseLeboncoinListing(html, url);

          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          logger.error(`Failed to fetch listing ${url}:`, error.message);
          // Continue to next listing instead of crashing
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
