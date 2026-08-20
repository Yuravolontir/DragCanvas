import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = { location: { pathname: '/login', href: '/login' } };

const { apiFetch, ApiError, clearToken, setToken } = await import('../src/api.js');

test('a failed login keeps the server message instead of claiming the session expired', async () => {
  clearToken();
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: 'Invalid email or password' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-login' },
  });
  await assert.rejects(() => apiFetch('/api/auth/login'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.message, 'Invalid email or password');
    assert.equal(error.requestId, 'req-login');
    return true;
  });
});

test('an expired authenticated session clears the token', async () => {
  setToken('expired');
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: 'Expired' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-expired' },
  });
  await assert.rejects(() => apiFetch('/api/users/me'), /session has expired/i);
  assert.equal(storage.get('dragcanvas_token'), undefined);
});

test('network failures become a user-facing ApiError', async () => {
  clearToken();
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(() => apiFetch('/api/templates'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 0);
    assert.match(error.message, /Could not connect/);
    return true;
  });
});
