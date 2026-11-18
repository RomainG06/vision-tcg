import { config } from '../utils/config.js';

const EBAY_ENDPOINTS = {
  production: 'https://api.ebay.com',
  sandbox: 'https://api.sandbox.ebay.com',
};

let tokenCache = null;

export class EbayConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EbayConfigError';
    this.code = 'ebay_config_missing';
  }
}

export function getEbayApiBaseUrl(env = config.ebay.env) {
  return EBAY_ENDPOINTS[String(env || 'production').toLowerCase()] || EBAY_ENDPOINTS.production;
}

export function buildEbayTokenRequest(options = {}) {
  const clientId = options.clientId ?? config.ebay.clientId;
  const clientSecret = options.clientSecret ?? config.ebay.clientSecret;
  const scope = options.scope ?? config.ebay.scope;

  if (!clientId || !clientSecret) {
    throw new EbayConfigError('Missing eBay API credentials. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in backend/.env.');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope,
  });

  return {
    url: `${getEbayApiBaseUrl(options.env)}/identity/v1/oauth2/token`,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
  };
}

export function clearEbayTokenCache() {
  tokenCache = null;
}

export async function getEbayAccessToken(options = {}) {
  const now = Date.now();
  if (!options.forceRefresh && tokenCache?.accessToken && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch API unavailable in this Node runtime');
  }

  const request = buildEbayTokenRequest(options);
  const response = await fetchImpl(request.url, request.init);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok || !json?.access_token) {
    const message = json?.error_description || json?.error || text.slice(0, 180) || `HTTP ${response.status}`;
    throw new EbayConfigError(`eBay OAuth token request failed: ${message}`);
  }

  const expiresIn = Number(json.expires_in || 7200);
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + Math.max(60, expiresIn - 60) * 1000,
  };

  return tokenCache.accessToken;
}
