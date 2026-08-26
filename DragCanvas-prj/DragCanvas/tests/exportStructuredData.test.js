import assert from 'node:assert/strict';
import test from 'node:test';
import { exportToHtml } from '../src/utils/exportToHtml.js';

test('supported elements become schema.org JSON-LD', () => {
  const data = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, nodes: ['faq', 'map'], props: {} },
    faq: { type: { resolvedName: 'Accordion' }, nodes: [], props: { items: ['Question?', 'Answer.'] } },
    map: { type: { resolvedName: 'Map' }, nodes: [], props: { label: 'Bakery', lat: 32.1, lng: 34.8 } },
  };
  const html = exportToHtml(data, 'Bakery');
  const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  assert.ok(json);
  const graph = JSON.parse(json)['@graph'];
  assert.equal(graph[0]['@type'], 'FAQPage');
  assert.equal(graph[0].mainEntity[0].acceptedAnswer.text, 'Answer.');
  assert.equal(graph[1]['@type'], 'LocalBusiness');
});

test('navbar exports a CSS-only mobile menu', () => {
  const data = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, nodes: ['nav', 'section'], props: {} },
    nav: { type: { resolvedName: 'NavbarElement' }, nodes: [], props: { brand: 'Brand', links: [{ text: 'Home', href: '#home' }] } },
    section: { type: { resolvedName: 'Container' }, nodes: [], props: { anchor: 'home' } },
  };
  const html = exportToHtml(data, 'Menu');
  assert.match(html, /type="checkbox"/);
  assert.match(html, /menu-toggle:checked ~ \.links/);
});
