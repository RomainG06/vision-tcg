import { logger } from './logger.js';

/**
 * Whitelist of allowed domains for scraping
 */
const ALLOWED_DOMAINS = [
    'leboncoin.fr',
    'www.leboncoin.fr',
    'vinted.fr',
    'www.vinted.fr',
    'fr.vinted.com',
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com'
];

/**
 * Validate URL before navigation with Puppeteer
 * Prevents SSRF attacks by ensuring only whitelisted domains are accessed
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid and safe
 */
export function isValidScrapingUrl(url) {
    try {
        const urlObj = new URL(url);

        // Block dangerous protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            logger.warn(`Blocked URL with invalid protocol: ${urlObj.protocol}`);
            return false;
        }

        // Check if domain is whitelisted
        const hostname = urlObj.hostname.toLowerCase();
        const isAllowed = ALLOWED_DOMAINS.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
            logger.warn(`Blocked URL with non-whitelisted domain: ${hostname}`);
            return false;
        }

        return true;
    } catch (error) {
        logger.warn(`Invalid URL format: ${url}`);
        return false;
    }
}

/**
 * Sanitize search query to prevent injection attacks
 * Removes dangerous characters while keeping useful search terms
 * 
 * @param {string} query - Search query to sanitize
 * @param {number} maxLength - Maximum query length (default: 200)
 * @returns {string} Sanitized query
 */
export function sanitizeSearchQuery(query) {
    if (typeof query !== 'string') {
        return '';
    }

    // Remove dangerous characters but keep spaces, letters, numbers, and common punctuation
    const sanitized = query
        .substring(0, 200) // Limit length
        .replace(/[<>{}[\]\\|`]/g, '') // Remove dangerous chars
        .trim();

    return sanitized;
}

/**
 * Validate and parse integer with bounds
 * 
 * @param {string|number} value - Value to parse
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} Validated integer
 */
export function validateInteger(value, min, max, defaultValue) {
    const parsed = parseInt(value);

    if (isNaN(parsed)) {
        return defaultValue;
    }

    return Math.min(Math.max(parsed, min), max);
}

/**
 * Validate and parse float with bounds
 * 
 * @param {string|number} value - Value to parse
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} Validated float
 */
export function validateFloat(value, min, max, defaultValue) {
    const parsed = parseFloat(value);

    if (isNaN(parsed)) {
        return defaultValue;
    }

    return Math.min(Math.max(parsed, min), max);
}

/**
 * Validate enum value
 * 
 * @param {string} value - Value to validate
 * @param {string[]} allowedValues - Array of allowed values
 * @param {string} defaultValue - Default value if invalid
 * @returns {string} Validated enum value
 */
export function validateEnum(value, allowedValues, defaultValue) {
    if (typeof value === 'string' && allowedValues.includes(value)) {
        return value;
    }
    return defaultValue;
}
