import test from 'node:test';
import assert from 'node:assert/strict';

import { publicApiBase, rewritePublishedApiUrls, rewritePublishedFiles } from '../utils/publishedApiUrls.js';

test('published HTML never keeps localhost API addresses', () => {
    const html = '<script>fetch("http://localhost:3001/api/forms/submit");fetch("http://127.0.0.1:3001/api/bookings")</script>';
    const fixed = rewritePublishedApiUrls(html, 'https://dragcanvas-api.onrender.com/');
    assert.doesNotMatch(fixed, /localhost|127\.0\.0\.1/);
    assert.match(fixed, /https:\/\/dragcanvas-api\.onrender\.com\/api\/forms\/submit/);
    assert.match(fixed, /https:\/\/dragcanvas-api\.onrender\.com\/api\/bookings/);
});

test('every generated page in a multipage bundle gets the public API', () => {
    const files = rewritePublishedFiles({
        '/contact/index.html': 'http://localhost:3001/api/forms/submit',
        '/booking/index.html': 'http://localhost:3001/api/bookings',
    }, 'https://api.example.com');
    assert.equal(files['/contact/index.html'], 'https://api.example.com/api/forms/submit');
    assert.equal(files['/booking/index.html'], 'https://api.example.com/api/bookings');
});

test('Render request origin is used when PUBLIC_API_URL is absent or local', () => {
    const req = { protocol: 'https', get: () => 'dragcanvas-api.onrender.com' };
    assert.equal(publicApiBase(req, ''), 'https://dragcanvas-api.onrender.com');
    assert.equal(publicApiBase(req, 'http://localhost:3001'), 'https://dragcanvas-api.onrender.com');
    assert.equal(publicApiBase(req, 'https://api.example.com/'), 'https://api.example.com');
});

test('publishing through the local API still targets the production API', () => {
    const req = { protocol: 'http', get: () => 'localhost:3001' };
    assert.equal(publicApiBase(req, ''), 'https://dragcanvas.onrender.com');
    assert.equal(publicApiBase(req, 'http://localhost:3001'), 'https://dragcanvas.onrender.com');
});
