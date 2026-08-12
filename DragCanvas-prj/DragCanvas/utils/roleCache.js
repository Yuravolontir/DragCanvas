/**
 * In-memory TTL cache of a user's current roles and status.
 *
 * verifyToken reads the caller's row from the database on every authenticated
 * request, so a demotion or deactivation takes effect at once instead of at
 * token expiry (see the fix-stale-roles change). That lookup is one round-trip
 * to Supabase per request - about 77 ms. This cache holds the result for a short
 * window, so a session's worth of requests from one user costs a single lookup,
 * while updateRole and updateStatus drop the entry the moment they change it.
 *
 * What is stored: the built req.user object ({ userId, email, isAdmin,
 * isSuperAdmin }), and ONLY for a confirmed-active user. A cache hit is therefore
 * an assertion "this user was active when this entry was stored, at most TTL ago"
 * - which is why verifyToken is allowed to skip the IsActive check on a hit. The
 * three negative outcomes (database error, no row, inactive) are never stored, so
 * a transient failure or a just-deactivated account cannot be pinned for TTL.
 *
 * Deliberately unbounded and process-local. There is one Node instance and a
 * small user base, so the map never grows past one entry per recently-active
 * user and eviction machinery would buy nothing. Two things would change that
 * calculus, and both are out of scope here:
 *   - A large user base -> add an LRU bound (or move to Redis).
 *   - More than one Node instance -> invalidation in one process does not reach
 *     the others, so a demoted admin could keep their rights for up to TTL on the
 *     instance that missed the invalidation. That is the trigger for Redis.
 */

const TTL_MS = 30_000;

// userId(string) -> { user, expiresAt }
const cache = new Map();

/** Return the cached req.user for this id, or undefined if absent or expired. */
export function getCachedUser(userId) {
    const key = String(userId);
    const entry = cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return undefined;
    }
    return entry.user;
}

/** Store a req.user (only for a confirmed-active user) with a fresh TTL. */
export function setCachedUser(userId, user) {
    cache.set(String(userId), { user, expiresAt: Date.now() + TTL_MS });
}

/** Drop the cached entry. A no-op if the user was not cached. */
export function invalidateUser(userId) {
    cache.delete(String(userId));
}
