import { BaseFetcher } from './base.js';
import { logger } from '../utils/logger.js';

export function extractVintedExternalId(url) {
  const match = String(url || '').match(/\/items\/(\d+)/);
  return match ? match[1] : null;
}

const SERIES_PREFILTER_PATTERNS = {
  rocket: /\b(team\s*rocket|rocket|dark\s+(?:charizard|blastoise|dragonite|raichu|alakazam|magneton|hypno|slowbro|arbok|dugtrio|golbat|gyarados|machamp|vileplume|weezing)|(?:dracaufeu|dracofeu|tortank|dracolosse|raichu|alakazam|magneton|magnéton|hypnomade|flagadoss|arbok|triopikeur|nosferalto|leviator|léviator|mackogneur|rafflesia|rafflésia|smogogo|ossatueur|ramoloss|slowbro)\s+(?:obscur(?:e|s)?|sombre?s?))\b|\bobscur(?:e|s)?\b(?=.*\/82\b)/i,
  // Vinted grid titles often show only the card name + collector number, not the series name.
  // These are still target-series clues, not a permission to open arbitrary cards.
  jungle: /\b(jungle)\b|\/64\b|\b(aeromite|aéromite|aquali|vaporeon|voltali|jolteon|pyroli|flareon|ronflex|snorlax|scarabrute|pinsir|insécateur|insecateur|scyther|nidoqueen|kangourex|kangaskhan|electhor|électhor|rafflesia|vileplume|victreebel|m\.mime|mr\s+mime|ossatueur|marowak|roucarnage|pidgeot)\b/i,
  fossil: /\b(fossile|fossil)\b|\/62\b|\b(artikodin|articuno|electhor|électhor|zapdos|sulfura|moltres|dracolosse|dragonite|ectoplasma|gengar|lokhlass|lapras|kabutops|ptéra|ptera|aerodactyl|raichu|hypnomade|hypno|magneton)\b/i,
  base: /\b(set\s*de\s*base|base\s*set)\b|\/102\b|\b(dracaufeu|charizard|tortank|blastoise|florizarre|venusaur|alakazam|leveinard|chansey|raichu|mewtwo|magneton|nidoking|feunard|ninetales)\b/i,
};

const OFF_TARGET_PREFILTER_PATTERN = /\b(diamant\s*&?\s*perle|diamant\s+et\s+perle|dp\s*0?\d|dp01|dp02|trésors?\s+mystérieux|tresors?\s+mysterieux|sintonia\s+mentale|pokemon\s+go|pokémon\s+go|ecarlate|écarlate|violet|soleil|lune|sun\s*&?\s*moon|epee|épée|bouclier|sword|shield)\b|\/(?:78|123|130|236)\b/i;
const POKEMON_DOMAIN_PREFILTER_PATTERN = /\b(pokemon|pokémon|cartes?|cards?|wizards?|wotc|holo|rare|tcg|jcc|jungle|fossile|fossil|rocket|obscur(?:e|s)?)\b|\/\s*(?:82|64|62|102)\b/i;
const LOT_PREFILTER_PATTERN = /\b(lot|lots|collection|classeur|vrac|set\s+complet|complete\s+set)\b|\b([2-9]|[1-9]\d+)\s*(cartes?|cards?)\b/i;
const SINGLE_CARD_PREFILTER_PATTERN = /\b(carte\s+seule|carte\s+unique|à\s+l'unité|a\s+l'unite|unitaire|single\s+card)\b/i;

function itemText(item) {
  return typeof item === 'string'
    ? item
    : `${item.text || ''} ${item.url || ''}`.trim();
}

function itemUrl(item) {
  return typeof item === 'string' ? item : item.url;
}

function matchesListingTypePrefilter(text, listingType) {
  if (!listingType || listingType === 'all') return true;
  const isLot = LOT_PREFILTER_PATTERN.test(text) && !SINGLE_CARD_PREFILTER_PATTERN.test(text);
  if (listingType === 'lot') return isLot;
  if (listingType === 'cards') return !isLot;
  return true;
}

function queryStronglyTargetsSeries(query = '', targetSeries = 'all') {
  const pattern = SERIES_PREFILTER_PATTERNS[targetSeries];
  if (!query || !targetSeries || targetSeries === 'all' || !pattern) return false;
  return pattern.test(query);
}

