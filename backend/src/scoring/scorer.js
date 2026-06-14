import { all } from '../db/database.js';
import { config } from '../utils/config.js';

/**
 * Score a listing based on multiple criteria
 * @param {Object} listing - Listing data with title, description, price, distance, etc.
 * @returns {number} Score between 0-100
 */
export function scoreListing(listing) {
  let score = 0;
  const text = `${listing.title} ${listing.description || ''}`.toLowerCase();
  
  // Load keywords from database
  const keywords = all('SELECT keyword FROM keywords WHERE priority >= 3');
  
  // 1. Wizards edition detection (0-40 points)
  const wizardsKeywords = keywords.filter(k => k.category === 'wizards' || k.category === 'edition');
  let wizardsScore = 0;
  wizardsKeywords.forEach(kw => {
    if (text.includes(kw.keyword.toLowerCase())) {
      wizardsScore += kw.weight * 10;
    }
  });
  score += Math.min(wizardsScore, 40);
  listing.is_wizards = wizardsScore > 15 ? 1 : 0;
  
  // 2. French language (0-20 points)
  const frenchKeywords = keywords.filter(k => k.category === 'language' && k.weight > 0);
  let frenchScore = 0;
  frenchKeywords.forEach(kw => {
    if (text.includes(kw.keyword.toLowerCase())) {
      frenchScore += kw.weight * 5;
    }
  });
  score += Math.min(frenchScore, 20);
  listing.is_french = frenchScore > 5 ? 1 : 0;
  
  // 3. Lot detection (0-15 points)
  const lotIndicators = ['lot', 'collection', 'cartes', 'cards'];
  let lotScore = 0;
  lotIndicators.forEach(word => {
    if (text.includes(word)) lotScore += 4;
  });
  score += Math.min(lotScore, 15);
  listing.is_lot = lotScore >= 4 ? 1 : 0;
  
  // 4. Price ratio (0-15 points)
  if (listing.price && listing.card_count_estimate) {
    const pricePerCard = listing.price / listing.card_count_estimate;
    if (pricePerCard < 0.5) score += 15;
    else if (pricePerCard < 1) score += 10;
    else if (pricePerCard < 2) score += 5;
  } else if (listing.price && listing.price <= config.scoring.maxBudget) {
    score += 10;
  }
  
  // 5. Distance (0-10 points)
  if (listing.distance_km !== null && listing.distance_km !== undefined) {
    const distanceScore = Math.max(0, 10 - (listing.distance_km / config.scoring.maxDistanceKm) * 10);
    score += distanceScore;
  }
  
  // 6. Apply negative keywords
  const negativeKeywords = keywords.filter(k => k.category === 'negative');
  negativeKeywords.forEach(kw => {
    if (text.includes(kw.keyword.toLowerCase())) {
      score += kw.weight * 10; // weight is negative
    }
  });
  
  // Clamp score between 0-100
  score = Math.max(0, Math.min(100, score));
  
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate card count from title/description
 */
export function estimateCardCount(text) {
  if (!text) return null;
  
  // Look for explicit numbers followed by "cartes", "cards", etc.
  const matches = text.match(/(\d+)\s*(cartes|cards)/i);
  if (matches) {
    return parseInt(matches[1]);
  }
  
  // Heuristics based on keywords
  const lower = text.toLowerCase();
  if (lower.includes('gros lot') || lower.includes('collection')) return 200;
  if (lower.includes('lot')) return 100;
  if (lower.includes('quelques')) return 20;
  
  return null;
}
