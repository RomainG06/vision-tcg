import { describe, test, expect } from '@jest/globals';
import { 
  normalizeListing, 
  validateListing, 
  normalizeListings 
} from '../src/services/normalizer.js';

describe('Normalizer', () => {
  describe('normalizeListing - Leboncoin', () => {
    test('should normalize basic Leboncoin listing', () => {
      const raw = {
        id: 'lbc-12345',
        url: 'https://leboncoin.fr/12345',
        title: '  Lot Pokemon Wizards  ',
        description: 'Super lot&nbsp;de cartes',
        price: '89,99 €',
        location: 'Nice',
        distance_km: 5,
        images: 'https://example.com/img.jpg',
        posted_at: '2026-06-01T10:00:00Z'
      };
      
      const normalized = normalizeListing(raw, 'leboncoin', 1);
      
      expect(normalized.source).toBe('leboncoin');
      expect(normalized.external_id).toBe('lbc-12345');
      expect(normalized.title).toBe('Lot Pokemon Wizards');
      expect(normalized.description).toBe('Super lot de cartes');
      expect(normalized.price).toBe(89.99);
      expect(normalized.location).toBe('Nice');
      expect(normalized.distance_km).toBe(5);
      expect(normalized.images).toBe('https://example.com/img.jpg');
      expect(normalized.status).toBe('new');
    });
    
    test('should handle various price formats', () => {
      const testCases = [
        { input: '89,99 €', expected: 89.99 },
        { input: '150€', expected: 150 },
        { input: '1 500,50 €', expected: 1500.50 },
        { input: '50', expected: 50 },
        { input: 75.5, expected: 75.5 },
        { input: '', expected: 0 },
        { input: null, expected: 0 }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const raw = {
          id: 'test',
          url: 'http://test.com',
          title: 'Test',
          price: input
        };
        const normalized = normalizeListing(raw, 'leboncoin', 1);
        expect(normalized.price).toBe(expected);
      });
    });
    
    test('should handle array of images', () => {
      const raw = {
        id: 'test',
        url: 'http://test.com',
        title: 'Test',
        price: 50,
        images: ['http://img1.jpg', 'http://img2.jpg', 'http://img3.jpg']
      };
      
      const normalized = normalizeListing(raw, 'leboncoin', 1);
      expect(normalized.images).toBe('http://img1.jpg');
    });
    
    test('should handle missing optional fields', () => {
      const raw = {
        id: 'test',
        url: 'http://test.com',
        title: 'Test',
        price: 50
      };
      
      const normalized = normalizeListing(raw, 'leboncoin', 1);
      expect(normalized.description).toBe('');
      expect(normalized.location).toBeUndefined();
      expect(normalized.lat).toBeNull();
      expect(normalized.lon).toBeNull();
      expect(normalized.distance_km).toBeNull();
      expect(normalized.images).toBe('');
    });
  });
  
  describe('normalizeListing - Vinted', () => {
    test('should normalize basic Vinted listing', () => {
      const raw = {
        id: 'vinted-67890',
        url: 'https://vinted.fr/items/67890',
        title: 'Cartes Pokemon Vintage',
        description: 'Très bon état',
        price: '45€',
        location: 'Cannes',
        distance_km: 15,
        photo: 'https://vinted.com/photo.jpg',
        created_at: '2026-06-05T14:30:00Z'
      };
      
      const normalized = normalizeListing(raw, 'vinted', 2);
      
      expect(normalized.source).toBe('vinted');
      expect(normalized.external_id).toBe('vinted-67890');
      expect(normalized.title).toBe('Cartes Pokemon Vintage');
      expect(normalized.price).toBe(45);
      expect(normalized.images).toBe('https://vinted.com/photo.jpg');
      expect(normalized.scrape_run_id).toBe(2);
    });
  });

  describe('normalizeListing - eBay', () => {
    test('should normalize eBay Browse API listing', () => {
      const raw = {
        external_id: 'v1|123|0',
        url: 'https://www.ebay.fr/itm/123',
        title: ' Lot Pokémon Wizards FR ',
        description: 'Cartes anciennes',
        price: 105.5,
        location: 'Nice, FR',
        images: ['https://img.example/item.jpg'],
        posted_at: '2026-06-26T08:00:00Z',
      };

      const normalized = normalizeListing(raw, 'ebay', 7);

      expect(normalized.scrape_run_id).toBe(7);
      expect(normalized.source).toBe('ebay');
      expect(normalized.external_id).toBe('v1|123|0');
      expect(normalized.title).toBe('Lot Pokémon Wizards FR');
      expect(normalized.price).toBe(105.5);
      expect(normalized.images).toBe('https://img.example/item.jpg');
      expect(normalized.status).toBe('new');
    });
  });
  
  describe('validateListing', () => {
    test('should validate correct listing', () => {
      const listing = {
        source: 'leboncoin',
        external_id: 'test-123',
        title: 'Test Listing',
        url: 'https://example.com',
        price: 50
      };
      
      const result = validateListing(listing);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject listing without source', () => {
      const listing = {
        external_id: 'test-123',
        title: 'Test',
        url: 'https://example.com',
        price: 50
      };
      
      const result = validateListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing source');
    });
    
    test('should reject listing without external_id', () => {
      const listing = {
        source: 'leboncoin',
        title: 'Test',
        url: 'https://example.com',
        price: 50
      };
      
      const result = validateListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing external_id');
    });
    
    test('should reject listing with invalid price', () => {
      const listing = {
        source: 'leboncoin',
        external_id: 'test-123',
        title: 'Test',
        url: 'https://example.com',
        price: -10
      };
      
      const result = validateListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid price');
    });
    
    test('should accumulate multiple errors', () => {
      const listing = {
        price: 'invalid'
      };
      
      const result = validateListing(listing);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
  
  describe('normalizeListings - batch', () => {
    test('should normalize multiple valid listings', () => {
      const rawListings = [
        { id: '1', url: 'http://test.com/1', title: 'Test 1', price: 50 },
        { id: '2', url: 'http://test.com/2', title: 'Test 2', price: 75 },
        { id: '3', url: 'http://test.com/3', title: 'Test 3', price: 100 }
      ];
      
      const result = normalizeListings(rawListings, 'leboncoin', 1);
      
      expect(result.normalized).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
      expect(result.normalized[0].external_id).toBe('1');
      expect(result.normalized[1].price).toBe(75);
    });
    
    test('should separate valid and invalid listings', () => {
      const rawListings = [
        { id: '1', url: 'http://test.com/1', title: 'Valid', price: 50 },
        { id: '2', title: 'Missing URL', price: 75 }, // Invalid: no URL
        { url: 'http://test.com/3', title: 'Missing ID', price: 100 }, // Invalid: no ID
        { id: '4', url: 'http://test.com/4', title: 'Valid 2', price: 25 }
      ];
      
      const result = normalizeListings(rawListings, 'leboncoin', 1);
      
      expect(result.normalized).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].errors).toContain('Missing url');
      expect(result.invalid[1].errors).toContain('Missing external_id');
    });
    
    test('should handle empty array', () => {
      const result = normalizeListings([], 'leboncoin', 1);
      
      expect(result.normalized).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle HTML entities in text', () => {
      const raw = {
        id: 'test',
        url: 'http://test.com',
        title: 'Pokémon&nbsp;&amp;&nbsp;Yu-Gi-Oh!',
        description: '&quot;Rare&quot;&nbsp;cards&nbsp;&lt;50€&gt;',
        price: 50
      };
      
      const normalized = normalizeListing(raw, 'leboncoin', 1);
      expect(normalized.title).toBe('Pokémon & Yu-Gi-Oh!');
      expect(normalized.description).toBe('"Rare" cards <50€>');
    });
    
    test('should handle extra whitespace', () => {
      const raw = {
        id: 'test',
        url: 'http://test.com',
        title: '  Multiple   spaces   here  ',
        description: '\n\nNewlines\n\nand   spaces\n\n',
        price: 50
      };
      
      const normalized = normalizeListing(raw, 'leboncoin', 1);
      expect(normalized.title).toBe('Multiple spaces here');
      expect(normalized.description).toBe('Newlines and spaces');
    });
    
    test('should throw error for unknown source', () => {
      const raw = { id: 'test', url: 'http://test.com', title: 'Test', price: 50 };
      
      expect(() => {
        normalizeListing(raw, 'unknown-source', 1);
      }).toThrow('Unknown source: unknown-source');
    });
  });
});
