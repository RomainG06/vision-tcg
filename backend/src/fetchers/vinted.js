import { BaseFetcher } from './base.js';
import { logger } from '../utils/logger.js';

export function extractVintedExternalId(url) {
  const match = String(url || '').match(/\/items\/(\d+)/);
  return match ? match[1] : null;
}

const SERIES_PREFILTER_PATTERNS = {
  rocket: /\b(team\s*rocket|rocket|obscur(?:e|s)?|dark\s+(?:charizard|blastoise|dragonite|raichu|alakazam|magneton|hypno|slowbro|arbok|dugtrio|golbat|gyarados|machamp|vileplume|weezing))\b/i,
  jungle: /\b(jungle)\b/i,
  fossil: /\b(fossile|fossil)\b/i,
  base: /\b(set\s*de\s*base|base\s*set)\b/i,
};

function itemText(item) {
  return typeof item === 'string'
    ? item
    : `${item.text || ''} ${item.url || ''}`.trim();
}

function itemUrl(item) {
  return typeof item === 'string' ? item : item.url;
}

function matchesTargetSeriesPrefilter(item, targetSeries) {
  const pattern = SERIES_PREFILTER_PATTERNS[targetSeries];
  if (!targetSeries || targetSeries === 'all' || !pattern) return true;
  return pattern.test(itemText(item));
}

export function selectUnseenVintedItems(items, options = {}) {
  const {
    excludeExternalIds = new Set(),
    maxResults = 50,
    targetSeries = 'all',
  } = options;

  const seen = excludeExternalIds instanceof Set
    ? excludeExternalIds
    : new Set(Array.from(excludeExternalIds || []).map(String));
  const selected = [];
  const deduped = new Set();

  for (const item of items) {
    const url = itemUrl(item);
    const externalId = extractVintedExternalId(url);
    if (!externalId || seen.has(String(externalId)) || deduped.has(String(externalId))) continue;
    if (!matchesTargetSeriesPrefilter(item, targetSeries)) continue;

    deduped.add(String(externalId));
    selected.push(typeof item === 'string' ? { url, text: url } : item);
    if (selected.length >= maxResults) break;
  }

  return selected;
}

export function selectUnseenVintedUrls(urls, options = {}) {
  return selectUnseenVintedItems(urls, options).map(item => item.url);
}

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
    const { maxResults = 50, waitForCaptcha = 60, excludeExternalIds = [], scanDepth = Math.max(maxResults * 5, 50), targetSeries = 'all' } = options;
    
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
      
      // Scroll a bit before extracting URLs so repeated scans can move beyond the first visible cards.
      await this.page.evaluate(async () => {
        for (let i = 0; i < 4; i++) {
          window.scrollBy(0, Math.round(window.innerHeight * 0.85));
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      });
      await this.randomDelay(800, 1400);

      // Extract listing URLs - try multiple strategies
      const searchItems = await this.page.evaluate((limit) => {
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
        
        const byUrl = new Map();
        for (const anchor of items) {
          const url = anchor.href;
          if (!url || !url.includes('/items/') || byUrl.has(url)) continue;
          const container = anchor.closest('article, div.feed-grid__item, [class*="feed-grid__item"], [data-testid*="item"]');
          const text = `${anchor.textContent || ''} ${container?.textContent || ''}`.trim();
          byUrl.set(url, { url, text });
        }

        const urls = [...byUrl.keys()];
        
        console.log(`Total unique URLs: ${urls.length}`);
        if (urls.length > 0) {
          console.log(`First URL sample: ${urls[0]}`);
        }
        
        return [...byUrl.values()].slice(0, limit);
      }, scanDepth);
      const selectedItems = selectUnseenVintedItems(searchItems, { excludeExternalIds, maxResults, targetSeries });
      const selectedUrls = selectedItems.map(item => item.url);
      
      logger.info(`Found ${searchItems.length} listing URLs on Vinted, ${selectedUrls.length} selected after already-seen + series prefilter`);
      if (searchItems.length > 0) {
        logger.debug(`First URL: ${searchItems[0].url}`);
      } else {
        logger.error('❌ No URLs extracted! Saving debug info...');
        await this.saveDebugInfo('no_urls_extracted');
        return [];
      }

      if (selectedUrls.length === 0) {
        logger.info('No unseen Vinted URLs selected from current result window');
        return [];
      }
      
      // Fetch details for each unseen listing
      const listings = [];
      for (const url of selectedUrls) {
        try {
          logger.debug(`Fetching listing: ${url}`);
          await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
          await this.randomDelay(500, 1500);
          
          // Extract data directly from the page instead of parsing HTML
          const listing = await this.page.evaluate((url) => {
            // Extract ID from URL
            const urlMatch = url.match(/items\/(\d+)/);
            const externalId = urlMatch ? urlMatch[1] : null;
            
            // Title - try multiple selectors
            const title = document.querySelector('h1[itemprop="name"]')?.textContent?.trim()
              || document.querySelector('h1.details-list__item-title')?.textContent?.trim()
              || document.querySelector('h1')?.textContent?.trim()
              || 'No title';
            
            // Price - try multiple selectors
            const priceEl = document.querySelector('[data-testid="item-price"]')
              || document.querySelector('.details-list__item-price')
              || document.querySelector('[itemprop="price"]')
              || document.querySelector('h3');
            const priceText = priceEl?.textContent?.trim() || '0';
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            
            // Description
            const description = document.querySelector('[itemprop="description"]')?.textContent?.trim()
              || document.querySelector('.details-list__item-description')?.textContent?.trim()
              || '';
            
            // Location
            const location = document.querySelector('.details-list__item-location')?.textContent?.trim()
              || document.querySelector('[data-testid="item-location"]')?.textContent?.trim()
              || '';
            
            // Image
            const imageEl = document.querySelector('.details-list__item-photo img')
              || document.querySelector('[itemprop="image"]')
              || document.querySelector('img[alt*="photo"]');
            const imageUrl = imageEl?.src || imageEl?.getAttribute('src') || null;
            
            // Posted date
            const dateEl = document.querySelector('time');
            const postedAt = dateEl?.getAttribute('datetime') || new Date().toISOString();
            
            return {
              source: 'vinted',
              external_id: externalId,
              url,
              title,
              description,
              price,
              location,
              lat: null,
              lon: null,
              distance_km: null,
              image_url: imageUrl,
              posted_at: postedAt,
              is_wizards: false,
              is_french: false,
              is_lot: false,
              card_count_estimate: null,
              score: null
            };
          }, url);
          
          if (listing && listing.title !== 'No title') {
            listings.push(listing);
            logger.info(`✅ Parsed: ${listing.title} - ${listing.price}€`);
          } else {
            logger.warn(`⚠️  Failed to parse listing properly: ${url}`);
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
