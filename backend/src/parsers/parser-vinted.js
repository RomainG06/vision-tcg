import { JSDOM } from 'jsdom';
import { logger } from '../utils/logger.js';

/**
 * Parse a Vinted listing page
 * @param {string} html - HTML content
 * @param {string} url - Listing URL
 * @returns {Object|null} Parsed listing
 */
export async function parseVintedListing(html, url) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Extract external ID from URL
    const urlMatch = url.match(/items\/(\d+)/);
    const externalId = urlMatch ? urlMatch[1] : null;
    
    // Title
    const titleEl = doc.querySelector('h1[itemprop="name"]') || doc.querySelector('.details-list__item-title');
    const title = titleEl?.textContent?.trim() || 'No title';
    
    // Price
    const priceEl = doc.querySelector('.details-list__item-price') || doc.querySelector('[itemprop="price"]');
    const priceText = priceEl?.textContent?.trim() || '0';
    const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    
    // Description
    const descEl = doc.querySelector('.details-list__item-description') || doc.querySelector('[itemprop="description"]');
    const description = descEl?.textContent?.trim() || '';
    
    // Location
    const locationEl = doc.querySelector('.details-list__item-location') || doc.querySelector('[itemprop="location"]');
    const location = locationEl?.textContent?.trim() || '';
    
    // Image
    const imageEl = doc.querySelector('.details-list__item-photo img') || doc.querySelector('[itemprop="image"]');
    const imageUrl = imageEl?.src || imageEl?.getAttribute('src') || null;
    
    // Posted date
    const dateEl = doc.querySelector('.details-list__item-date') || doc.querySelector('time');
    const postedAt = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || new Date().toISOString();
    
    // Build listing object
    const listing = {
      source: 'vinted',
      external_id: externalId,
      url,
      title,
      description,
      price,
      location,
      lat: null, // Vinted doesn't provide coordinates
      lon: null,
      distance_km: null, // Will be calculated if location found
      image_url: imageUrl,
      posted_at: postedAt,
      
      // These will be calculated by scorer
      is_wizards: false,
      is_french: false,
      is_lot: false,
      card_count_estimate: null,
      score: null
    };
    
    logger.debug(`Parsed Vinted listing: ${title} - ${price}€`);
    return listing;
    
  } catch (error) {
    logger.error(`Failed to parse Vinted listing ${url}:`, error.message);
    return null;
  }
}
