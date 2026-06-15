import { describe, test, expect } from '@jest/globals';
import { scoreListing, scoreListings, filterListings } from '../src/services/scorer.js';

const mockProfile = {
  search: {
    locations: [
      { name: 'Nice', lat: 43.7102, lon: 7.2620, radius_km: 50 }
    ]
  },
  filters: {
    budget: { min: 10, max: 1500, preferred_max: 300 },
    distance: { max_km: 50, preferred_km: 20 },
    min_score: 50
  },
  scoring: {
    weights: {
      keywords: 0.4,
      price: 0.3,
      distance: 0.2,
      is_lot: 0.1
    },
    keywords_positive: [
      'wizards',
      'français',
      'edition 1',
      'holographique',
      'dracaufeu'
    ],
    keywords_negative: [
      'abimé',
      'fake',
      'moderne'
    ],
    lot_indicators: [
      'lot',
      'cartes',
      'collection'
    ]
  }
};

describe('Scorer', () => {
  test('should score listing with high keywords match', () => {
    const listing = {
      title: 'Lot cartes Pokemon Wizards français edition 1 holographique Dracaufeu',
      description: 'Belle collection de cartes',
      price: 150,
      lat: 43.71,
      lon: 7.26
    };
    
    const { score, breakdown } = scoreListing(listing, mockProfile);
    
    expect(score).toBeGreaterThan(70);
    expect(breakdown.keywords).toBeGreaterThan(50);
    expect(breakdown.price).toBe(100); // Within preferred range
    expect(breakdown.distance).toBe(100); // Very close
  });
  
  test('should penalize negative keywords', () => {
    const listing = {
      title: 'Pokemon cartes fake abimé moderne',
      description: 'Mauvais état',
      price: 150,
      lat: 43.71,
      lon: 7.26
    };
    
    const { score, breakdown } = scoreListing(listing, mockProfile);
    
    expect(breakdown.keywords).toBeLessThan(20); // Heavy penalty
  });
  
  test('should score price correctly within preferred range', () => {
    const listing = {
      title: 'Pokemon',
      price: 200, // Within preferred_max (300)
      lat: 43.71,
      lon: 7.26
    };
    
    const { breakdown } = scoreListing(listing, mockProfile);
    
    expect(breakdown.price).toBe(100);
  });
  
  test('should score price correctly above preferred range', () => {
    const listing = {
      title: 'Pokemon',
      price: 900, // Between preferred_max (300) and max (1500)
      lat: 43.71,
      lon: 7.26
    };
    
    const { breakdown } = scoreListing(listing, mockProfile);
    
    expect(breakdown.price).toBeGreaterThan(0);
    expect(breakdown.price).toBeLessThan(100);
  });
  
  test('should score price 0 when out of budget', () => {
    const listing = {
      title: 'Pokemon',
      price: 2000, // Above max (1500)
      lat: 43.71,
      lon: 7.26
    };
    
    const { breakdown } = scoreListing(listing, mockProfile);
    
    expect(breakdown.price).toBe(0);
  });
  
  test('should score distance correctly', () => {
    const listing = {
      title: 'Pokemon',
      price: 150,
      lat: 43.72, // ~1km from Nice
      lon: 7.27
    };
    
    const { breakdown } = scoreListing(listing, mockProfile);
    
    expect(breakdown.distance).toBeGreaterThan(90);
  });
  
  test('should handle missing location with neutral score', () => {
    const listing = {
      title: 'Pokemon',
      price: 150,
      lat: null,
      lon: null
    };
    
    const { breakdown } = scoreListing(listing, mockProfile);
    
    expect(breakdown.distance).toBe(50); // Neutral score
  });
  
  test('should score is_lot based on indicators', () => {
    const listing = {
      title: 'Lot de cartes Pokemon collection complete',
      description: 'Plusieurs cartes',
      price: 150,
      lat: 43.71,
      lon: 7.26
    };
    
    const { breakdown } = scoreListing(listing, mockProfile);
    
    expect(breakdown.is_lot).toBeGreaterThan(50);
  });
  
  test('should score multiple listings', () => {
    const listings = [
      {
        title: 'Pokemon Wizards français',
        price: 150,
        lat: 43.71,
        lon: 7.26
      },
      {
        title: 'Pokemon moderne',
        price: 50,
        lat: 43.71,
        lon: 7.26
      }
    ];
    
    const scored = scoreListings(listings, mockProfile);
    
    expect(scored.length).toBe(2);
    expect(scored[0].score).toBeDefined();
    expect(scored[1].score).toBeDefined();
    expect(scored[0].score_breakdown).toBeDefined();
  });
  
  test('should filter listings by budget', () => {
    const listings = [
      { title: 'Pokemon', price: 5, lat: 43.71, lon: 7.26 }, // Too cheap
      { title: 'Pokemon', price: 150, lat: 43.71, lon: 7.26 }, // OK
      { title: 'Pokemon', price: 2000, lat: 43.71, lon: 7.26 } // Too expensive
    ];
    
    const filtered = filterListings(listings, mockProfile);
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].price).toBe(150);
  });
  
  test('should filter listings by distance', () => {
    const listings = [
      { title: 'Pokemon', price: 150, lat: 43.71, lon: 7.26 }, // Close
      { title: 'Pokemon', price: 150, lat: 45.0, lon: 9.0 } // Too far (~350km)
    ];
    
    const filtered = filterListings(listings, mockProfile);
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].lat).toBe(43.71);
  });
  
  test('should filter listings by min score', () => {
    // Use a higher min_score for this test
    const testProfile = {
      ...mockProfile,
      filters: {
        ...mockProfile.filters,
        min_score: 60 // Higher threshold
      }
    };
    
    const highScoreListing = {
      title: 'Pokemon Wizards français edition 1 holographique Dracaufeu lot cartes collection',
      price: 150,
      lat: 43.71,
      lon: 7.26
    };
    
    const lowScoreListing = {
      title: 'Random stuff',
      price: 150,
      lat: 43.71,
      lon: 7.26
    };
    
    // Verify scores
    const highResult = scoreListing(highScoreListing, testProfile);
    const lowResult = scoreListing(lowScoreListing, testProfile);
    
    expect(highResult.score).toBeGreaterThanOrEqual(60);
    expect(lowResult.score).toBeLessThan(60);
    
    // Now test filtering
    const listings = [highScoreListing, lowScoreListing];
    const filtered = filterListings(listings, testProfile);
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toContain('Pokemon');
  });
});
