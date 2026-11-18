import { logger } from '../utils/logger.js';
import { run, get, all } from '../db/database.js';

/**
 * Global keywords cache
 * Prevents N+1 queries when scoring multiple listings
 */
class KeywordsCache {
    constructor() {
        this.cache = null;
        this.lastLoaded = null;
    }

    /**
     * Get keywords from cache or load from database
     * 
     * @param {boolean} forceRefresh - Force reload from database
     * @returns {Array} Array of keyword objects
     */
    getKeywords(forceRefresh = false) {
        if (forceRefresh || !this.cache) {
            this.loadKeywords();
        }
        return this.cache || [];
    }

    /**
     * Load keywords from database into cache
     */
    loadKeywords() {
        try {
            const keywords = all('SELECT keyword, category, weight FROM keywords WHERE active = 1 ORDER BY weight DESC');
            this.cache = keywords;
            this.lastLoaded = new Date();
            logger.debug(`Keywords cache loaded: ${keywords.length} keywords`);
        } catch (error) {
            // If table doesn't exist, use empty cache - server will use fallback keywords
            if (String(error?.message || '').includes('no such table: keywords')) {
                logger.info('Keywords table not found, using fallback keywords');
                this.cache = [];
            } else {
                logger.error('Error loading keywords cache:', error);
                this.cache = [];
            }
        }
    }

    /**
     * Add keyword to database and refresh cache
     * 
     * @param {string} keyword - Keyword term
     * @param {number} weight - Keyword weight
     * @param {string} category - Keyword category
     */
    addKeyword(keyword, weight, category = 'general') {
        try {
            run(
                'INSERT INTO keywords (keyword, weight, category, active) VALUES (?, ?, ?, 1)',
                [keyword, weight, category]
            );
            this.loadKeywords(); // Refresh cache
            logger.info(`Keyword added: ${keyword} (weight: ${weight})`);
        } catch (error) {
            logger.error('Error adding keyword:', error);
        }
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clear() {
        this.cache = null;
        this.lastLoaded = null;
        logger.debug('Keywords cache cleared');
    }

    /**
     * Get cache statistics
     * 
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            cached: this.cache ? this.cache.length : 0,
            lastLoaded: this.lastLoaded,
            isLoaded: this.cache !== null
        };
    }
}

// Export singleton instance
export const keywordsCache = new KeywordsCache();
