import { BaseFetcher } from './base.js';
import { parseLeboncoinListing } from '../parsers/parser-lbc.js';
import { logger } from '../utils/logger.js';
import {
  attachLeboncoinMetadata,
  buildLeboncoinSearchUrl,
  extractLeboncoinExternalId,
  selectLeboncoinUrls,
} from './leboncoin-utils.js';

export { extractLeboncoinExternalId, selectLeboncoinUrls } from './leboncoin-utils.js';

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
    return buildLeboncoinSearchUrl(query, options);
  }

  /**
   * Fetch listings from Leboncoin
   */
  async fetch(query, options = {}) {
    const {
      maxResults = 50,
      waitForCaptcha = 120,
      excludeExternalIds = [],
      scanDepth = Math.max(maxResults * 3, 30),
    } = options; // 120s par défaut pour résoudre CAPTCHA LBC dans la fenêtre visible

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
        return attachLeboncoinMetadata([], {
          grid_raw_found: 0,
          selected_for_details: 0,
          selected_external_ids: [],
          prefilter_summary: { total: 0, selected: 0, already_seen: 0, duplicate: 0, invalid_url: 0 },
        });
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
          .slice(0, 200);
      });

      logger.info(`Found ${listingUrls.length} listings on Leboncoin`);

      const selectedUrls = selectLeboncoinUrls(listingUrls.slice(0, scanDepth), {
        excludeExternalIds,
        maxResults,
      });
      const selectedExternalIds = selectedUrls
        .map(extractLeboncoinExternalId)
        .filter(Boolean);
      const prefilterSummary = {
        total: listingUrls.length,
        selected: selectedUrls.length,
        already_seen: Math.max(0, listingUrls.length - selectedUrls.length),
        duplicate: 0,
        invalid_url: listingUrls.filter(url => !extractLeboncoinExternalId(url)).length,
      };

      logger.info(`Selected ${selectedUrls.length}/${listingUrls.length} Leboncoin URLs after already-seen dedupe`);

      // Fetch details for each listing
      const listings = [];
      for (const url of selectedUrls) {
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
            listings.push({
              ...listing,
              external_id: listing.external_id || extractLeboncoinExternalId(url),
              source: 'leboncoin',
            });
          }
        } catch (error) {
          logger.error(`Failed to fetch listing ${url}:`, error.message);
          // Continue to next listing instead of crashing
        }
      }

      return attachLeboncoinMetadata(listings, {
        grid_raw_found: listingUrls.length,
        selected_for_details: selectedUrls.length,
        selected_external_ids: selectedExternalIds,
        prefilter_summary: prefilterSummary,
      });
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
