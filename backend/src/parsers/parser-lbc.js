import { JSDOM } from 'jsdom';
import { estimateCardCount, calculateDistance } from '../scoring/scorer.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

/**
 * Parse Leboncoin listing HTML
 * @param {string} html - Raw HTML content
 * @param {string} url - Listing URL
 * @returns {Object} Parsed listing data matching the contract
 */
export async function parseLeboncoinListing(html, url) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Extract external ID from URL
    const externalId = url.match(/\/(\d+)\.htm/)?.[1] || url.split('/').pop();
    
    // Title
    const title = doc.querySelector('h1[data-qa-id="adview_title"]')?.textContent?.trim() || 
                 doc.querySelector('h1')?.textContent?.trim() || '';
    
    // Description
    const description = doc.querySelector('[data-qa-id="adview_description_container"]')?.textContent?.trim() || 
                       doc.querySelector('[class*="description"]')?.textContent?.trim() || '';
    
    // Price
    const priceText = doc.querySelector('[data-qa-id="adview_price"]')?.textContent?.trim() || 
                     doc.querySelector('[class*="price"]')?.textContent?.trim() || '';
    const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || null;
    
    // Location
    const location = doc.querySelector('[data-qa-id="adview_location_informations"]')?.textContent?.trim() ||
                    doc.querySelector('[class*="location"]')?.textContent?.trim() || '';
    
    // Image URL
    const imageUrl = doc.querySelector('[data-qa-id="slideshow"] img')?.src || 
                    doc.querySelector('img[class*="gallery"]')?.src || 
                    null;
    
    // Posted date
    const postedText = doc.querySelector('[data-qa-id="adview_date"]')?.textContent?.trim() || '';
    let postedAt = null;
    if (postedText.includes('Aujourd\'hui')) {
      postedAt = new Date().toISOString();
    } else if (postedText.includes('Hier')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      postedAt = yesterday.toISOString();
    }
    
    // Estimate coordinates (simplified - in production use geocoding API)
    // For MVP, we'll use approximate Nice coordinates
    const lat = config.geo.centerLat + (Math.random() - 0.5) * 0.1;
    const lon = config.geo.centerLon + (Math.random() - 0.5) * 0.1;
    
    // Calculate distance
    const distance = calculateDistance(
      config.geo.centerLat,
      config.geo.centerLon,
      lat,
      lon
    );
    
    // Estimate card count
    const cardCount = estimateCardCount(`${title} ${description}`);
    
    const listing = {
      source: 'leboncoin',
      external_id: externalId,
      url,
      title,
      description,
      price,
      location,
      lat,
      lon,
      distance_km: Math.round(distance * 10) / 10,
      image_url: imageUrl,
      posted_at: postedAt,
      card_count_estimate: cardCount
    };
    
    logger.debug(`Parsed Leboncoin listing: ${title}`);
    
    return listing;
  } catch (error) {
    logger.error('Error parsing Leboncoin listing:', error);
    return null;
  }
}
