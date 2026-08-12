import jwt from 'jsonwebtoken';
import db from '../utils/db.sql.services.js';
import { getCachedUser, setCachedUser } from '../utils/roleCache.js';
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
 *
 * The token proves WHO the caller is. It does not decide WHAT they may do -
 * that is read from the database.
 *
 * The roles used to come straight out of the token payload, which meant a
 * seven-day token kept its day-one rights: "Remove Admin" and "Deactivate" in
 * the admin panel wrote to the database correctly and then changed nothing for
 * up to a week. Reading the row here makes those buttons take effect at once.
 *
 * That lookup is one round-trip to Supabase per request, so its result is held
 * in a short-lived cache (utils/roleCache.js). A cache hit is an assertion the
 * caller was a confirmed-active user at most TTL ago - which is why the IsActive
 * check below is allowed to be skipped on a hit. The entry is only ever stored
 * on the happy path, so a database error, a missing row or a deactivated account
 * is never pinned. updateRole/updateStatus drop the entry the moment they write
 * a change, so a demotion made through the app still takes effect at once.
 */
export async function verifyToken(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json(buildErrorResponse('Missing authentication token'));
    }

    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch {
        return res.status(401).json(buildErrorResponse('Invalid or expired token'));
    }

    const cached = getCachedUser(payload.userId);
    if (cached) {
        req.user = cached;
        return next();
    }

    let rows;
    try {
        rows = await db.executeQuery(`
            SELECT "User_ID", "UserEmail", "IsActive", "IsAdmin", "IsSuperAdmin"
            FROM "TBUsers"
            WHERE "User_ID" = $1
        `, [payload.userId]);
    } catch (error) {
        // A database failure is not an authentication failure, and it is not
        // cached: pinning a transient error would lock every user out for the
        // TTL. Answering 401 here would look exactly like every token expiring
        // at once, which is a miserable thing to diagnose - so this says 500.
        console.error('[AUTH] Could not load the caller:', error.message);
        return res.status(500).json(buildErrorResponse('Could not verify the session'));
    }

    const user = rows[0];

    // Deliberately no fall back to the roles inside the token when the lookup
    // finds nothing. Falling back would restore the exact bug this removes,
    // only intermittently, which is worse than failing closed.
    if (!user) {
        return res.status(401).json(buildErrorResponse('Account no longer exists'));
    }
    if (user.IsActive === false) {
        // Not cached: a deactivated account must be re-checked on the next
        // request, not served a stale "active" verdict for the TTL window.
        return res.status(401).json(buildErrorResponse('Account is deactivated'));
    }

    req.user = {
        userId: user.User_ID,
        email: user.UserEmail,
        isAdmin: !!user.IsAdmin,
        isSuperAdmin: !!user.IsSuperAdmin,
    };

    setCachedUser(payload.userId, req.user);
    next();
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
