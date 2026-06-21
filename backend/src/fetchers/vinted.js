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
const POKEMON_DOMAIN_PREFILTER_PATTERN = /\b(pokemon|pokémon|wizards?|wotc|tcg|jcc|base\s*set|set\s*de\s*base|jungle|fossile|fossil|team\s*rocket|rocket|obscur(?:e|s)?|dracaufeu|charizard|tortank|blastoise|florizarre|venusaur|mewtwo|raichu|dracolosse|dragonite)\b|\/\s*(?:82|64|62|102)\b/i;
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

function parseGridPrice(text = '') {
  const match = String(text).match(/(?:€|eur|euro)\s*([0-9]+(?:[.,][0-9]{1,2})?)|([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:€|eur|euro)/i);
  const value = match?.[1] || match?.[2] || null;
  if (!value) return 0;
  return Number.parseFloat(String(value).replace(',', '.')) || 0;
}

function buildFallbackListing(url, gridItem = {}) {
  const text = String(gridItem.text || '').trim();
  const externalId = extractVintedExternalId(url);
  return {
    source: 'vinted',
    external_id: externalId,
    url,
    title: text || url,
    description: text,
    price: parseGridPrice(text),
    location: '',
    lat: null,
    lon: null,
    distance_km: null,
    image_url: null,
    posted_at: new Date().toISOString(),
    is_wizards: false,
    is_french: false,
    is_lot: false,
    card_count_estimate: null,
    score: null,
  };
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
  buildSearchUrl(query, options = {}) {
    // Use generic catalog route; clothing category route introduces noisy bias.
    const url = new URL('/catalog', this.baseUrl);
    url.searchParams.set('search_text', query);
    url.searchParams.set('order', 'newest_first');

    const budget = typeof options.budget === 'object' && options.budget !== null
      ? options.budget
      : {};
    const min = Number(options.priceFrom ?? options.price_from ?? options.minPrice ?? options.min_price ?? budget.min ?? budget.minPrice ?? budget.min_price);
    const max = Number(options.priceTo ?? options.price_to ?? options.maxPrice ?? options.max_price ?? budget.max ?? budget.maxPrice ?? budget.max_price);

    if (Number.isFinite(min) && min > 0) {
      url.searchParams.set('price_from', String(min));
    }
    if (Number.isFinite(max) && max > 0) {
      url.searchParams.set('price_to', String(max));
    }

    return url.toString();
  }

  /**
   * Fetch listings from Vinted
   */
  async fetch(query, options = {}) {
    const {
      maxResults = 50,
      waitForCaptcha = 60,
      excludeExternalIds = [],
      scanDepth = Math.max(maxResults * 5, 50),
      targetSeries = 'all',
      listingType = 'all',
      allowSeenRescue = false,
      maxScrollPasses = 18,
    } = options;

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
          selected_external_ids: [],
        });
      }

      // Extract listing URLs using incremental scroll, so scans can go beyond first viewport cards.
      const searchItems = await this.page.evaluate(async (limit, maxPasses) => {
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

        const collectItems = () => {
          // Strategy 1: article links
          let items = Array.from(document.querySelectorAll('article a[href*="/items/"]'));

          // Strategy 2: any link with /items/
          if (items.length === 0) {
            items = Array.from(document.querySelectorAll('a[href*="/items/"]'));
          }

          // Strategy 3: feed-grid items
          if (items.length === 0) {
            items = Array.from(document.querySelectorAll('.feed-grid a, [class*="feed"] a'));
          }

          for (const anchor of items) {
            const url = anchor.href;
            if (!url || !url.includes('/items/') || byUrl.has(url)) continue;
            const container = anchor.closest('article, div.feed-grid__item, [class*="feed-grid__item"], [data-testid*="item"]');
            const text = `${collectNodeText(anchor)} ${container?.textContent || ''}`.trim();
            byUrl.set(url, { url, text });
          }
        };

        const sleep = (delayMs) => new Promise(resolve => setTimeout(resolve, delayMs));
        let stagnantPasses = 0;
        for (let pass = 0; pass < maxPasses && byUrl.size < limit; pass++) {
          const before = byUrl.size;
          collectItems();
          const after = byUrl.size;
          if (after === before) stagnantPasses += 1;
          else stagnantPasses = 0;
          if (stagnantPasses >= 3) break;

          window.scrollBy(0, Math.round(window.innerHeight * 0.9));
          await sleep(450 + Math.floor(Math.random() * 250));
        }

        collectItems();

        const urls = [...byUrl.keys()];

        console.log(`Total unique URLs: ${urls.length}`);
        if (urls.length > 0) {
          console.log(`First URL sample: ${urls[0]}`);
        }

        return [...byUrl.values()].slice(0, limit);
      }, scanDepth, Math.max(3, Number(maxScrollPasses) || 18));
      const rescueSeenWhenBelow = allowSeenRescue && listingType === 'lot' && targetSeries !== 'all'
        ? Math.min(5, maxResults)
        : 0;
      const prefilterOptions = { excludeExternalIds, maxResults, targetSeries, listingType, query, rescueSeenWhenBelow };
      const selectedItems = selectUnseenVintedItems(searchItems, prefilterOptions);
      const prefilterSummary = summarizeVintedPrefilter(searchItems, prefilterOptions);
      const rescuedSeen = selectedItems.filter(item => item.prefilter_reason === 'seen_rescue').length;
      if (rescuedSeen > 0) {
        prefilterSummary.rescued_seen = rescuedSeen;
      }
      const selectedUrls = selectedItems.map(item => item.url);
      const selectedExternalIds = selectedUrls
        .map(url => extractVintedExternalId(url))
        .filter(Boolean);
      const selectedItemByUrl = new Map(selectedItems.map(item => [item.url, item]));

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
          selected_external_ids: selectedExternalIds,
        });
      }

      if (selectedUrls.length === 0) {
        logger.info('No unseen Vinted URLs selected from current result window');
        return attachPrefilterMetadata([], {
          prefilter_summary: prefilterSummary,
          grid_raw_found: searchItems.length,
          selected_for_details: 0,
          selected_external_ids: selectedExternalIds,
        });
      }

      // Fetch details for each unseen listing
      const listings = [];
      for (const url of selectedUrls) {
        const selectedItem = selectedItemByUrl.get(url) || null;
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

          const isParsed = Boolean(listing && listing.title !== 'No title');
          const finalListing = isParsed ? listing : buildFallbackListing(url, selectedItem || {});

          listings.push(finalListing);
          if (isParsed) {
            logger.info(`✅ Parsed: ${finalListing.title} - ${finalListing.price}€`);
          } else {
            logger.warn(`⚠️  Failed to parse listing properly, using grid fallback: ${url}`);
          }
        } catch (error) {
          const fallbackListing = buildFallbackListing(url, selectedItem || {});
          listings.push(fallbackListing);
          logger.warn(`⚠️  Failed to fetch listing ${url}, using grid fallback: ${error.message}`);
        }
      }

      return attachPrefilterMetadata(listings, {
        prefilter_summary: prefilterSummary,
        grid_raw_found: searchItems.length,
        selected_for_details: selectedUrls.length,
        selected_external_ids: selectedExternalIds,
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