function getPrefilterDecision(item, options = {}) {
  const {
    targetSeries = 'all',
    listingType = 'all',
    query = '',
  } = options;
  const text = itemText(item);
  const pattern = SERIES_PREFILTER_PATTERNS[targetSeries];
  const listingTypeMatches = matchesListingTypePrefilter(text, listingType);
  const seriesMatches = Boolean(pattern?.test(text));
  const pokemonDomainMatches = POKEMON_DOMAIN_PREFILTER_PATTERN.test(text) || seriesMatches;
  const hasActiveHuntIntent = Boolean(query || targetSeries !== 'all' || listingType !== 'all');

  if (!listingTypeMatches) return { keep: false, reason: 'listing_type_mismatch' };
  if (OFF_TARGET_PREFILTER_PATTERN.test(text)) return { keep: false, reason: 'off_target_modern' };
  if (hasActiveHuntIntent && !pokemonDomainMatches) return { keep: false, reason: 'non_pokemon_domain' };
  if (!targetSeries || targetSeries === 'all' || !pattern) return { keep: true, reason: pokemonDomainMatches ? 'domain_match' : 'generic_unfiltered' };
  if (seriesMatches) return { keep: true, reason: 'series_grid_match' };

  // For strict Lot hunts, Vinted often hides the exact set in the grid.
  // If the query itself is strongly targeted (e.g. "lot dracolosse obscur")
  // and the grid item is clearly a lot, open it for detail scoring instead of dropping it blind.
  if (listingType === 'lot' && queryStronglyTargetsSeries(query, targetSeries)) {
    return { keep: true, reason: 'trusted_query_lot_candidate' };
  }

  return { keep: false, reason: 'series_mismatch' };
}

function matchesTargetSeriesPrefilter(item, targetSeries, listingType = 'all', query = '') {
  return getPrefilterDecision(item, { targetSeries, listingType, query }).keep;
}

export function selectUnseenVintedItems(items, options = {}) {
  const {
    excludeExternalIds = new Set(),
    maxResults = 50,
    targetSeries = 'all',
    listingType = 'all',
    query = '',
    rescueSeenWhenBelow = 0,
  } = options;

  const seen = excludeExternalIds instanceof Set
    ? excludeExternalIds
    : new Set(Array.from(excludeExternalIds || []).map(String));
  const selected = [];
  const deduped = new Set();

  const trySelect = (item, { allowSeen = false } = {}) => {
    const url = itemUrl(item);
    const externalId = extractVintedExternalId(url);
    if (!externalId || deduped.has(String(externalId))) return false;
    const isSeen = seen.has(String(externalId));
    if (isSeen && !allowSeen) return false;

    const normalizedItem = typeof item === 'string' ? { url, text: url } : item;
    const decision = getPrefilterDecision(item, { targetSeries, listingType, query });
    if (!decision.keep) return false;

    deduped.add(String(externalId));
    selected.push({ ...normalizedItem, prefilter_reason: allowSeen && isSeen ? 'seen_rescue' : decision.reason });
    return selected.length >= maxResults;
  };

  for (const item of items) {
    if (trySelect(item)) break;
  }

  const rescueThreshold = Number(rescueSeenWhenBelow) || 0;
  if (rescueThreshold > 0 && selected.length < Math.min(rescueThreshold, maxResults)) {
    for (const item of items) {
      if (trySelect(item, { allowSeen: true })) break;
    }
  }

  return selected;
}

export function selectUnseenVintedUrls(urls, options = {}) {
  return selectUnseenVintedItems(urls, options).map(item => item.url);
}

export function summarizeVintedPrefilter(items, options = {}) {
  const counts = {
    total: Array.isArray(items) ? items.length : 0,
    selected: 0,
    already_seen: 0,
    duplicate: 0,
    invalid_url: 0,
    listing_type_mismatch: 0,
    non_pokemon_domain: 0,
    off_target_modern: 0,
    series_mismatch: 0,
  };
  const seen = options.excludeExternalIds instanceof Set
    ? options.excludeExternalIds
    : new Set(Array.from(options.excludeExternalIds || []).map(String));
  const deduped = new Set();

  for (const item of items) {
    const url = itemUrl(item);
    const externalId = extractVintedExternalId(url);
    if (!externalId) {
      counts.invalid_url++;
      continue;
    }
    if (seen.has(String(externalId))) {
      counts.already_seen++;
      continue;
    }
    if (deduped.has(String(externalId))) {
      counts.duplicate++;
      continue;
    }
    deduped.add(String(externalId));
    const decision = getPrefilterDecision(item, options);
    if (decision.keep) counts.selected++;
    else counts[decision.reason] = (counts[decision.reason] || 0) + 1;
  }

  return counts;
}

