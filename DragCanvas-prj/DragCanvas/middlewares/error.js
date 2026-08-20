import { randomUUID } from 'crypto';
import { buildErrorResponse } from '../utils/response.builder.js';
import { log } from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Gives every request a short id, so a message shown to a user can be found in
 * the log. Without it "something went wrong" is untraceable, which is why the
 * controllers ended up forwarding raw driver text in the first place.
 */
export function requestId(req, res, next) {
    req.id = randomUUID().slice(0, 8);
    res.setHeader('X-Request-Id', req.id);
    next();
}

/** One compact JSON record per request, suitable for Render log search. */
export function requestLog(req, res, next) {
    const started = performance.now();
    res.on('finish', () => {
        const status = res.statusCode;
        const details = {
            requestId: req.id,
            method: req.method,
            path: req.path || req.originalUrl?.split('?')[0],
            status,
            durationMs: Math.round(performance.now() - started),
            userId: req.user?.userId,
        };
        if (status >= 500) log.error('http_request', details);
        else if (status >= 400) log.warn('http_request', details);
        else log.info('http_request', details);
    });
    next();
}

/**
 * Stops internal error text from reaching the client.
 *
 * The controllers do not call next(error) - they catch and answer directly with
 * res.status(500).json(buildErrorResponse(error.message)), in 56 places. So the
 * error handler below never sees them, and rewriting all 56 by hand is the kind
 * of mechanical edit that introduces mistakes.
 *
 * What every one of them does share is the status code the controller chose: a
 * message written for the user goes out as 400/401/404, while an error that
 * escaped from the driver goes out as 500. That is the signal, so this wraps
 * res.json once and redacts only the 5xx bodies. The real text goes to the log
 * under the request id that the client is shown.
 */
export function hideInternalErrors(req, res, next) {
    const sendJson = res.json.bind(res);

    res.json = (body) => {
        if (isProduction && res.statusCode >= 500 && body && body.success === false) {
            log.error('controller_error', {
                requestId: req.id,
                method: req.method,
                path: req.path || req.originalUrl?.split('?')[0],
                error: body.error,
            });
            return sendJson({ ...body, error: `Something went wrong on our side. Reference: ${req.id}` });
        }
        return sendJson(body);
    };

    next();
}

/** 404 handler - runs when no route matched the request. */
export function notFoundHandler(req, res) {
    return res.status(404).json(buildErrorResponse(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler - the last middleware in the chain.
 * Express recognises it by its four arguments and sends every error that a
 * route passed to next(error) here, so error formatting lives in one place.
 *
 * This is also where it is decided what may leave the process. Controllers
 * still call buildErrorResponse(error.message), which is useful in the log but
 * would otherwise hand the client table names, column names and driver text -
 * a free map of the schema. In production the client gets a fixed sentence and
 * the request id; the detail stays here.
 *
 * An error we raised on purpose ("Email already registered") is recognised by
 * carrying a status below 500, and its text is still shown - those messages are
 * written for the user.
 */
export function errorHandler(error, req, res, _next) {
    const status = error.status || error.statusCode || 500;
    log.error('unhandled_error', {
        requestId: req.id,
        method: req.method,
        path: req.path || req.originalUrl?.split('?')[0],
        status,
        error: error.stack || error.message,
    });

    const deliberate = status < 500;
    const message = (deliberate || !isProduction)
        ? (error.message || 'Server Error')
        : `Something went wrong on our side. Reference: ${req.id}`;

    return res.status(status).json(buildErrorResponse(message));
}
