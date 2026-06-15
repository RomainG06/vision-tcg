import { config } from '../utils/config.js';

/**
 * Score a listing based on multiple criteria
 * @param {Object} listing - Listing data with title, description, price, distance, etc.
 * @returns {number} Score between 0-100
 */
export function scoreListing(listing) {
  let score = 0;
  const text = `${listing.title} ${listing.description || ''}`.toLowerCase();
  
  // 1. Wizards edition detection (0-40 points)
  const wizardsKeywords = ['wizards', 'wotc', 'base set', 'jungle', 'fossile', 'fossil', 'team rocket', 'gym'];
  let wizardsScore = 0;
  wizardsKeywords.forEach(kw => {
    if (text.includes(kw)) {
      wizardsScore += 10;
    }
  });
  score += Math.min(wizardsScore, config.scoring.wizardsWeight || 40);
  
  // 2. French language (0-20 points)
  const frenchKeywords = ['français', 'francais', 'fr', 'vf'];
  const englishKeywords = ['english', 'en', 'anglais'];
  let langScore = 0;
  
  frenchKeywords.forEach(kw => {
    if (text.includes(kw)) {
      langScore += 7;
    }
  });
  
  englishKeywords.forEach(kw => {
    if (text.includes(kw)) {
      langScore -= 5;
    }
  });
  
  score += Math.max(0, Math.min(langScore, config.scoring.frenchWeight || 20));
  
  // 3. Lot size (0-20 points)
  const lotKeywords = {
    'lot': 5,
    'collection': 10,
    'complet': 8,
    'complete': 8,
    'set': 6
  };
  
  let lotScore = 0;
  Object.entries(lotKeywords).forEach(([kw, points]) => {
    if (text.includes(kw)) {
      lotScore += points;
    }
  });
  
  // Extract quantity if present (e.g., "50 cartes", "100 cards")
  const quantityMatch = text.match(/(\d+)\s*(cartes?|cards?)/);
  if (quantityMatch) {
    const qty = parseInt(quantityMatch[1]);
    if (qty >= 50) lotScore += 10;
    else if (qty >= 20) lotScore += 5;
  }
  
  score += Math.min(lotScore, config.scoring.lotWeight || 20);
  
  // 4. Price score (0-10 points)
  const price = listing.price || 0;
  const maxBudget = config.geo?.maxBudget || 1500;
  
  let priceScore = 0;
  if (price > 0 && price <= maxBudget) {
    // Lower price is better
    if (price <= 50) priceScore = 10;
    else if (price <= 100) priceScore = 8;
    else if (price <= 300) priceScore = 5;
    else priceScore = 2;
  }
  
  score += priceScore;
  
  // 5. Distance score (0-10 points)
  const distance = listing.distance_km || 0;
  const maxDistance = config.geo?.maxDistanceKm || 50;
  
  let distanceScore = 0;
  if (distance > 0 && distance <= maxDistance) {
    // Closer is better
    if (distance <= 10) distanceScore = 10;
    else if (distance <= 25) distanceScore = 7;
    else if (distance <= 50) distanceScore = 4;
    else distanceScore = 1;
  }
  
  score += distanceScore;
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
}
