import { BaseFetcher } from './base.js';
import { logger } from '../utils/logger.js';

/**
 * Facebook Marketplace fetcher - Placeholder for MVP
 * Facebook scraping requires special handling (login, cookies, etc.)
 */
export class FacebookFetcher extends BaseFetcher {
  constructor() {
    super('facebook');
    this.baseUrl = 'https://www.facebook.com/marketplace';
  }
  
  async fetch(query, options = {}) {
    logger.warn('Facebook fetcher not yet implemented');
    // TODO: Implement Facebook Marketplace scraping logic
    // Requires authentication handling
    return [];
  }
}

export async function fetchFacebook(query, options = {}) {
  const fetcher = new FacebookFetcher();
  return await fetcher.fetch(query, options);
}
