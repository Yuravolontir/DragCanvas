import assert from 'node:assert/strict';
import test from 'node:test';
import { exportToHtml } from '../src/utils/exportToHtml.js';

const page = {
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, nodes: ['image'], props: {} },
  image: { type: { resolvedName: 'Image' }, nodes: [], props: { src: 'https://cdn.example/hero.jpg' } },
};

test('export includes safe SEO and social metadata', () => {
  const html = exportToHtml(page, 'Tea & <Cake>', {
    description: 'Fresh "daily" & local',
    canonicalUrl: 'https://example.com/',
    favicon: 'https://example.com/icon.png',
    lang: 'ru',
  });

  assert.match(html, /<html lang="ru">/);
  assert.match(html, /<title>Tea &amp; &lt;Cake&gt;<\/title>/);
  assert.match(html, /name="description" content="Fresh &quot;daily&quot; &amp; local"/);
  assert.match(html, /property="og:url" content="https:\/\/example.com\/"/);
  assert.match(html, /property="og:image" content="https:\/\/cdn.example\/hero.jpg"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="icon" href="https:\/\/example.com\/icon.png"/);
});

test('export leaves a deploy-time URL token when URL is not known yet', () => {
  const html = exportToHtml(page, 'First deploy');
  assert.match(html, /\{\{DRAGCANVAS_SITE_URL\}\}/);
});
