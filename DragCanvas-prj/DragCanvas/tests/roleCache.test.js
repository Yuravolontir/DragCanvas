/**
 * Regression tests for the role cache.
 *
 * The cache exists so the database is not asked for the caller's row on every
 * single request. That is only safe while two properties hold, and both are
 * load-bearing for the fix it accompanies:
 *
 *   - invalidateUser drops an entry at once, so "Remove Admin" and "Deactivate"
 *     in the admin panel bite on the target's next request rather than after
 *     the TTL.
 *   - an entry stops being served once the TTL has passed, so nothing is
 *     believed indefinitely.
 *
 * If either breaks, a demoted admin keeps their rights for a window - which is
 * a quieter version of the seven-day bug this whole change removed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { getCachedUser, setCachedUser, invalidateUser } from '../utils/roleCache.js';

const USER = { userId: 42, email: 'someone@example.com', isAdmin: true, isSuperAdmin: false };

test('a stored user is returned', (t) => {
    setCachedUser(42, USER);
    t.after(() => invalidateUser(42));

    assert.deepEqual(getCachedUser(42), USER);
});

test('an unknown user is a miss, not a guess', () => {
    assert.equal(getCachedUser(999), undefined);
});

test('the id is matched regardless of string or number', (t) => {
    // req.params gives strings, the token gives a number, and a mismatch here
    // would silently mean the cache never hits and invalidation never lands.
    setCachedUser(42, USER);
    t.after(() => invalidateUser(42));

    assert.deepEqual(getCachedUser('42'), USER);
});

test('invalidateUser drops the entry immediately', () => {
    setCachedUser(42, USER);
    invalidateUser(42);

    assert.equal(getCachedUser(42), undefined, 'a demotion must not be served from the cache');
});

test('invalidateUser on someone who was never cached is harmless', () => {
    assert.doesNotThrow(() => invalidateUser(12345));
});

test('an entry is no longer served once its TTL has passed', (t) => {
    t.mock.timers.enable({ apis: ['Date'] });
    t.after(() => t.mock.timers.reset());

    setCachedUser(42, USER);
    assert.deepEqual(getCachedUser(42), USER, 'fresh entry should hit');

    // Past the 30s TTL the entry must be treated as absent, so the next request
    // reads the row again and picks up any change made in the meantime.
    t.mock.timers.tick(31_000);

    assert.equal(getCachedUser(42), undefined);
});
