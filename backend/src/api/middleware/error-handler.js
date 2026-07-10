import { logger } from '../../utils/logger.js';

/**
 * Global error handler middleware
 * Catches errors from async routes and formats responses consistently
 */
export function errorHandler(err, req, res, next) {
  // Log the error with full details
  logger.error('Request error:', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Default error response
  const response = {
    error: err.statusCode === 500 ? 'Internal server error' : err.message || 'An error occurred',
  };

  // Add details in development mode
  if (isDevelopment && err.stack) {
    response.stack = err.stack.split('\n').slice(0, 5);
  }

  // Send response with appropriate status code
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(response);
}

/**
 * Async route wrapper to catch errors and pass to error handler
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for routes that don't exist
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
}

/**
 * Custom error classes for better error handling
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends ApiError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
