import { BaseFetcher } from './base.js';
import { logger } from '../utils/logger.js';

/**
 * Vinted fetcher - Placeholder for MVP
 * To be implemented with proper selectors
 */
export class VintedFetcher extends BaseFetcher {
  constructor() {
    super('vinted');
    this.baseUrl = 'https://www.vinted.fr';
  }
  
  async fetch(query, options = {}) {
    logger.warn('Vinted fetcher not yet implemented');
    // TODO: Implement Vinted scraping logic
    return [];
  }
}

export async function fetchVinted(query, options = {}) {
  const fetcher = new VintedFetcher();
  return await fetcher.fetch(query, options);
}
