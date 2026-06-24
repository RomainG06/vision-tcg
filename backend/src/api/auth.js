import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

/**
 * Generate JWT token for authentication
 * @param {Object} payload - Token payload (user data)
 * @param {string} expiresIn - Token expiration (default: 24h)
 * @returns {string} JWT token
 */
export function generateToken(payload, expiresIn = '24h') {
    const secret = config.jwtSecret || 'dev-secret-change-in-production';
    return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function verifyToken(token) {
    const secret = config.jwtSecret || 'dev-secret-change-in-production';
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        logger.debug('Invalid token:', error.message);
        return null;
    }
}

/**
 * Middleware to authenticate requests with JWT
 * Checks for Bearer token in Authorization header
 */
export function authenticate(req, res, next) {
    // Skip auth in development if no token provided and auth is disabled
    if (config.nodeEnv === 'development' && config.skipAuth) {
        logger.debug('Skipping auth (development mode with skipAuth enabled)');
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }

    // Attach user info to request
    req.user = payload;
    next();
}

/**
 * Optional auth middleware - continues even if no token provided
 * Useful for endpoints that work differently based on auth status
 */
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) {
            req.user = payload;
        }
    }

    next();
}
