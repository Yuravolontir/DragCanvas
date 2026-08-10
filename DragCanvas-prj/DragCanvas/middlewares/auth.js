import jwt from 'jsonwebtoken';
import { buildErrorResponse } from '../utils/response.builder.js';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '7d';

/** Create a signed token for a user row coming from the database. */
export function createToken(user) {
    const payload = {
        userId: user.User_ID,
        email: user.UserEmail,
        isAdmin: !!user.IsAdmin,
        isSuperAdmin: !!user.IsSuperAdmin,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/**
 * Middleware: only lets the request through if it carries a valid token.
 * Reads "Authorization: Bearer <token>", verifies the signature,
 * and puts the decoded payload on req.user for the controllers to use.
 */
export function verifyToken(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json(buildErrorResponse('Missing authentication token'));
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json(buildErrorResponse('Invalid or expired token'));
    }
}

/** Middleware: must run after verifyToken. Blocks non-admin users. */
export function requireAdmin(req, res, next) {
    if (!req.user?.isAdmin && !req.user?.isSuperAdmin) {
        return res.status(403).json(buildErrorResponse('Admin permissions required'));
    }
    next();
}

/** Middleware: must run after verifyToken. Blocks everyone except superadmins. */
export function requireSuperAdmin(req, res, next) {
    if (!req.user?.isSuperAdmin) {
        return res.status(403).json(buildErrorResponse('Superadmin permissions required'));
    }
    next();
}

/**
 * Middleware: the caller may only reach this record if it is their own, or if
 * they are an admin. Must run after verifyToken.
 *
 * Projects and assets have always taken the owner from the token; the user
 * routes drifted from that because they were ported straight from the old
 * monolith, which left "/api/users/:id" readable by anyone with an account.
 *
 * Answers 403 rather than 404 here. Elsewhere a foreign resource returns 404 so
 * ids cannot be probed, but user ids are sequential and already guessable, so
 * hiding existence buys nothing and 403 is the honest answer.
 */
export function requireSelfOrAdmin(req, res, next) {
    const requestedId = Number(req.params.id);
    const callerId = Number(req.user?.userId);

    if (Number.isFinite(requestedId) && requestedId === callerId) return next();
    if (req.user?.isAdmin || req.user?.isSuperAdmin) return next();

    return res.status(403).json(buildErrorResponse('You can only access your own account'));
}
