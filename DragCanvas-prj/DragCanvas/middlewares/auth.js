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
