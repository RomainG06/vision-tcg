import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Repository for profiles (JSON configuration files)
 * Handles loading, validation, and profile management
 */
export class ProfileRepository {
  constructor(profilesDir = null) {
    this.profilesDir = profilesDir || path.join(__dirname, '../../profiles');
  }

  /**
   * Load a profile by name
   * @param {string} name - Profile name (without .json extension)
   * @returns {Object} Parsed profile
   * @throws {Error} If profile not found or invalid
   */
  load(name) {
    const profilePath = path.join(this.profilesDir, `${name}.json`);
    
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found: ${name}`);
    }
    
    try {
      const content = fs.readFileSync(profilePath, 'utf-8');
      const profile = JSON.parse(content);
      
      // Validate profile structure
      this.validate(profile);
      
      return profile;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in profile ${name}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List all available profiles
   * @returns {Array<Object>} List of profiles with metadata
   */
  list() {
    if (!fs.existsSync(this.profilesDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.profilesDir)
      .filter(f => f.endsWith('.json'));
    
    return files.map(file => {
      const name = path.basename(file, '.json');
      try {
        const profile = this.load(name);
        return {
          name,
          description: profile.description || '',
          enabled: profile.enabled !== false,
          version: profile.version || '1.0.0'
        };
      } catch (error) {
        return {
          name,
          error: error.message,
          enabled: false
        };
      }
    });
  }

  /**
   * Validate profile structure
   * @param {Object} profile - Profile object
   * @throws {Error} If profile is invalid
   */
  validate(profile) {
    const errors = [];
    
    // Required top-level fields
    if (!profile.name) errors.push('Missing required field: name');
    if (!profile.search) errors.push('Missing required field: search');
    if (!profile.filters) errors.push('Missing required field: filters');
    if (!profile.scoring) errors.push('Missing required field: scoring');
    
    // Validate search section
    if (profile.search) {
      if (!Array.isArray(profile.search.keywords) || profile.search.keywords.length === 0) {
        errors.push('search.keywords must be a non-empty array');
      }
      if (!Array.isArray(profile.search.locations) || profile.search.locations.length === 0) {
        errors.push('search.locations must be a non-empty array');
      }
      
      // Validate each location
      if (Array.isArray(profile.search.locations)) {
        profile.search.locations.forEach((loc, idx) => {
          if (!loc.name) errors.push(`search.locations[${idx}] missing name`);
          if (typeof loc.lat !== 'number') errors.push(`search.locations[${idx}] invalid lat`);
          if (typeof loc.lon !== 'number') errors.push(`search.locations[${idx}] invalid lon`);
          if (typeof loc.radius_km !== 'number') errors.push(`search.locations[${idx}] invalid radius_km`);
        });
      }
    }
    
    // Validate filters section
    if (profile.filters) {
      if (!profile.filters.budget) errors.push('Missing filters.budget');
      if (!profile.filters.distance) errors.push('Missing filters.distance');
      
      if (profile.filters.budget) {
        if (typeof profile.filters.budget.max !== 'number') {
          errors.push('filters.budget.max must be a number');
        }
      }
      
      if (profile.filters.distance) {
        if (typeof profile.filters.distance.max_km !== 'number') {
          errors.push('filters.distance.max_km must be a number');
        }
      }
    }
    
    // Validate scoring section
    if (profile.scoring) {
      if (!profile.scoring.weights) errors.push('Missing scoring.weights');
      if (!Array.isArray(profile.scoring.keywords_positive)) {
        errors.push('scoring.keywords_positive must be an array');
      }
      if (!Array.isArray(profile.scoring.keywords_negative)) {
        errors.push('scoring.keywords_negative must be an array');
      }
      
      if (profile.scoring.weights) {
        const requiredWeights = ['keywords', 'price', 'distance', 'is_lot'];
        requiredWeights.forEach(weight => {
          if (typeof profile.scoring.weights[weight] !== 'number') {
            errors.push(`scoring.weights.${weight} must be a number`);
          }
        });
        
        // Weights should sum to ~1.0
        const sum = Object.values(profile.scoring.weights).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1.0) > 0.01) {
          errors.push(`scoring.weights should sum to 1.0 (current: ${sum})`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Profile validation failed:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  /**
   * Save a profile
   * @param {string} name - Profile name
   * @param {Object} profile - Profile object
   */
  save(name, profile) {
    // Validate before saving
    this.validate(profile);
    
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
    
    const profilePath = path.join(this.profilesDir, `${name}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
  }

  /**
   * Delete a profile
   * @param {string} name - Profile name
   */
  delete(name) {
    const profilePath = path.join(this.profilesDir, `${name}.json`);
    
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found: ${name}`);
    }
    
    fs.unlinkSync(profilePath);
  }

  /**
   * Get enabled profiles only
   * @returns {Array<Object>} Enabled profiles
   */
  getEnabled() {
    return this.list().filter(p => p.enabled && !p.error);
  }
}
