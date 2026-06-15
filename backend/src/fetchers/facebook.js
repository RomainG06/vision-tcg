import { BaseFetcher } from './base.js';
import { logger } from '../utils/logger.js';

/**
 * Facebook Marketplace fetcher
 * Fetches Pokemon card listings from Facebook Marketplace
 */
export class FacebookFetcher extends BaseFetcher {
  constructor() {
    super('https://www.facebook.com');
  }
  
  /**
   * Build search URL
   */
  buildSearchUrl(query, location = 'Nice, France', radius = 50) {
    // Facebook Marketplace search URL structure
    const searchQuery = encodeURIComponent(query);
    const locationQuery = encodeURIComponent(location);
    
    // Radius in km (Facebook uses radius parameter)
    return `${this.baseUrl}/marketplace/category/search/?query=${searchQuery}&minPrice=0&maxPrice=100&deliveryMethod=local_pick_up&exact=false&sortBy=creation_time_descend&location=${locationQuery}&radiusKM=${radius}`;
  }
  
  /**
   * Fetch listings from Facebook Marketplace
   */
  async fetch(query, options = {}) {
    const { maxResults = 50, location = 'Nice, France', radius = 50, waitForCaptcha = 60 } = options;
    
    try {
      await this.init();
      
      // Step 1: Visit homepage first (human behavior)
      logger.info('🏠 Visiting Facebook homepage...');
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.randomDelay(2000, 4000);
      
      // Check for login requirement
      const needsLogin = await this.page.evaluate(() => {
        return document.querySelector('input[name="email"]') !== null;
      });
      
      if (needsLogin) {
        logger.warn('⚠️  Facebook requires login - marketplace scraping needs authenticated session');
        logger.warn('   This is a known limitation. Consider using Facebook Graph API instead.');
        await this.saveDebugInfo('login_required');
        return [];
      }
      
      // Step 2: Navigate to marketplace search
      const searchUrl = this.buildSearchUrl(query, location, radius);
      logger.info(`🔍 Searching: ${searchUrl}`);
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.randomDelay(2000, 3000);
      
      // Check for CAPTCHA
      const captchaDetected = await this.detectCaptcha();
      if (captchaDetected) {
        logger.warn(`⏳ CAPTCHA détecté ! Tu as ${waitForCaptcha} secondes pour le résoudre...`);
        logger.warn('   Le script attend... résous le CAPTCHA dans le navigateur ouvert.');
        
        await this.saveDebugInfo('captcha_detected');
        
        // Wait for manual resolution
        await new Promise(resolve => setTimeout(resolve, waitForCaptcha * 1000));
        
        // Re-check
        const stillCaptcha = await this.detectCaptcha();
        if (stillCaptcha) {
          throw new Error('CAPTCHA still present after waiting period');
        }
        
        logger.info('✅ CAPTCHA résolu ! Sauvegarde des cookies...');
        await this.saveCookiesAfterCaptcha();
      }
      
      // Wait for listings to load - Facebook uses dynamic class names
      try {
        // Try multiple selectors
        const selectors = [
          'div[role="main"] a[href*="/marketplace/item/"]',
          'a[href*="/marketplace/item/"]',
          'div[data-pagelet*="Marketplace"]'
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
      
      // Scroll to load more items (Facebook lazy loads)
      logger.info('📜 Scrolling to load more items...');
      await this.page.evaluate(async () => {
        for (let i = 0; i < 3; i++) {
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      });
      await this.randomDelay(1000, 2000);
      
      // Extract listing URLs - try multiple strategies
      const listingUrls = await this.page.evaluate(() => {
        // Strategy 1: marketplace item links
        let items = Array.from(document.querySelectorAll('a[href*="/marketplace/item/"]'));
        console.log(`Strategy 1 (marketplace/item): Found ${items.length} links`);
        
        // Strategy 2: any marketplace link
        if (items.length === 0) {
          items = Array.from(document.querySelectorAll('a[href*="/marketplace/"]'));
          items = items.filter(a => a.href.includes('/item/'));
          console.log(`Strategy 2 (marketplace filter): Found ${items.length} links`);
        }
        
        const urls = items
          .map(a => {
            // Clean Facebook URL (remove tracking params)
            const url = a.href.split('?')[0];
            return url;
          })
          .filter(href => href && href.includes('/marketplace/item/'))
          // Remove duplicates
          .filter((url, index, self) => self.indexOf(url) === index);
        
        console.log(`Total unique URLs: ${urls.length}`);
        if (urls.length > 0) {
          console.log(`First URL sample: ${urls[0]}`);
        }
        
        return urls.slice(0, 50);
      });
      
      logger.info(`Found ${listingUrls.length} listing URLs on Facebook Marketplace`);
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
          
          // Extract data directly from the page
          const listing = await this.page.evaluate((url) => {
            // Extract ID from URL
            const urlMatch = url.match(/item\/(\d+)/);
            const externalId = urlMatch ? urlMatch[1] : null;
            
            // Title - try multiple selectors
            const title = document.querySelector('h1')?.textContent?.trim()
              || document.querySelector('span[dir="auto"]')?.textContent?.trim()
              || 'No title';
            
            // Price - Facebook shows price prominently
            const priceEl = document.querySelector('[data-testid="marketplace_item_price"]')
              || Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes('€'));
            const priceText = priceEl?.textContent?.trim() || '0';
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            
            // Description
            const description = document.querySelector('[data-testid="marketplace_item_description"]')?.textContent?.trim()
              || document.querySelector('div[style*="text-align"] span')?.textContent?.trim()
              || '';
            
            // Location
            const location = document.querySelector('[data-testid="marketplace_item_location"]')?.textContent?.trim()
              || Array.from(document.querySelectorAll('span')).find(el => el.textContent.match(/\d{5}/))?.textContent?.trim()
              || '';
            
            // Image
            const imageEl = document.querySelector('img[data-visualcompletion="media-vc-image"]')
              || document.querySelector('img[src*="scontent"]');
            const imageUrl = imageEl?.src || null;
            
            // Posted date - Facebook shows relative time
            const dateText = Array.from(document.querySelectorAll('span')).find(el => 
              el.textContent.match(/il y a|hours ago|days ago|minutes ago/)
            )?.textContent?.trim();
            
            // Convert relative time to approximate ISO date
            let postedAt = new Date().toISOString();
            if (dateText) {
              const now = new Date();
              if (dateText.includes('hour') || dateText.includes('heure')) {
                const hours = parseInt(dateText) || 1;
                now.setHours(now.getHours() - hours);
              } else if (dateText.includes('day') || dateText.includes('jour')) {
                const days = parseInt(dateText) || 1;
                now.setDate(now.getDate() - days);
              } else if (dateText.includes('minute')) {
                const mins = parseInt(dateText) || 1;
                now.setMinutes(now.getMinutes() - mins);
              }
              postedAt = now.toISOString();
            }
            
            return {
              source: 'facebook',
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
      
      logger.info(`\n✅ Total listings fetched: ${listings.length}`);
      return listings;
      
    } catch (error) {
      logger.error('Facebook Marketplace scraping failed:', error.message);
      throw error;
    }
  }
}
