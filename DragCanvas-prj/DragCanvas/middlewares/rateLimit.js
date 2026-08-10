import rateLimit from 'express-rate-limit';
import { buildErrorResponse } from '../utils/response.builder.js';

/**
 * Rate limits for the two kinds of endpoint that need them:
 * one that anyone on the internet can reach, and ones that cost money per call.
 */

const reject = message => (req, res) =>
    res.status(429).json(buildErrorResponse(message));

/**
 * Form submissions arrive from published sites, so the caller is a stranger.
 * Five a minute is generous for a human filling in a contact form and useless
 * for a flood.
 */
export const formSubmitLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: reject('Too many submissions. Please wait a minute and try again.'),
});

/**
 * Each AI call costs money at the provider. Signed in or not, nobody needs to
 * generate more than a handful of pages a minute.
 */
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: reject('Too many AI requests. Please wait a moment.'),
});
