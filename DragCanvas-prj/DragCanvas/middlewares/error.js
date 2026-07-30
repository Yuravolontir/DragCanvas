import { buildErrorResponse } from '../utils/response.builder.js';

/** 404 handler - runs when no route matched the request. */
export function notFoundHandler(req, res) {
    return res.status(404).json(buildErrorResponse(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler - the last middleware in the chain.
 * Express recognises it by its four arguments and sends every error that a
 * route passed to next(error) here, so error formatting lives in one place.
 */
export function errorHandler(error, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, error.message);

    const status = error.status || 500;
    return res.status(status).json(buildErrorResponse(error.message || 'Server Error'));
}
