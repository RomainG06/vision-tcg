import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProfileRepository } from '../src/repositories/profile-repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PROFILES_DIR = path.join(__dirname, 'test-profiles');

describe('ProfileRepository', () => {
  let repo;
  
  beforeEach(() => {
    // Create test profiles directory
    if (!fs.existsSync(TEST_PROFILES_DIR)) {
      fs.mkdirSync(TEST_PROFILES_DIR, { recursive: true });
    }
    repo = new ProfileRepository(TEST_PROFILES_DIR);
  });
  
  afterEach(() => {
    // Clean up test profiles
    if (fs.existsSync(TEST_PROFILES_DIR)) {
      fs.rmSync(TEST_PROFILES_DIR, { recursive: true, force: true });
    }
  });
  
  test('should load valid profile', () => {
    const validProfile = {
      name: 'test',
      description: 'Test profile',
      search: {
        keywords: ['pokemon'],
        categories: ['toys'],
        locations: [{ name: 'Nice', lat: 43.71, lon: 7.26, radius_km: 50 }]
      },
      filters: {
        budget: { min: 10, max: 1500, preferred_max: 300 },
        distance: { max_km: 50, preferred_km: 20 },
        min_score: 50
      },
      scoring: {
        weights: { keywords: 0.4, price: 0.3, distance: 0.2, is_lot: 0.1 },
        keywords_positive: ['wizards'],
        keywords_negative: ['fake'],
        lot_indicators: ['lot']
      }
    };
    
    fs.writeFileSync(
      path.join(TEST_PROFILES_DIR, 'test.json'),
      JSON.stringify(validProfile, null, 2)
    );
    
    const loaded = repo.load('test');
    expect(loaded.name).toBe('test');
    expect(loaded.search.keywords).toContain('pokemon');
  });
  
  test('should throw error for non-existent profile', () => {
    expect(() => repo.load('non-existent')).toThrow('Profile not found');
  });
  
  test('should throw error for invalid JSON', () => {
    fs.writeFileSync(
      path.join(TEST_PROFILES_DIR, 'invalid.json'),
      '{ invalid json }'
    );
    
    expect(() => repo.load('invalid')).toThrow('Invalid JSON');
  });
  
  test('should validate profile with missing name', () => {
    const invalidProfile = {
      search: {},
      filters: {},
      scoring: {}
    };
    
    expect(() => repo.validate(invalidProfile)).toThrow('Missing required field: name');
  });
  
  test('should validate profile with missing search section', () => {
    const invalidProfile = {
      name: 'test',
      filters: { budget: {}, distance: {} },
      scoring: { weights: {}, keywords_positive: [], keywords_negative: [] }
    };
    
    expect(() => repo.validate(invalidProfile)).toThrow('Missing required field: search');
  });
  
  test('should validate profile with empty keywords', () => {
    const invalidProfile = {
      name: 'test',
      search: { keywords: [], locations: [] },
      filters: { budget: {}, distance: {} },
      scoring: { weights: {}, keywords_positive: [], keywords_negative: [] }
    };
    
    expect(() => repo.validate(invalidProfile)).toThrow('keywords must be a non-empty array');
  });
  
  test('should validate profile with invalid location', () => {
    const invalidProfile = {
      name: 'test',
      search: {
        keywords: ['test'],
        locations: [{ name: 'Test' }] // Missing lat, lon, radius_km
      },
      filters: { budget: { max: 100 }, distance: { max_km: 50 } },
      scoring: {
        weights: { keywords: 0.4, price: 0.3, distance: 0.2, is_lot: 0.1 },
        keywords_positive: [],
        keywords_negative: []
      }
    };
    
    expect(() => repo.validate(invalidProfile)).toThrow('invalid lat');
  });
  
  test('should validate profile with incorrect weight sum', () => {
    const invalidProfile = {
      name: 'test',
      search: {
        keywords: ['test'],
        locations: [{ name: 'Test', lat: 43, lon: 7, radius_km: 50 }]
      },
      filters: { budget: { max: 100 }, distance: { max_km: 50 } },
      scoring: {
        weights: { keywords: 0.5, price: 0.3, distance: 0.3, is_lot: 0.1 }, // Sum = 1.2
        keywords_positive: [],
        keywords_negative: []
      }
    };
    
    expect(() => repo.validate(invalidProfile)).toThrow('should sum to 1.0');
  });
  
  test('should list all profiles', () => {
    const profile1 = {
      name: 'profile1',
      description: 'First profile',
      search: {
        keywords: ['test'],
        locations: [{ name: 'Test', lat: 43, lon: 7, radius_km: 50 }]
      },
      filters: { budget: { max: 100 }, distance: { max_km: 50 } },
      scoring: {
        weights: { keywords: 0.4, price: 0.3, distance: 0.2, is_lot: 0.1 },
        keywords_positive: [],
        keywords_negative: []
      }
    };
    
    const profile2 = { ...profile1, name: 'profile2', description: 'Second profile' };
    
    fs.writeFileSync(path.join(TEST_PROFILES_DIR, 'profile1.json'), JSON.stringify(profile1));
    fs.writeFileSync(path.join(TEST_PROFILES_DIR, 'profile2.json'), JSON.stringify(profile2));
    
    const list = repo.list();
    expect(list.length).toBe(2);
    expect(list.map(p => p.name)).toContain('profile1');
    expect(list.map(p => p.name)).toContain('profile2');
  });
  
  test('should save profile', () => {
    const profile = {
      name: 'new-profile',
      search: {
        keywords: ['test'],
        locations: [{ name: 'Test', lat: 43, lon: 7, radius_km: 50 }]
      },
      filters: { budget: { max: 100 }, distance: { max_km: 50 } },
      scoring: {
        weights: { keywords: 0.4, price: 0.3, distance: 0.2, is_lot: 0.1 },
        keywords_positive: [],
        keywords_negative: []
      }
    };
    
    repo.save('new-profile', profile);
    
    const loaded = repo.load('new-profile');
    expect(loaded.name).toBe('new-profile');
  });
  
  test('should delete profile', () => {
    const profile = {
      name: 'to-delete',
      search: {
        keywords: ['test'],
        locations: [{ name: 'Test', lat: 43, lon: 7, radius_km: 50 }]
      },
      filters: { budget: { max: 100 }, distance: { max_km: 50 } },
      scoring: {
        weights: { keywords: 0.4, price: 0.3, distance: 0.2, is_lot: 0.1 },
        keywords_positive: [],
        keywords_negative: []
      }
    };
    
    repo.save('to-delete', profile);
    expect(() => repo.load('to-delete')).not.toThrow();
    
    repo.delete('to-delete');
    expect(() => repo.load('to-delete')).toThrow('Profile not found');
  });
  
  test('should get enabled profiles only', () => {
    const profile1 = {
      name: 'enabled',
      enabled: true,
      search: {
        keywords: ['test'],
        locations: [{ name: 'Test', lat: 43, lon: 7, radius_km: 50 }]
      },
      filters: { budget: { max: 100 }, distance: { max_km: 50 } },
      scoring: {
        weights: { keywords: 0.4, price: 0.3, distance: 0.2, is_lot: 0.1 },
        keywords_positive: [],
        keywords_negative: []
      }
    };
    
    const profile2 = { ...profile1, name: 'disabled', enabled: false };
    
    repo.save('enabled', profile1);
    repo.save('disabled', profile2);
    
    const enabled = repo.getEnabled();
    expect(enabled.length).toBe(1);
    expect(enabled[0].name).toBe('enabled');
  });
});
