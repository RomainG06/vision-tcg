/**
 * Tests for signal-detector service
 */

import { 
  detectOpportunitySignals,
  detectRiskSignals,
  generateExplanation,
  generateBadges,
  enrichListing
} from '../src/services/signal-detector.js';

describe('Signal Detector', () => {
  const mockProfile = {
    search: {
      keywords: ['pokemon', 'wizards']
    },
    scoring: {
      keywords_positive: ['wizards', 'français'],
      keywords_negative: ['japonais', 'abîmé']
    }
  };
  
  describe('detectOpportunitySignals', () => {
    test('should detect wizards_detected', () => {
      const listing = {
        title: 'Lot cartes Pokemon Wizards Base Set',
        description: 'Cartes en excellent état',
        price: 100
      };
      
      const signals = detectOpportunitySignals(listing, mockProfile);
      expect(signals).toContain('wizards_detected');
    });
    
    test('should detect french_edition', () => {
      const listing = {
        title: 'Cartes Pokemon français',
        description: 'Édition française',
        price: 50
      };
      
      const signals = detectOpportunitySignals(listing, mockProfile);
      expect(signals).toContain('french_edition');
    });
    
    test('should detect lot_detected', () => {
      const listing = {
        title: 'Lot Pokemon',
        description: '50 cartes',
        card_count: 50,
        price: 100
      };
      
      const signals = detectOpportunitySignals(listing, mockProfile);
      expect(signals).toContain('lot_detected');
    });
    
    test('should detect near_location', () => {
      const listing = {
        title: 'Cartes Pokemon',
        description: 'Bon état',
        distance_km: 5,
        price: 50
      };
      
      const signals = detectOpportunitySignals(listing, mockProfile);
      expect(signals).toContain('near_location');
    });
  });
  
  describe('detectRiskSignals', () => {
    test('should detect condition_unclear', () => {
      const listing = {
        title: 'Cartes Pokemon',
        description: 'Plusieurs cartes',
        price: 50
      };
      
      const signals = detectRiskSignals(listing);
      expect(signals).toContain('condition_unclear');
    });
    
    test('should detect incomplete_photos', () => {
      const listing = {
        title: 'Cartes Pokemon',
        description: 'État correct',
        images: 'img1.jpg',
        price: 50
      };
      
      const signals = detectRiskSignals(listing);
      expect(signals).toContain('incomplete_photos');
    });
    
    test('should detect suspicious_price', () => {
      const listing = {
        title: 'Lot 1000 cartes',
        description: 'État correct',
        card_count: 1000,
        price: 10
      };
      
      const signals = detectRiskSignals(listing);
      expect(signals).toContain('suspicious_price');
    });
  });
  
  describe('generateBadges', () => {
    test('should generate wizards badge', () => {
      const listing = {
        opportunity_signals: ['wizards_detected'],
        risk_signals: []
      };
      
      const badges = generateBadges(listing);
      expect(badges).toContain('🔥 WIZARDS');
    });
    
    test('should generate distance badge', () => {
      const listing = {
        opportunity_signals: [],
        risk_signals: [],
        distance_km: 3
      };
      
      const badges = generateBadges(listing);
      expect(badges.some(b => b.includes('KM'))).toBe(true);
    });
  });
  
  describe('generateExplanation', () => {
    test('should generate explanation with opportunity signals', () => {
      const listing = {
        opportunity_signals: ['wizards_detected', 'french_edition'],
        risk_signals: [],
        score: 85,
        card_count: 50,
        distance_km: 5
      };
      
      const explanation = generateExplanation(listing, { keywords: 100, price: 80 });
      
      expect(explanation).toContain('TRÈS INTÉRESSANT');
      expect(explanation).toContain('Wizards');
      expect(explanation).toContain('française');
    });
    
    test('should include risk warnings', () => {
      const listing = {
        opportunity_signals: ['wizards_detected'],
        risk_signals: ['condition_unclear', 'incomplete_photos'],
        score: 70
      };
      
      const explanation = generateExplanation(listing, { keywords: 80 });
      
      expect(explanation).toContain('Points de vigilance');
      expect(explanation).toContain('État des cartes');
      expect(explanation).toContain('photos');
    });
  });
  
  describe('enrichListing', () => {
    test('should enrich listing with all fields', () => {
      const listing = {
        title: 'Lot cartes Pokemon Wizards français',
        description: 'Bon état, 100 cartes',
        price: 80,
        card_count: 100,
        distance_km: 5,
        images: 'img1.jpg,img2.jpg,img3.jpg',
        score: 85,
        score_breakdown: { keywords: 100, price: 90, distance: 100, is_lot: 100 }
      };
      
      const enriched = enrichListing(listing, mockProfile);
      
      expect(enriched.opportunity_signals).toBeDefined();
      expect(enriched.risk_signals).toBeDefined();
      expect(enriched.explanation).toBeDefined();
      expect(enriched.badges).toBeDefined();
      
      expect(enriched.opportunity_signals).toContain('wizards_detected');
      expect(enriched.opportunity_signals).toContain('french_edition');
      expect(enriched.badges).toContain('🔥 WIZARDS');
      expect(enriched.badges).toContain('🇫🇷 FR');
    });
  });
});
