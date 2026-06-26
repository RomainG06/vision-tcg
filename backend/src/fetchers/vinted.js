import { BaseFetcher } from './base.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { sanitizeSearchQuery } from '../utils/url-validator.js';
import { isForeignLanguageOnly } from '../services/language-detection.js';

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
const PROMOTED_PREFILTER_PATTERN = /\b(sponsoris[ée]e?s?|sponsored|publicit[ée]|advertisement|annonce\s+sponsoris[ée]e?|article\s+boost[ée]|boosted\s+item|dressing\s+en\s+vitrine|vitrine\s+vendeur|vitrine\s+du\s+vendeur|wardrobe\s+spotlight|showcase)\b/i;
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
  const languageText = typeof item === 'string' ? item : String(item.text || '');
  const pattern = SERIES_PREFILTER_PATTERNS[targetSeries];
  const listingTypeMatches = matchesListingTypePrefilter(text, listingType);
  const seriesMatches = Boolean(pattern?.test(text));
  const pokemonDomainMatches = POKEMON_DOMAIN_PREFILTER_PATTERN.test(text) || seriesMatches;
  const hasActiveHuntIntent = Boolean(query || targetSeries !== 'all' || listingType !== 'all');

  if (PROMOTED_PREFILTER_PATTERN.test(text)) return { keep: false, reason: 'promoted_listing' };
  if (!listingTypeMatches) return { keep: false, reason: 'listing_type_mismatch' };
  if (isForeignLanguageOnly(languageText)) return { keep: false, reason: 'foreign_language' };
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
    foreign_language: 0,
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

const FAST_BLOCKED_RESOURCE_TYPES = new Set([
  'image',
  'font',
  'media',
]);

async function waitForAnySelector(page, selectors, timeoutPerSelector = 1500) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: timeoutPerSelector });
      return selector;
    } catch {
      // continue
    }
  }
  return null;
}

/**
 * Vinted fetcher
 * Fetches Pokemon card listings from Vinted
 */
export class VintedFetcher extends BaseFetcher {
  constructor() {
    super('vinted');
    this.baseUrl = 'https://www.vinted.fr';
    this._fastPageConfigured = false;
  }

