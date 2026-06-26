import { BaseFetcher } from './base.js';
import { parseLeboncoinListing } from '../parsers/parser-lbc.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
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
   * Detect if page shows rate limit or blocking message
   */
  async detectRateLimit() {
    if (!this.page) return false;
    try {
      const rateLimitIndicators = [
        'accès temporairement restreint',
        'acces temporairement restreint',
        'temporarily restricted',
        'IPPOLL_REASONCODE',
        'ippoll_reasoncode',
        'rate limited',
        'too many requests',
        'trop de requêtes',
        'ralentis',
        'essayez plus tard',
        'try again later',
        'temporarily unavailable',
        'blocked',
        'bloqué',
        '403',
      ];

      const pageText = await this.page.evaluate(() => document.body?.innerText?.toLowerCase() || '').catch(() => '');

      for (const indicator of rateLimitIndicators) {
        if (pageText.includes(indicator.toLowerCase())) {
          logger.warn(`🚫 Rate limit indicator detected on LBC: "${indicator}"`);
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.debug('Error detecting rate limit:', error.message);
      return false;
    }
  }

  /**
   * Retry navigation with exponential backoff (conservative for LBC)
   */
  async safeGotoWithRetry(url, options = {}, metrics = null) {
    const { retryMax = 3, retryBackoffMs = 3000 } = config.scraping; // LBC uses 3s base (vs 2s for Vinted)

    let lastError = null;
    if (metrics) metrics.navigations_total++;

    for (let attempt = 1; attempt <= retryMax; attempt++) {
      try {
        logger.debug(`[LBC] Navigation attempt ${attempt}/${retryMax}: ${url}`);

        await this.safeGoto(url, options);

        // Check if we got rate limited
        if (await this.detectRateLimit()) {
          if (metrics) metrics.rate_limits_hit++;

          if (attempt < retryMax) {
            if (metrics) metrics.retries_needed++;
            const waitTime = retryBackoffMs * Math.pow(2, attempt - 1); // Conservative backoff: 3s, 6s, 12s...
            logger.warn(`⏱️ [LBC] Rate limited detected! Waiting ${waitTime}ms before retry ${attempt + 1}/${retryMax}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            if (metrics) metrics.navigations_failed++;
            throw new Error('[LBC] Rate limited - max retries reached');
          }
        }

        logger.debug(`✅ [LBC] Navigation successful on attempt ${attempt}`);
        return;
      } catch (error) {
        lastError = error;

        if (attempt < retryMax) {
          if (metrics) metrics.retries_needed++;
          const waitTime = retryBackoffMs * Math.pow(2, attempt - 1);
          logger.warn(`[LBC] Navigation failed (${error.message}). Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    if (metrics) metrics.navigations_failed++;
    throw lastError || new Error('[LBC] Navigation failed after all retries');
  }

  /**
   * Fetch listings from Leboncoin
   */
  async fetch(query, options = {}) {
    const {
      maxResults = 50,
      waitForCaptcha = 300,
      excludeExternalIds = [],
      scanDepth = Math.max(maxResults * 3, 30),
    } = options; // 5 minutes par défaut pour résoudre CAPTCHA LBC dans la fenêtre visible

    // Tracking metrics for LBC monitoring
    const metrics = {
      captcha_encountered: 0,
      captcha_resolved: 0,
      rate_limits_hit: 0,
      retries_needed: 0,
      cooldown_triggered: 0,
      navigations_total: 0,
      navigations_failed: 0,
      delay_times_ms: [],
    };

    let captchaJustResolved = false; // Flag pour ultra-prudence post-CAPTCHA

    try {
      await this.init();

      // Wait BEFORE even starting - LBC checks initial connection
      logger.info('⏳ [LBC] Initial connection wait (5-8s) to avoid immediate detection...');
      const initialWait = 5000 + Math.random() * 3000; // 5-8s
      metrics.delay_times_ms.push(initialWait);
      await new Promise(resolve => setTimeout(resolve, initialWait));

      // Step 1: Visit homepage first (more human-like)
      logger.info('Visiting Leboncoin homepage first...');
      await this.safeGotoWithRetry(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 }, metrics);

      // LONGER delay after homepage - LBC is very sensitive
      const delay1 = 4000 + Math.random() * 3000; // 4-7s (was 2-4s)
      metrics.delay_times_ms.push(delay1);
      logger.debug(`[LBC] Waiting ${delay1}ms after homepage access...`);
      await new Promise(resolve => setTimeout(resolve, delay1));

      // Step 2: Navigate to search with VERY LONG delay
      const searchUrl = this.buildSearchUrl(query, options);
      logger.info(`Navigating to: ${searchUrl}`);

      await this.safeGotoWithRetry(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 }, metrics);

      // MUCH LONGER delay after search navigation - THIS IS WHERE LBC DETECTS BOTS
      const delay2 = 6000 + Math.random() * 4000; // 6-10s (was 2-3s)
      metrics.delay_times_ms.push(delay2);
      logger.debug(`[LBC] Waiting ${delay2}ms after search navigation (critical - LBC very aggressive here)...`);
      await new Promise(resolve => setTimeout(resolve, delay2));

      // IMMEDIATELY check for rate limit after search page load
      logger.debug('[LBC] Checking for early rate limit after search page load...');
      if (await this.detectRateLimit()) {
        metrics.rate_limits_hit++;
        logger.error('❌ [LBC] Rate limit detected EARLY (right after search page). Waiting 30s recovery...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        if (await this.detectRateLimit()) {
          metrics.rate_limits_hit++;
          throw new Error('[LBC] Rate limit detected immediately on search page. LBC is detecting the bot. Try again in 30 minutes.');
        }
      }

      // Check for CAPTCHA
      if (await this.detectCaptcha()) {
        metrics.captcha_encountered++;
        const debugInfo = await this.saveDebugInfo('captcha');
        logger.warn(`⏳ CAPTCHA/DataDome Leboncoin détecté ! Tu as ${waitForCaptcha} secondes pour le résoudre manuellement dans la fenêtre Chrome visible...`);
        logger.warn(`   Screenshots sauvegardés : ${debugInfo?.screenshotPath}`);
        logger.warn(`   Ne ferme pas Chrome. Résous le challenge puis attends : le scan reprend automatiquement.`);

        // Wait for user to solve CAPTCHA
        await new Promise(resolve => setTimeout(resolve, waitForCaptcha * 1000));

        // Check again after waiting
        if (await this.detectCaptcha()) {
          logger.error('❌ CAPTCHA toujours présent après attente');
          throw new Error(`CAPTCHA not resolved after ${waitForCaptcha}s. Debug info: ${JSON.stringify(debugInfo)}`);
        }

        logger.info('✅ CAPTCHA résolu ! Sauvegarde des cookies...');
        metrics.captcha_resolved++;
        captchaJustResolved = true;
        await this.saveCookiesAfterCaptcha();

        // EXTREME strategy: After CAPTCHA is resolved, LBC is in extreme detection mode
        // STOP THE SCAN completely - don't fetch ANY listings post-CAPTCHA
        // This is the ONLY way to avoid the post-CAPTCHA blocking
        logger.warn('🛡️ [LBC] CAPTCHA just resolved - STOPPING scan to avoid post-CAPTCHA blocking');
        logger.warn('⏱️ [LBC] LBC maintains extreme detection after CAPTCHA. Cookies saved for next session.');
        logger.info('💾 User should wait 30-60 minutes before retrying. Cookies are ready for next session.');

        // Return empty results but save cookies for next scan
        return attachLeboncoinMetadata([], {
          grid_raw_found: 0,
          selected_for_details: 0,
          selected_external_ids: [],
          prefilter_summary: { total: 0, selected: 0, already_seen: 0, duplicate: 0, invalid_url: 0 },
          lbc_metrics: {
            ...metrics,
            avg_delay_ms: metrics.delay_times_ms.length > 0
              ? Math.round(metrics.delay_times_ms.reduce((a, b) => a + b, 0) / metrics.delay_times_ms.length)
              : 0,
            listings_fetched: 0,
            success_rate: 0,
            note: 'Scan stopped after CAPTCHA resolution to prevent post-CAPTCHA blocking. Cookies saved for next session (wait 30-60 min).',
          },
        });
      }

      // VERY LONG wait before trying to interact with listings
      // Only if CAPTCHA was NOT just resolved
      if (!captchaJustResolved) {
        logger.debug('[LBC] Waiting 5-8s before accessing listings (human-like behavior)...');
        const preListingDelay = 5000 + Math.random() * 3000;
        metrics.delay_times_ms.push(preListingDelay);
        await new Promise(resolve => setTimeout(resolve, preListingDelay));
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
          lbc_metrics: {
            ...metrics,
            avg_delay_ms: metrics.delay_times_ms.length > 0
              ? Math.round(metrics.delay_times_ms.reduce((a, b) => a + b, 0) / metrics.delay_times_ms.length)
              : 0,
            listings_fetched: 0,
            success_rate: 0,
          },
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

      // Wait before processing - LBC watches for rapid extraction
      logger.debug('[LBC] Waiting 4-6s before processing listings (avoid rapid scraping detection)...');
      const preProcessDelay = 4000 + Math.random() * 2000;
      metrics.delay_times_ms.push(preProcessDelay);
      await new Promise(resolve => setTimeout(resolve, preProcessDelay));

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
      let listingsToFetch = selectedUrls;

      // Ultra-prudent strategy: if CAPTCHA was just resolved, fetch only 1 listing
      if (captchaJustResolved) {
        logger.warn('[LBC] CAPTCHA just resolved - limiting to 1 listing to avoid being blocked again');
        listingsToFetch = selectedUrls.slice(0, 1);
      }

      for (const url of listingsToFetch) {
        try {
          logger.debug(`Fetching listing: ${url}`);

          // Validate URL before navigating
          if (!url.startsWith('https://www.leboncoin.fr/')) {
            logger.warn(`Skipping invalid URL: ${url}`);
            continue;
          }

          // Conservative delay between page loads to avoid rate limiting
          // After CAPTCHA: use VERY long delays (8-15s instead of 3-6s)
          const delayListing = captchaJustResolved
            ? 8000 + Math.random() * 7000  // 8-15s post-CAPTCHA
            : 3000 + Math.random() * 3000; // 3-6s normal

          metrics.delay_times_ms.push(delayListing);
          logger.debug(`[LBC] Waiting ${delayListing}ms before next listing fetch (${captchaJustResolved ? 'post-CAPTCHA' : 'normal'})`);
          await new Promise(resolve => setTimeout(resolve, delayListing));

          await this.safeGotoWithRetry(url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
          }, metrics);

          // Random scroll to simulate human behavior
          await this.page.evaluate(() => {
            window.scrollTo(0, Math.random() * 500);
          });

          // Longer delay after scroll for post-CAPTCHA safety
          const postScrollDelay = captchaJustResolved
            ? 5000 + Math.random() * 3000  // 5-8s post-CAPTCHA
            : 2000 + Math.random() * 2000; // 2-4s normal

          logger.debug(`[LBC] Waiting ${postScrollDelay}ms after scroll`);
          await new Promise(resolve => setTimeout(resolve, postScrollDelay));

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
        lbc_metrics: {
          ...metrics,
          avg_delay_ms: metrics.delay_times_ms.length > 0
            ? Math.round(metrics.delay_times_ms.reduce((a, b) => a + b, 0) / metrics.delay_times_ms.length)
            : 0,
          listings_fetched: listings.length,
          success_rate: selectedUrls.length > 0
            ? Math.round((listings.length / selectedUrls.length) * 100)
            : 0,
        },
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
