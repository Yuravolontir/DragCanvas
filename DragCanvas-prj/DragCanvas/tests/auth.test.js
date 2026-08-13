/**
 * Regression tests for the authorisation middlewares.
 *
 * Each case here corresponds to a hole that was actually open in this project,
 * so a failure means one of them has been reopened rather than that a style
 * rule was broken:
 *
 *   - "/api/users/:id" was readable by any signed-in account, so one user could
 *     read another's record by changing the number in the URL.
 *   - Roles were taken from the token, so "Remove Admin" and "Deactivate" only
 *     took effect when the token expired, up to seven days later.
 *
 * JWT_SECRET has to exist before the module is imported, because auth.js reads
 * it into a constant at load time - hence the dynamic import below.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import { makeRes, makeNext, makeReq } from './helpers.js';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';

const { requireAdmin, requireSuperAdmin, requireSelfOrAdmin, verifyToken, createToken } =
    await import('../middlewares/auth.js');
const { setCachedUser, invalidateUser } = await import('../utils/roleCache.js');

const REGULAR = { userId: 7, email: 'user@example.com', isAdmin: false, isSuperAdmin: false };
const ADMIN = { userId: 8, email: 'admin@example.com', isAdmin: true, isSuperAdmin: false };
const SUPER = { userId: 9, email: 'super@example.com', isAdmin: false, isSuperAdmin: true };

// ---------- requireSelfOrAdmin: the IDOR fix ----------

test('requireSelfOrAdmin lets a user read their own record', () => {
    const req = makeReq({ user: REGULAR, params: { id: '7' } });
    const res = makeRes();
    const next = makeNext();

    requireSelfOrAdmin(req, res, next);

    assert.equal(next.called, true);
    assert.equal(res.statusCode, null);
});

test('requireSelfOrAdmin refuses someone else\'s record', () => {
    const req = makeReq({ user: REGULAR, params: { id: '8' } });
    const res = makeRes();
    const next = makeNext();

    requireSelfOrAdmin(req, res, next);

    assert.equal(next.called, false, 'the request must not reach the controller');
    assert.equal(res.statusCode, 403);
});

test('requireSelfOrAdmin still lets an admin read any record', () => {
    const req = makeReq({ user: ADMIN, params: { id: '7' } });
    const res = makeRes();
    const next = makeNext();

    requireSelfOrAdmin(req, res, next);

    assert.equal(next.called, true);
});

test('requireSelfOrAdmin refuses an id that is not a number', () => {
    // Number("abc") is NaN, and NaN === NaN is false, so this must not slip
    // through the self check by accident.
    const req = makeReq({ user: REGULAR, params: { id: 'abc' } });
    const res = makeRes();
    const next = makeNext();

    requireSelfOrAdmin(req, res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 403);
});

// ---------- requireAdmin / requireSuperAdmin ----------

test('requireAdmin refuses an ordinary user', () => {
    const res = makeRes();
    const next = makeNext();

    requireAdmin(makeReq({ user: REGULAR }), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 403);
});

test('requireAdmin accepts an admin and a superadmin', () => {
    for (const user of [ADMIN, SUPER]) {
        const next = makeNext();
        requireAdmin(makeReq({ user }), makeRes(), next);
        assert.equal(next.called, true, `${user.email} should be allowed`);
    }
});

test('requireAdmin refuses a request with no user attached', () => {
    // verifyToken always runs first, so this should be unreachable - which is
    // exactly why it must fail closed if the router is ever wired up wrongly.
    const res = makeRes();
    const next = makeNext();

    requireAdmin(makeReq(), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 403);
});

test('requireSuperAdmin refuses a plain admin', () => {
    const res = makeRes();
    const next = makeNext();

    requireSuperAdmin(makeReq({ user: ADMIN }), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 403);
});

test('requireSuperAdmin accepts a superadmin', () => {
    const next = makeNext();

    requireSuperAdmin(makeReq({ user: SUPER }), makeRes(), next);

    assert.equal(next.called, true);
});

// ---------- verifyToken: everything that must not get past the door ----------
//
// These cases never reach the database lookup, so they need no connection. The
// lookup itself is covered by the deploy checks in DEPLOY.md, which run against
// a real admin session.

test('verifyToken refuses a request with no Authorization header', async () => {
    const res = makeRes();
    const next = makeNext();

    await verifyToken(makeReq({ headers: {} }), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 401);
});

test('verifyToken refuses an Authorization header that is not a Bearer token', async () => {
    const res = makeRes();
    const next = makeNext();

    await verifyToken(makeReq({ headers: { authorization: 'Basic abc123' } }), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 401);
});

test('verifyToken refuses a token signed with a different secret', async () => {
    // The reports service verifies tokens with the same secret; if a mismatched
    // one were accepted here, that shared trust would mean nothing.
    const forged = jwt.sign({ userId: 7, isAdmin: true }, 'not-the-real-secret');
    const res = makeRes();
    const next = makeNext();

    await verifyToken(makeReq({ headers: { authorization: `Bearer ${forged}` } }), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 401);
});

test('verifyToken refuses an expired token', async () => {
    const expired = jwt.sign({ userId: 7 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const res = makeRes();
    const next = makeNext();

    await verifyToken(makeReq({ headers: { authorization: `Bearer ${expired}` } }), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 401);
});

test('verifyToken refuses a token that is not a token at all', async () => {
    const res = makeRes();
    const next = makeNext();

    await verifyToken(makeReq({ headers: { authorization: 'Bearer not-a-jwt' } }), res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 401);
});

test('verifyToken takes the roles from the cache, not from the token', async (t) => {
    // The token claims superadmin; the cached row - which is what the database
    // said - is an ordinary user. The cached roles must win, because that is the
    // whole point of the fix: the token no longer decides what anyone may do.
    const token = createToken({
        User_ID: 7,
        UserEmail: 'user@example.com',
        IsAdmin: true,
        IsSuperAdmin: true,
    });

    setCachedUser(7, REGULAR);
    t.after(() => invalidateUser(7));

    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const next = makeNext();

    await verifyToken(req, makeRes(), next);

    assert.equal(next.called, true);
    assert.equal(req.user.isAdmin, false, 'the token said admin; the database said no');
    assert.equal(req.user.isSuperAdmin, false);
});
