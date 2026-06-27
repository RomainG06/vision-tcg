import crypto from 'crypto';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { priceInfoCacheRepository } from '../repositories/price-info-cache-repository.js';
import { detectListingCondition } from './card-condition.js';

export class CardmarketConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CardmarketConfigError';
    this.code = 'cardmarket_config_missing';
  }
}

let cardmarketMissingCredentialsWarned = false;

function rfc3986Encode(value) {
  return encodeURIComponent(String(value))
    .replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCachePart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

const POKEMON_ALIASES = [
  { canonical: 'jolteon', names: ['jolteon', 'voltali'] },
  { canonical: 'vaporeon', names: ['vaporeon', 'aquali'] },
  { canonical: 'flareon', names: ['flareon', 'pyroli'] },
  { canonical: 'kabuto', names: ['kabuto'] },
  { canonical: 'gastly', names: ['gastly', 'fantominus'] },
  { canonical: 'haunter', names: ['haunter', 'spectrum'] },
  { canonical: 'gengar', names: ['gengar', 'ectoplasma'] },
  { canonical: 'dragonite', names: ['dragonite', 'dracolosse'] },
  { canonical: 'charizard', names: ['charizard', 'dracaufeu', 'dracofeu'] },
  { canonical: 'blastoise', names: ['blastoise', 'tortank'] },
  { canonical: 'venusaur', names: ['venusaur', 'florizarre'] },
  { canonical: 'snorlax', names: ['snorlax', 'ronflex'] },
  { canonical: 'raichu', names: ['raichu'] },
  { canonical: 'alakazam', names: ['alakazam'] },
  { canonical: 'scyther', names: ['scyther', 'insecateur', 'insécateur'] },
  { canonical: 'pinsir', names: ['pinsir', 'scarabrute'] },
  { canonical: 'kangaskhan', names: ['kangaskhan', 'kangourex'] },
  { canonical: 'mr-mime', names: ['mr mime', 'm mime', 'm. mime', 'mr-mime'] },
];

function detectCanonicalCardName(value) {
  const text = normalizeText(value);
  for (const alias of POKEMON_ALIASES) {
    if (alias.names.some(name => new RegExp(`(^|\\s)${normalizeText(name).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s|$)`).test(text))) {
      return alias.canonical;
    }
  }
  return null;
}

function titleCaseCanonicalName(canonicalName) {
  if (!canonicalName) return null;
  return canonicalName
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseCollectorNumber(normalizedText) {
  const slashMatch = normalizedText.match(/\b(\d{1,3})\s*\/\s*(\d{2,3})\b/);
  if (slashMatch) {
    return {
      number: `${slashMatch[1]}/${slashMatch[2]}`,
      numberPrefix: slashMatch[1],
    };
  }

  const knownSetSize = normalizedText.match(/\b(?:jungle|fossil(?:e)?|team\s+rocket|rocket|base\s+set|set\s+de\s+base)\b.*?\b(?:no\s*)?(\d{1,3})\b|\b(?:no\s*)?(\d{1,3})\b.*?\b(?:jungle|fossil(?:e)?|team\s+rocket|rocket|base\s+set|set\s+de\s+base)\b/);
  if (knownSetSize) {
    const number = knownSetSize[1] || knownSetSize[2];
    return { number, numberPrefix: number };
  }

  return { number: null, numberPrefix: null };
}

function parseGrading(value) {
  const text = normalizeText(value);
  const graderMatch = text.match(/\b(psa|pca|cgg|bgs|sgc)\s*(\d{1,2}(?:\.5)?)(?:\s*\/\s*10)?\b/);
  if (!graderMatch) return null;
  return {
    company: graderMatch[1].toUpperCase(),
    grade: graderMatch[2],
  };
}

function parseEdition(value) {
  const text = normalizeText(value);
  if (/\b(1ed|1st|1ere|1ere\s+edition|1st\s+edition|edition\s+1)\b/.test(text)) return '1ed';
  return null;
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function roundEuro(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function getCredentials(options = {}) {
  const credentials = {
    consumerKey: options.consumerKey || config.cardmarket.consumerKey,
    consumerSecret: options.consumerSecret || config.cardmarket.consumerSecret,
    accessToken: options.accessToken || config.cardmarket.accessToken,
    accessTokenSecret: options.accessTokenSecret || config.cardmarket.accessTokenSecret,
  };

  if (!credentials.consumerKey || !credentials.consumerSecret || !credentials.accessToken || !credentials.accessTokenSecret) {
    throw new CardmarketConfigError('Missing Cardmarket API credentials. Set CARDMARKET_CONSUMER_KEY, CARDMARKET_CONSUMER_SECRET, CARDMARKET_ACCESS_TOKEN and CARDMARKET_ACCESS_TOKEN_SECRET in backend/.env.');
  }

  return credentials;
}

export function buildCardmarketUrl(pathname, params = {}, options = {}) {
  const baseUrl = String(options.baseUrl || config.cardmarket.baseUrl).replace(/\/+$/, '');
  const url = new URL(`${baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function buildCardmarketOAuthHeader(method, urlString, options = {}) {
  const credentials = getCredentials(options);
  const url = new URL(urlString);
  const oauthParams = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_token: credentials.accessToken,
    oauth_nonce: options.nonce || crypto.randomBytes(16).toString('hex'),
    oauth_timestamp: String(options.timestamp || Math.floor(Date.now() / 1000)),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  };

  const signatureParams = [];
  for (const [key, value] of url.searchParams.entries()) {
    signatureParams.push([key, value]);
  }
  for (const [key, value] of Object.entries(oauthParams)) {
    signatureParams.push([key, value]);
  }
  signatureParams.sort(([aKey, aValue], [bKey, bValue]) => {
    if (aKey === bKey) return String(aValue).localeCompare(String(bValue));
    return String(aKey).localeCompare(String(bKey));
  });

  const normalizedParams = signatureParams
    .map(([key, value]) => `${rfc3986Encode(key)}=${rfc3986Encode(value)}`)
    .join('&');
  const baseUrl = `${url.origin}${url.pathname}`;
  const signatureBase = [method.toUpperCase(), rfc3986Encode(baseUrl), rfc3986Encode(normalizedParams)].join('&');
  const signingKey = `${rfc3986Encode(credentials.consumerSecret)}&${rfc3986Encode(credentials.accessTokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  const headerParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return `OAuth ${Object.entries(headerParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${rfc3986Encode(key)}="${rfc3986Encode(value)}"`)
    .join(', ')}`;
}

async function cardmarketGet(pathname, params = {}, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('Fetch API unavailable in this Node runtime');

  const url = buildCardmarketUrl(pathname, params, options);
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: buildCardmarketOAuthHeader('GET', url, options),
    },
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message = json?.error || json?.message || json?.errors?.[0]?.message || text.slice(0, 200) || `HTTP ${response.status}`;
    throw new Error(`Cardmarket API failed (${response.status}): ${message}`);
  }

  return json;
}

function extractProducts(payload) {
  if (Array.isArray(payload?.product)) return payload.product;
  if (payload?.product) return [payload.product];
  if (Array.isArray(payload?.products)) return payload.products;
  return [];
}

export function extractCardmarketHints(listing = {}) {
  const text = `${listing.title || ''} ${listing.description || ''}`;
  const normalized = normalizeText(text);
  const collector = parseCollectorNumber(normalized);
  const expansions = [
    { key: 'fossil', label: 'Fossil', pattern: /\bfossil(?:e)?\b/ },
    { key: 'jungle', label: 'Jungle', pattern: /\bjungle\b/ },
    { key: 'base', label: 'Base Set', pattern: /\b(base\s+set|set\s+de\s+base)\b/ },
    { key: 'team_rocket', label: 'Team Rocket', pattern: /\b(team\s+rocket|rocket)\b/ },
  ];
  const expansion = expansions.find(item => item.pattern.test(normalized)) || null;
  const edition = parseEdition(text);
  const canonicalCardName = detectCanonicalCardName(text);

  return {
    card_name_key: canonicalCardName,
    card_name_label: titleCaseCanonicalName(canonicalCardName),
    number: collector.number,
    numberPrefix: collector.numberPrefix,
    expansion_key: expansion?.key || null,
    expansion_label: expansion?.label || null,
    edition,
    first_edition: edition === '1ed',
    grading: parseGrading(text),
    condition: detectListingCondition(listing),
  };
}

export function buildCardmarketSearchQuery(listing = {}) {
  const hints = extractCardmarketHints(listing);
  if (hints.card_name_label) return hints.card_name_label;

  const title = String(listing.title || '').replace(/\b\d{1,3}\s*\/\s*\d{2,3}\b/g, ' ');
  const cleaned = title
    .replace(/\b(pokemon|pokémon|carte|cards?|cartes?|wizards?|wizard|fossil(?:e)?|jungle|team\s+rocket|rocket|base\s+set|set\s+de\s+base)\b/gi, ' ')
    .replace(/\b(1ed|1st|1ere|edition\s+1|edition\s+2|fr|vf|jp|japan|japon|near\s+mint|nm|excellent|exc|played|lp|mint|neuf|holo|reverse|pca|psa|cgg|bgs|sgc|annee|année|19\d{2}|20\d{2})\b/gi, ' ')
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || String(listing.title || '').trim();
}

export function buildCardmarketCacheKey(listing = {}) {
  const hints = extractCardmarketHints(listing);
  const query = hints.card_name_key || buildCardmarketSearchQuery(listing);
  return [
    normalizeCachePart(query),
    normalizeCachePart(hints.number || ''),
    normalizeCachePart(hints.expansion_key || ''),
    hints.edition || '',
    hints.grading ? `${normalizeCachePart(hints.grading.company)}-${normalizeCachePart(hints.grading.grade)}` : '',
  ].filter(Boolean).join('|');
}

export async function findCardmarketProducts(query, options = {}) {
  const payload = await cardmarketGet('/products/find', {
    search: query,
    idGame: options.gameId || config.cardmarket.gameId,
    idLanguage: options.languageId || config.cardmarket.languageId,
    maxResults: options.maxResults || config.cardmarket.maxResults,
  }, options);
  return extractProducts(payload);
}

export async function getCardmarketProduct(idProduct, options = {}) {
  const payload = await cardmarketGet(`/products/${idProduct}`, {}, options);
  return payload?.product || payload;
}

function productName(product) {
  const localized = Array.isArray(product?.localization)
    ? product.localization.map(item => item.productName).filter(Boolean).join(' ')
    : '';
  return `${product?.enName || ''} ${localized}`.trim();
}

export function selectBestCardmarketProduct(products = [], listing = {}) {
  const hints = extractCardmarketHints(listing);
  const query = normalizeText(buildCardmarketSearchQuery(listing));
  const queryTokens = query.split(' ').filter(token => token.length >= 3);

  let best = null;
  let bestScore = -Infinity;
  for (const product of products) {
    const name = normalizeText(productName(product));
    const expansion = normalizeText(product.expansionName || product.expansion?.enName || '');
    const number = normalizeText(product.number || '');
    let score = 0;

    for (const token of queryTokens) {
      if (name.includes(token)) score += 12;
    }
    if (hints.numberPrefix && number === normalizeText(hints.numberPrefix)) score += 35;
    if (hints.numberPrefix && number.includes(normalizeText(hints.numberPrefix))) score += 12;
    if (hints.expansion_label && expansion.includes(normalizeText(hints.expansion_label))) score += 30;
    if (/pokemon/i.test(product.gameName || '')) score += 10;
    if (product.idProduct) score += 1;

    if (score > bestScore) {
      best = product;
      bestScore = score;
    }
  }

  return best;
}

export function summarizeCardmarketProduct(product, listing = {}) {
  const priceGuide = product?.priceGuide || {};
  const hints = extractCardmarketHints(listing);
  const sell = parseNumber(priceGuide.SELL);
  const trend = parseNumber(priceGuide.TREND);
  const low = parseNumber(priceGuide.LOW);
  const lowEx = parseNumber(priceGuide.LOWEX ?? priceGuide['LOWEX+']);
  const avg = parseNumber(priceGuide.AVG);
  const conditionKey = hints.condition?.key || null;

  let lowRef = low || lowEx || sell || trend || avg;
  if (['mint', 'near_mint', 'excellent'].includes(conditionKey)) {
    lowRef = lowEx || low || sell || trend || avg;
  }
  if (['played', 'damaged', 'light_played'].includes(conditionKey)) {
    lowRef = low || sell || trend || avg;
  }

  const highCandidates = [trend, sell, avg, lowEx, low].filter(Number.isFinite);
  const highRef = highCandidates.length ? Math.max(...highCandidates) : null;
  const averageCandidates = [sell, trend, avg].filter(Number.isFinite);
  const average = averageCandidates.length
    ? Math.round((averageCandidates.reduce((sum, value) => sum + value, 0) / averageCandidates.length) * 100) / 100
    : null;

  if (!lowRef && !highRef && !average) {
    return {
      calibrated: false,
      reason: 'cardmarket_priceguide_missing',
      product_id: product?.idProduct || null,
    };
  }

  return {
    calibrated: true,
    method: 'cardmarket_priceguide',
    confidence: product?.idProduct && (sell || trend) ? 'medium' : 'low',
    product_id: product?.idProduct || null,
    product_name: productName(product),
    product_url: product?.website ? `https://www.cardmarket.com${product.website}` : null,
    expansion_name: product?.expansionName || product?.expansion?.enName || null,
    card_number: product?.number || hints.numberPrefix || null,
    condition_key: conditionKey,
    condition_label: hints.condition?.label || null,
    sell_price: sell,
    trend_price: trend,
    low_price: low,
    low_ex_price: lowEx,
    average_price: average,
    value_min: roundEuro(lowRef || average || highRef),
    value_max: roundEuro(Math.max(lowRef || 0, highRef || average || 0)),
    raw_priceguide: priceGuide,
  };
}

export function applyCardmarketEstimateToListing(listing, summary) {
  if (!summary?.calibrated) return listing;
  const price = parseNumber(listing.price) || 0;
  const estimatedMin = summary.value_min;
  const estimatedMax = summary.value_max;
  const gainMin = price > 0 && estimatedMin !== null ? Math.round(estimatedMin - price) : null;
  const gainMax = price > 0 && estimatedMax !== null ? Math.round(estimatedMax - price) : null;

  return {
    ...listing,
    score_breakdown: {
      ...(listing.score_breakdown || {}),
      estimated_value_min: estimatedMin,
      estimated_value_max: estimatedMax,
      estimate_method: summary.method,
      estimate_confidence: summary.confidence,
      estimate_reference_marketplace: 'cardmarket',
      estimate_average_price: summary.average_price,
      estimate_trend_price: summary.trend_price,
      estimate_sell_price: summary.sell_price,
      estimate_low_price: summary.low_price,
      estimate_low_ex_price: summary.low_ex_price,
      estimate_condition_key: summary.condition_key,
      estimate_condition_label: summary.condition_label,
      estimate_cardmarket_product_id: summary.product_id,
      estimate_cardmarket_product_name: summary.product_name,
      estimate_cardmarket_product_url: summary.product_url,
      estimate_cardmarket_expansion: summary.expansion_name,
      card_condition_key: summary.condition_key,
      card_condition_label: summary.condition_label,
      estimated_gain_min: gainMin,
      estimated_gain_max: gainMax,
    },
  };
}

export async function enrichListingWithCardmarketPrice(listing, options = {}) {
  if (!config.cardmarket.enabled || options.enabled === false) return listing;

  const cacheRepo = options.cacheRepo === false ? null : (options.cacheRepo || priceInfoCacheRepository);
  const cacheTtlHours = options.cacheTtlHours || config.priceInfo.cacheTtlHours || 48;
  const cacheKey = buildCardmarketCacheKey(listing);
  const hints = extractCardmarketHints(listing);

  if (!cacheKey) return listing;
  if (hints.grading) {
    logger.info(`[price-info] Cardmarket skipped graded card ${hints.grading.company} ${hints.grading.grade} cache_key="${cacheKey}"`);
    return listing;
  }

  try {
    const cached = cacheRepo?.get?.('cardmarket', cacheKey);
    if (cached?.payload?.summary) {
      logger.info(`[price-info] Cardmarket cache hit cache_key="${cacheKey}" product="${cached.payload.summary.product_name || cached.payload.summary.product_id || 'unknown'}"`);
      return applyCardmarketEstimateToListing(listing, {
        ...cached.payload.summary,
        from_cache: true,
      });
    }

    const query = buildCardmarketSearchQuery(listing);
    logger.info(`[price-info] Cardmarket priceguide search query="${query}" cache_key="${cacheKey}"`);
    const products = await findCardmarketProducts(query, options);
    const bestProduct = selectBestCardmarketProduct(products, listing);
    if (!bestProduct?.idProduct) {
      logger.info(`[price-info] Cardmarket no product match query="${query}" cache_key="${cacheKey}" candidates=${products.length}`);
      return listing;
    }

    const product = await getCardmarketProduct(bestProduct.idProduct, options);
    const summary = summarizeCardmarketProduct(product, listing);
    if (!summary.calibrated) {
      logger.info(`[price-info] Cardmarket product has no usable priceguide product_id=${bestProduct.idProduct} cache_key="${cacheKey}"`);
      return listing;
    }

    cacheRepo?.set?.('cardmarket', cacheKey, { summary }, cacheTtlHours);
    logger.info(`[price-info] Cardmarket calibrated product="${summary.product_name || summary.product_id}" cache_key="${cacheKey}" range=${summary.value_min}-${summary.value_max} trend=${summary.trend_price ?? 'n/a'} sell=${summary.sell_price ?? 'n/a'}`);
    return applyCardmarketEstimateToListing(listing, summary);
  } catch (error) {
    if (error instanceof CardmarketConfigError || error.code === 'cardmarket_config_missing') {
      if (!cardmarketMissingCredentialsWarned) {
        logger.warn('[price-info] Cardmarket credentials missing; skipping Cardmarket price calibration.');
        cardmarketMissingCredentialsWarned = true;
      }
    } else {
      logger.warn(`[price-info] Cardmarket estimate unavailable: ${error.message}`);
    }
    return listing;
  }
}
