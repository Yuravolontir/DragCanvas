import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePaymentUrl } from '../src/utils/elementData.js';
import { exportToHtml } from '../src/utils/exportToHtml.js';

test('payment links accept HTTPS and bare provider domains', () => {
  assert.equal(normalizePaymentUrl('https://pay.example/item'), 'https://pay.example/item');
  assert.equal(normalizePaymentUrl('paypal.me/store'), 'https://paypal.me/store');
});

test('payment links reject executable and non-web schemes', () => {
  assert.equal(normalizePaymentUrl('javascript:alert(1)'), '');
  assert.equal(normalizePaymentUrl('data:text/html,test'), '');
  assert.equal(normalizePaymentUrl('mailto:owner@example.com'), '');
});

test('catalog publishes direct owner payment links without a cart or commerce API', () => {
  const nodes = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['catalog'] },
    catalog: { type: { resolvedName: 'ProductCatalog' }, nodes: [], props: {
      products: ['Consultation', 'One hour', '100', ''],
      paymentLinks: ['https://pay.example/consultation'], buttonText: 'Pay now', currency: 'ILS', accent: { r: 1, g: 2, b: 3, a: 1 },
    } },
  };
  const html = exportToHtml(nodes, 'payment-links');
  assert.match(html, /href="https:\/\/pay\.example\/consultation"/);
  assert.match(html, />Pay now<\/a>/);
  assert.ok(!html.includes('/api/commerce/'));
  assert.ok(!html.includes('Add to cart'));
});