function attachPrefilterMetadata(listings, metadata = {}) {
  const result = Array.isArray(listings) ? listings : [];
  for (const [key, value] of Object.entries(metadata)) {
    Object.defineProperty(result, key, {
      value,
      enumerable: false,
      configurable: true,
    });
  }
  return result;
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
    const { maxResults = 50, waitForCaptcha = 60, excludeExternalIds = [], scanDepth = Math.max(maxResults * 5, 50), targetSeries = 'all', listingType = 'all' } = options;
    
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
        return attachPrefilterMetadata([], {
          prefilter_summary: { total: 0, selected: 0, already_seen: 0, duplicate: 0, invalid_url: 0, listing_type_mismatch: 0, non_pokemon_domain: 0, off_target_modern: 0, series_mismatch: 0 },
          grid_raw_found: 0,
          selected_for_details: 0,
        });
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
        const collectNodeText = (anchor) => {
          const chunks = [
            anchor.textContent,
            anchor.getAttribute('aria-label'),
            anchor.getAttribute('title'),
            anchor.querySelector('img')?.getAttribute('alt'),
          ];
          let node = anchor;
          for (let depth = 0; depth < 4 && node; depth++) {
            chunks.push(node.textContent);
            chunks.push(node.getAttribute?.('aria-label'));
            chunks.push(node.getAttribute?.('title'));
            chunks.push(node.querySelector?.('img')?.getAttribute('alt'));
            node = node.parentElement;
          }
          return [...new Set(chunks.filter(Boolean).map(value => value.trim()).filter(Boolean))].join(' ').trim();
        };

        for (const anchor of items) {
          const url = anchor.href;
          if (!url || !url.includes('/items/') || byUrl.has(url)) continue;
          const container = anchor.closest('article, div.feed-grid__item, [class*="feed-grid__item"], [data-testid*="item"]');
          const text = `${collectNodeText(anchor)} ${container?.textContent || ''}`.trim();
          byUrl.set(url, { url, text });
        }

        const urls = [...byUrl.keys()];
        
        console.log(`Total unique URLs: ${urls.length}`);
        if (urls.length > 0) {
          console.log(`First URL sample: ${urls[0]}`);
        }
        
        return [...byUrl.values()].slice(0, limit);
      }, scanDepth);
      const rescueSeenWhenBelow = listingType === 'lot' && targetSeries !== 'all' ? Math.min(5, maxResults) : 0;
      const prefilterOptions = { excludeExternalIds, maxResults, targetSeries, listingType, query, rescueSeenWhenBelow };
      const selectedItems = selectUnseenVintedItems(searchItems, prefilterOptions);
      const prefilterSummary = summarizeVintedPrefilter(searchItems, prefilterOptions);
      const rescuedSeen = selectedItems.filter(item => item.prefilter_reason === 'seen_rescue').length;
      if (rescuedSeen > 0) {
        prefilterSummary.rescued_seen = rescuedSeen;
      }
      const selectedUrls = selectedItems.map(item => item.url);
      
      logger.info(`Found ${searchItems.length} listing URLs on Vinted, ${selectedUrls.length} selected after already-seen + target-series prefilter`);
      logger.info(`Prefilter summary: ${JSON.stringify(prefilterSummary)}`);
      if (searchItems.length > 0) {
        logger.debug(`First URL: ${searchItems[0].url}`);
      } else {
        logger.error('❌ No URLs extracted! Saving debug info...');
        await this.saveDebugInfo('no_urls_extracted');
        return attachPrefilterMetadata([], {
          prefilter_summary: prefilterSummary,
          grid_raw_found: 0,
          selected_for_details: 0,
        });
      }

      if (selectedUrls.length === 0) {
        logger.info('No unseen Vinted URLs selected from current result window');
        return attachPrefilterMetadata([], {
          prefilter_summary: prefilterSummary,
          grid_raw_found: searchItems.length,
          selected_for_details: 0,
        });
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
      
      return attachPrefilterMetadata(listings, {
        prefilter_summary: prefilterSummary,
        grid_raw_found: searchItems.length,
        selected_for_details: selectedUrls.length,
      });
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
