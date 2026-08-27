import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewBundle, previewPage } from '../utils/previewBundle.js';

test('multipage preview rewrites internal navigation and serves every page', () => {
  const stored = createPreviewBundle(
    '<a href="/about/">About</a><a href="https://example.com">Elsewhere</a>',
    { '/about/index.html': '<a href="/">Home</a><h1>About</h1>' },
    '/api/publish/preview/7',
    'secret'
  );
  assert.match(previewPage(stored, 'home'), /page=about/);
  assert.match(previewPage(stored, 'about'), /page=home/);
  assert.match(previewPage(stored, 'home'), /https:\/\/example\.com/);
  assert.equal(previewPage(stored, 'missing'), null);
});

test('legacy single-page previews remain readable', () => {
  assert.equal(previewPage('<h1>Old preview</h1>', 'home'), '<h1>Old preview</h1>');
});
