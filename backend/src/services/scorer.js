/**
 * Advanced scorer using profile configuration
 * Replaces scorer-simple.js with profile-based scoring
 */

import { enrichListing, detectOpportunitySignals } from './signal-detector.js';
import { estimateValue } from './value-estimator.js';

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Score a listing based on profile criteria
 * @param {Object} listing - Normalized listing
 * @param {Object} profile - Profile configuration
 * @returns {Object} { score, breakdown }
 */
export function scoreListing(listing, profile) {
  const breakdown = {
    keywords: 0,
    price: 0,
    distance: 0,
    is_lot: 0
  };
  
  const weights = profile.scoring.weights;
  
  // 1. Keywords score (40% par défaut)
  const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
  
  // Positive keywords
  let positiveMatches = 0;
  profile.scoring.keywords_positive.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      positiveMatches++;
    }
  });
  
  // Negative keywords (penalties)
  let negativeMatches = 0;
  profile.scoring.keywords_negative.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      negativeMatches++;
    }
  });
  
  // Keywords score: 0-100 based on positive/negative ratio
  const maxPositive = Math.min(profile.scoring.keywords_positive.length, 10);
  breakdown.keywords = Math.max(0, Math.min(100, 
    (positiveMatches / maxPositive) * 100 - (negativeMatches * 20)
  ));
  
  // 2. Price score (30% par défaut)
  const price = listing.price || 0;
  const budget = profile.filters.budget;
  
  if (price < budget.min || price > budget.max) {
    breakdown.price = 0; // Out of budget
  } else if (price <= budget.preferred_max) {
    breakdown.price = 100; // Within preferred range
  } else {
    // Linear decay from preferred_max to max
    const range = budget.max - budget.preferred_max;
    const distance = price - budget.preferred_max;
    breakdown.price = Math.max(0, 100 - (distance / range) * 100);
  }
  
  // 3. Distance score (20% par défaut)
  if (listing.lat && listing.lon) {
    // Calculate distance to nearest location
    let minDistance = Infinity;
    profile.search.locations.forEach(loc => {
      const dist = calculateDistance(listing.lat, listing.lon, loc.lat, loc.lon);
      minDistance = Math.min(minDistance, dist);
    });
    
    const maxDist = profile.filters.distance.max_km;
    const preferredDist = profile.filters.distance.preferred_km || maxDist / 2;
    
    if (minDistance <= preferredDist) {
      breakdown.distance = 100;
    } else if (minDistance <= maxDist) {
      // Linear decay
      const range = maxDist - preferredDist;
      const excess = minDistance - preferredDist;
      breakdown.distance = Math.max(0, 100 - (excess / range) * 100);
    } else {
      breakdown.distance = 0;
    }
  } else {
    // No location data, use neutral score
    breakdown.distance = 50;
  }
  
  // 4. Is lot score (10% par défaut)
  let lotMatches = 0;
  profile.scoring.lot_indicators.forEach(indicator => {
    if (text.includes(indicator.toLowerCase())) {
      lotMatches++;
    }
  });
  breakdown.is_lot = Math.min(100, (lotMatches / 3) * 100);
  
  // Calculate weighted total score
  const totalScore = 
    breakdown.keywords * weights.keywords +
    breakdown.price * weights.price +
    breakdown.distance * weights.distance +
    breakdown.is_lot * weights.is_lot;
  
  return {
    score: Math.round(totalScore * 10) / 10,
    breakdown: {
      keywords: Math.round(breakdown.keywords * 10) / 10,
      price: Math.round(breakdown.price * 10) / 10,
      distance: Math.round(breakdown.distance * 10) / 10,
      is_lot: Math.round(breakdown.is_lot * 10) / 10
    }
  };
}

/**
 * Score multiple listings and enrich with signals
 * @param {Array<Object>} listings - Array of listings
 * @param {Object} profile - Profile configuration
 * @returns {Array<Object>} Listings with scores, signals, badges, estimation, and explanation
 */
export function scoreListings(listings, profile) {
  return listings.map(listing => {
    const { score, breakdown } = scoreListing(listing, profile);
    const withScore = {
      ...listing,
      score,
      score_breakdown: breakdown
    };
    
    // Pre-detect opportunity signals for value estimation
    withScore.opportunity_signals = detectOpportunitySignals(withScore, profile);
    
    // Estimate value (uses opportunity_signals)
    const estimation = estimateValue(withScore);
    
    // Enrich with full signals, badges, and explanation (including estimation)
    return enrichListing(withScore, profile, estimation);
  }).sort((a, b) => b.score - a.score);
}

/**
 * Filter listings by profile criteria
 * @param {Array<Object>} listings - Array of listings
 * @param {Object} profile - Profile configuration
 * @returns {Array<Object>} Filtered listings
 */
export function filterListings(listings, profile) {
  return listings.filter(listing => {
    // Budget filter
    if (listing.price < profile.filters.budget.min || 
        listing.price > profile.filters.budget.max) {
      return false;
    }
    
    // Distance filter (if location available)
    if (listing.lat && listing.lon) {
      let withinRange = false;
      profile.search.locations.forEach(loc => {
        const dist = calculateDistance(listing.lat, listing.lon, loc.lat, loc.lon);
        if (dist <= profile.filters.distance.max_km) {
          withinRange = true;
        }
      });
      if (!withinRange) return false;
    }
    
    // Min score filter (after scoring)
    const { score } = scoreListing(listing, profile);
    if (score < profile.filters.min_score) {
      return false;
    }
    
    return true;
  });
}