  /**
   * Detect if page shows rate limit message
   */
  async detectRateLimit() {
    if (!this.page) return false;
    try {
      const rateLimitIndicators = [
        'You are rate limited',
        'rate limited',
        'too many requests',
        'trop de requêtes',
        'ralentis',
        'essayez plus tard',
        'try again later',
        'temporarily unavailable',
      ];

      const pageText = await this.page.evaluate(() => document.body.innerText.toLowerCase());

      for (const indicator of rateLimitIndicators) {
        if (pageText.includes(indicator.toLowerCase())) {
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
   * Retry navigation with exponential backoff
   */
  async safeGotoWithRetry(url, options = {}) {
    const { retryMax = 3, retryBackoffMs = 2000 } = config.scraping;

    let lastError = null;

    for (let attempt = 1; attempt <= retryMax; attempt++) {
      try {
        logger.debug(`Navigation attempt ${attempt}/${retryMax}: ${url}`);

        await this.safeGoto(url, options);

        // Check if we got rate limited
        if (await this.detectRateLimit()) {
          if (attempt < retryMax) {
            const waitTime = retryBackoffMs * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s...
            logger.warn(`⏱️ Rate limited detected! Waiting ${waitTime}ms before retry ${attempt + 1}/${retryMax}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw new Error('Rate limited - max retries reached');
          }
        }

        logger.debug(`✅ Navigation successful on attempt ${attempt}`);
        return;
      } catch (error) {
        lastError = error;

        if (attempt < retryMax) {
          const waitTime = retryBackoffMs * Math.pow(2, attempt - 1);
          logger.warn(`Navigation failed (${error.message}). Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('Navigation failed after all retries');
  }

  getPriceRangeOptions(options = {}) {
    const budget = typeof options.budget === 'object' && options.budget !== null
      ? options.budget
      : {};
    const min = Number(options.priceFrom ?? options.price_from ?? options.minPrice ?? options.min_price ?? budget.min ?? budget.minPrice ?? budget.min_price);
    const max = Number(options.priceTo ?? options.price_to ?? options.maxPrice ?? options.max_price ?? budget.max ?? budget.maxPrice ?? budget.max_price);

    return {
      min: Number.isFinite(min) && min > 0 ? min : null,
      max: Number.isFinite(max) && max > 0 ? max : null,
    };
  }

  withVintedPriceParams(urlLike, options = {}) {
    const url = new URL(urlLike, this.baseUrl);
    const { min, max } = this.getPriceRangeOptions(options);

    if (min !== null) url.searchParams.set('price_from', String(min));
    if (max !== null) url.searchParams.set('price_to', String(max));

    return url;
  }

  /**
   * Build search URL
   */
  buildSearchUrl(query, options = {}) {
    // Use generic catalog route; clothing category route introduces noisy bias.
    const url = new URL('/catalog', this.baseUrl);
    url.searchParams.set('search_text', query);
    url.searchParams.set('order', options.order || options.sort || 'newest_first');

    return this.withVintedPriceParams(url, options).toString();
  }

  async ensurePriceFiltersInUrl(options = {}) {
    const { min, max } = this.getPriceRangeOptions(options);
    if (min === null && max === null) return;

    const currentUrl = new URL(this.page.url());
    const hasMin = min === null || currentUrl.searchParams.get('price_from') === String(min);
    const hasMax = max === null || currentUrl.searchParams.get('price_to') === String(max);
    if (hasMin && hasMax) return;

    const fixedUrl = this.withVintedPriceParams(currentUrl, options).toString();
    logger.warn(`Vinted a retiré la fourchette prix de l'URL, re-navigation rapide avec filtres: ${fixedUrl}`);
    await this.safeGoto(fixedUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await this.randomDelay(400, 800);
  }

  /**
   * Configure la page une seule fois pour limiter le coût réseau.
   */
  async ensureFastPageConfig() {
    if (this._fastPageConfigured || !this.page) return;

    this.page.setDefaultNavigationTimeout(12000);
    this.page.setDefaultTimeout(4000);

    try {
      await this.page.setCacheEnabled(true);
    } catch {
      // ignore
    }

    try {
      await this.page.setViewport({ width: 1280, height: 900 });
    } catch {
      // ignore
    }

    try {
      await this.page.setRequestInterception(true);

      this.page.on('request', request => {
        try {
          if (typeof request.isInterceptResolutionHandled === 'function' && request.isInterceptResolutionHandled()) {
            return;
          }

          const type = request.resourceType();
          const url = request.url();

          if (
            FAST_BLOCKED_RESOURCE_TYPES.has(type) ||
            /\.woff2?(\?|$)/i.test(url) ||
            /\.ttf(\?|$)/i.test(url) ||
            /\.eot(\?|$)/i.test(url) ||
            /\.otf(\?|$)/i.test(url) ||
            /\.mp4(\?|$)/i.test(url) ||
            /\.webm(\?|$)/i.test(url) ||
            /\.avi(\?|$)/i.test(url) ||
            /\.mov(\?|$)/i.test(url)
          ) {
            request.abort();
            return;
          }

          request.continue();
        } catch {
          try {
            if (typeof request.isInterceptResolutionHandled === 'function' && request.isInterceptResolutionHandled()) {
              return;
            }
            request.continue();
          } catch {
            // ignore
          }
        }
      });
    } catch (error) {
      logger.warn(`Request interception not enabled: ${error.message}`);
    }

    this._fastPageConfigured = true;
  }

  /**
   * Fetch listings from Vinted
   */
  async fetch(query, options = {}) {
    const {
      maxResults = 50,
      waitForCaptcha = 60,
      excludeExternalIds = [],
      scanDepth = Math.max(maxResults * 3, 30),
      targetSeries = 'all',
      listingType = 'all',
      allowSeenRescue = false,
      maxScrollPasses = 8,
      visitHomepageFirst = false, // laisse à false pour max perf
    } = options;

    try {
      await this.init();
      await this.ensureFastPageConfig();

      if (visitHomepageFirst) {
        logger.info('Visiting Vinted homepage first...');
        await this.safeGotoWithRetry(this.baseUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });
        await this.randomDelay(400, 800);
      }

      // Sanitize query before building URL
      const safeQuery = sanitizeSearchQuery(query);
      const searchUrl = this.buildSearchUrl(safeQuery, options);
      logger.info(`Navigating to: ${searchUrl}`);

      await this.safeGotoWithRetry(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 12000,
      });

      // Add random delay after main search page load
      await this.randomDelay(config.scraping.delayMin, config.scraping.delayMax);

      await this.ensurePriceFiltersInUrl(options);

      // CAPTCHA check juste après l'arrivée sur la page de recherche.
      if (await this.detectCaptcha()) {
        const debugInfo = await this.saveDebugInfo('captcha');
        logger.warn(`⏳ CAPTCHA détecté ! Tu as ${waitForCaptcha} secondes pour le résoudre manuellement...`);
        logger.warn(`   Screenshots sauvegardés : ${debugInfo?.screenshotPath}`);
        logger.warn(`   Le script attend... résous le CAPTCHA dans le navigateur ouvert.`);

        await new Promise(resolve => setTimeout(resolve, waitForCaptcha * 1000));

        if (await this.detectCaptcha()) {
          logger.error('❌ CAPTCHA toujours présent après attente');
          throw new Error(`CAPTCHA not resolved after ${waitForCaptcha}s. Debug info: ${JSON.stringify(debugInfo)}`);
        }

        logger.info('✅ CAPTCHA résolu ! Sauvegarde des cookies...');
        await this.saveCookiesAfterCaptcha();
      }

      // Attente plus rapide et plus robuste.
      const selectorFound = await waitForAnySelector(
        this.page,
        [
          'a[href*="/items/"]',
          'article.feed-grid__item',
          'div.feed-grid__item',
          'article[data-testid*="item"]',
          '.new-item-box',
          '.feed-grid a',
        ],
        1400
      );

      if (!selectorFound) {
        logger.warn('No listings found or page structure changed');
        await this.saveDebugInfo('no_results');
        return attachPrefilterMetadata([], {
          prefilter_summary: {
            total: 0,
            selected: 0,
            already_seen: 0,
            duplicate: 0,
            invalid_url: 0,
            promoted_listing: 0,
            listing_type_mismatch: 0,
            foreign_language: 0,
            non_pokemon_domain: 0,
            off_target_modern: 0,
            series_mismatch: 0,
          },
          grid_raw_found: 0,
          selected_for_details: 0,
          selected_external_ids: [],
        });
      }

      logger.info(`✅ Found elements with selector: ${selectorFound}`);

      // Extraction plus rapide : scroll plus nerveux, moins d'attente par passe.
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
          for (let depth = 0; depth < 3 && node; depth++) {
            chunks.push(node.textContent);
            chunks.push(node.getAttribute?.('aria-label'));
            chunks.push(node.getAttribute?.('title'));
            chunks.push(node.querySelector?.('img')?.getAttribute('alt'));
            node = node.parentElement;
          }

          return [...new Set(
            chunks
              .filter(Boolean)
              .map(value => value.trim())
              .filter(Boolean)
          )].join(' ').trim();
        };

        const collectItems = () => {
          let items = Array.from(document.querySelectorAll('a[href*="/items/"]'));

          if (items.length === 0) {
            items = Array.from(document.querySelectorAll('.feed-grid a, [class*="feed"] a'));
          }

          for (const anchor of items) {
            const url = anchor.href;
            if (!url || !url.includes('/items/') || byUrl.has(url)) continue;

            const container = anchor.closest(
              'article, div.feed-grid__item, [class*="feed-grid__item"], [data-testid*="item"], li'
            );

            const text = `${collectNodeText(anchor)} ${container?.textContent || ''}`.trim();
            byUrl.set(url, { url, text });
          }
        };

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        let stagnantPasses = 0;

        for (let pass = 0; pass < maxPasses && byUrl.size < limit; pass++) {
          const before = byUrl.size;
          collectItems();
          const after = byUrl.size;

          if (after === before) stagnantPasses += 1;
          else stagnantPasses = 0;

          if (stagnantPasses >= 2) break;

          window.scrollBy(0, Math.round(window.innerHeight * 1.25));
          await sleep(120 + Math.floor(Math.random() * 100));
        }

        collectItems();

        return [...byUrl.values()].slice(0, limit);
      }, scanDepth, Math.max(3, Number(maxScrollPasses) || 8));

      const rescueSeenWhenBelow =
        allowSeenRescue && listingType === 'lot' && targetSeries !== 'all'
          ? Math.min(5, maxResults)
          : 0;

      const prefilterOptions = {
        excludeExternalIds,
        maxResults,
        targetSeries,
        listingType,
        query,
        rescueSeenWhenBelow,
      };

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

      logger.info(
        `Found ${searchItems.length} listing URLs on Vinted, ${selectedUrls.length} selected after already-seen + target-series prefilter`
      );
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

      const listings = [];

      for (const url of selectedUrls) {
        const selectedItem = selectedItemByUrl.get(url) || null;

        try {
          logger.debug(`Fetching listing: ${url}`);

          await this.safeGotoWithRetry(url, {
            waitUntil: 'domcontentloaded',
            timeout: 8000,
          });

          // Add random delay between requests to avoid rate limiting
          await this.randomDelay(config.scraping.delayMin, config.scraping.delayMax);

          // Petite attente optionnelle très courte pour laisser hydrater le DOM.
          await this.page.waitForSelector('h1, [data-testid="item-price"], [itemprop="description"], time', {
            timeout: 1200,
          }).catch(() => { });

          const listing = await this.page.evaluate((url) => {
            const urlMatch = url.match(/items\/(\d+)/);
            const externalId = urlMatch ? urlMatch[1] : null;

            const title =
              document.querySelector('h1[itemprop="name"]')?.textContent?.trim() ||
              document.querySelector('h1.details-list__item-title')?.textContent?.trim() ||
              document.querySelector('h1')?.textContent?.trim() ||
              'No title';

            const priceEl =
              document.querySelector('[data-testid="item-price"]') ||
              document.querySelector('.details-list__item-price') ||
              document.querySelector('[itemprop="price"]') ||
              document.querySelector('h3');

            const priceText = priceEl?.textContent?.trim() || '0';
            const price =
              parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

            const description =
              document.querySelector('[itemprop="description"]')?.textContent?.trim() ||
              document.querySelector('.details-list__item-description')?.textContent?.trim() ||
              '';

            const location =
              document.querySelector('.details-list__item-location')?.textContent?.trim() ||
              document.querySelector('[data-testid="item-location"]')?.textContent?.trim() ||
              '';

            const imageEl =
              document.querySelector('.details-list__item-photo img') ||
              document.querySelector('[itemprop="image"]') ||
              document.querySelector('img[alt*="photo"]') ||
              document.querySelector('img');

            const imageUrl =
              imageEl?.src ||
              imageEl?.getAttribute?.('src') ||
              imageEl?.getAttribute?.('data-src') ||
              null;

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
              score: null,
            };
          }, url);

          const isParsed = Boolean(listing && listing.title !== 'No title');
          const finalListing = isParsed
            ? listing
            : buildFallbackListing(url, selectedItem || {});

          listings.push(finalListing);

          if (isParsed) {
            logger.info(`✅ Parsed: ${finalListing.title} - ${finalListing.price}€`);
          } else {
            logger.warn(`⚠️ Failed to parse listing properly, using grid fallback: ${url}`);
          }
        } catch (error) {
          const fallbackListing = buildFallbackListing(url, selectedItem || {});
          listings.push(fallbackListing);
          logger.warn(`⚠️ Failed to fetch listing ${url}, using grid fallback: ${error.message}`);
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
      // Always cleanup resources (page/browser released to pool)
      await this.close();
    }
  }
}

/**
 * Convenience function
 *
 * Ici on ferme encore à la fin pour garder le même comportement si tu utilises
 * fetchVinted(query) ponctuellement.
 *
 * Si plus tard tu veux la perf max sur plusieurs requêtes d'affilée,
 * crée une instance de VintedFetcher et réutilise-la avant de faire close()
 * toi-même au shutdown.
 */
export async function fetchVinted(query, options = {}) {
  const fetcher = new VintedFetcher();
  try {
    return await fetcher.fetch(query, options);
  } finally {
    await fetcher.close();
  }
}