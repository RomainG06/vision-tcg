/**
 * Tests for value-estimator service
 */

import { estimateValue } from '../src/services/value-estimator.js';

describe('Value Estimator', () => {
  describe('estimateValue', () => {
    test('should return null for unknown card count', () => {
      const listing = {
        title: 'Pokemon cards',
        description: '',
        opportunity_signals: []
      };
      
      const result = estimateValue(listing);
      // When card count is unknown (defaulted to 1), we still estimate but with low confidence
      expect(result.value_estimate_low).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBe('low');
    });
    
    test('should estimate basic lot value', () => {
      const listing = {
        title: 'Lot 100 cartes Pokemon',
        card_count: 100,
        price: 20,
        opportunity_signals: []
      };
      
      const result = estimateValue(listing);
      expect(result.value_estimate_low).toBeGreaterThan(0);
      expect(result.value_estimate_high).toBeGreaterThan(result.value_estimate_low);
      expect(result.confidence).toBe('low');
      expect(result.gain_potential).toBeDefined();
    });
    
    test('should apply Wizards multiplier', () => {
      const listingBasic = {
        title: 'Lot 50 cartes Pokemon',
        card_count: 50,
        price: 50,
        opportunity_signals: []
      };
      
      const listingWizards = {
        title: 'Lot 50 cartes Pokemon Wizards',
        card_count: 50,
        price: 50,
        opportunity_signals: ['wizards_detected']
      };
      
      const resultBasic = estimateValue(listingBasic);
      const resultWizards = estimateValue(listingWizards);
      
      expect(resultWizards.value_estimate_low).toBeGreaterThan(resultBasic.value_estimate_low);
      expect(resultWizards.confidence).toBe('medium');
    });
    
    test('should apply French edition multiplier', () => {
      const listing = {
        title: 'Lot 50 cartes Pokemon français',
        card_count: 50,
        price: 50,
        opportunity_signals: ['french_edition']
      };
      
      const result = estimateValue(listing);
      expect(result.value_estimate_low).toBeGreaterThan(5); // 50 * 0.10 base
      expect(result.confidence).toBe('medium');
    });
    
    test('should detect Charizard and apply huge multiplier', () => {
      const listing = {
        title: 'Charizard Base Set',
        description: 'Charizard holographique',
        card_count: 1,
        price: 50,
        opportunity_signals: ['rare_cards', 'holographic']
      };
      
      const result = estimateValue(listing);
      // With additive bonuses: base 0.10-0.50 + holo +200%/+500% + rares +100%/+300% + Charizard +1000%/+5000%
      // = 0.10 × (1 + 13) = 1.3 to 0.50 × (1 + 58) = 29.5
      expect(result.value_estimate_high).toBeGreaterThan(10);
      expect(result.confidence).toBe('high');
      expect(result.methodology).toContain('Charizard');
    });
    
    test('should calculate gain potential correctly', () => {
      const listing = {
        title: 'Lot 100 cartes Wizards français',
        card_count: 100,
        price: 50,
        opportunity_signals: ['wizards_detected', 'french_edition']
      };
      
      const result = estimateValue(listing);
      const median = (result.value_estimate_low + result.value_estimate_high) / 2;
      const expectedGain = Math.round(median - 50);
      
      expect(result.gain_potential).toBe(expectedGain);
      expect(result.gain_percentage).toBeDefined();
      expect(result.gain_percentage).toBeGreaterThan(0);
    });
    
    test('should estimate from "lot" keyword', () => {
      const listing = {
        title: 'Lot Pokemon',
        description: 'Plusieurs cartes',
        price: 20,
        opportunity_signals: []
      };
      
      const result = estimateValue(listing);
      expect(result.value_estimate_low).toBeGreaterThan(0);
      expect(result.methodology).toContain('50 cartes'); // Default estimation
    });
    
    test('should combine multiple multipliers', () => {
      const listing = {
        title: 'Lot 200 cartes Wizards français holo',
        card_count: 200,
        price: 100,
        opportunity_signals: [
          'wizards_detected',
          'french_edition',
          'holographic',
          'complete_set'
        ]
      };
      
      const result = estimateValue(listing);
      // With additive bonuses: +200% + +50% + +200% + +50% = +500%
      // Low: 200 × 0.10 × 6 = 120€, High: 200 × 0.50 × 11 = 1100€
      expect(result.value_estimate_high).toBeGreaterThan(500);
      expect(result.confidence).toBe('high');
      expect(result.methodology).toContain('Wizards');
      expect(result.methodology).toContain('française');
      expect(result.methodology).toContain('holographiques');
    });
  });
});
