/**
 * A template of more than one page, and the label colour on a coloured fill.
 *
 * Both existed as bugs rather than as features. A multi-page template could be
 * written and could not be opened — the template loader handed the whole
 * envelope to deserialize, which wants a node map — and seven elements printed
 * white on whatever accent an author chose, so a template with a gold or a lime
 * accent shipped buttons measuring 1.6:1.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { templatePages, templateData } from '../scripts/templates/_validate.mjs';
import { readableInk, contrastRatio, INK_ON_LIGHT, INK_ON_DARK } from '../src/utils/readableInk.js';
import { exportToHtml } from '../src/utils/exportToHtml.js';

const page = (nodes) => ({
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: Object.keys(nodes) },
  ...Object.fromEntries(Object.entries(nodes).map(([id, node]) => [
    id, { isCanvas: false, nodes: [], parent: 'ROOT', ...node, type: { resolvedName: node.type } },
  ])),
});

/* ---------------------------------------------------------------- *
 * One shape for one page, another for several
 * ---------------------------------------------------------------- */

test('a single-page template is still a bare node map', () => {
  const map = page({ h: { type: 'Heading', props: { text: 'Hi' } } });
  const t = { name: 'One', map };

  assert.equal(templatePages(t).length, 1);
  assert.equal(templatePages(t)[0].slug, 'home');
  // Unchanged: this is what every template in the gallery already is, and what
  // the editor has always deserialised.
  assert.equal(templateData(t), map);
  assert.equal(templateData(t).__dragcanvasPages, undefined);
});

test('a multi-page template becomes the envelope the editor writes', () => {
  const t = {
    name: 'Several',
    pages: [
      { name: 'Home', slug: 'home', map: page({ a: { type: 'Heading', props: { text: 'Home' } } }) },
      { name: 'Rooms', slug: 'rooms', map: page({ b: { type: 'Heading', props: { text: 'Rooms' } } }) },
    ],
  };

  const data = templateData(t);
  assert.equal(data.__dragcanvasPages, true);
  assert.equal(data.currentSlug, 'home');
  assert.equal(data.pages.length, 2);
  assert.deepEqual(data.pages.map((p) => p.slug), ['home', 'rooms']);
  // `data`, not `map`: the key the editor's page state reads.
  assert.ok(data.pages[0].data.ROOT);
});

/* ---------------------------------------------------------------- *
 * The label follows the fill
 * ---------------------------------------------------------------- */

test('a label is whichever of the two can be read on the fill', () => {
  const gold = { r: 228, g: 200, b: 138, a: 1 };
  const navy = { r: 15, g: 27, b: 52, a: 1 };

  assert.deepEqual(readableInk(gold), INK_ON_LIGHT);
  assert.deepEqual(readableInk(navy), INK_ON_DARK);
  // The point of the exercise: white on that gold measured 1.62:1.
  assert.ok(contrastRatio(readableInk(gold), gold) >= 4.5);
  assert.ok(contrastRatio(readableInk(navy), navy) >= 4.5);
});

test('every accent gets a readable label, across the whole range', () => {
  for (let step = 0; step <= 255; step += 15) {
    for (const fill of [
      { r: step, g: step, b: step, a: 1 },
      { r: 255 - step, g: step, b: 120, a: 1 },
      { r: step, g: 200, b: 255 - step, a: 1 },
    ]) {
      const ratio = contrastRatio(readableInk(fill), fill);
      assert.ok(ratio >= 4.5, `rgb(${fill.r},${fill.g},${fill.b}) only reaches ${ratio.toFixed(2)}:1`);
    }
  }
});

test('a published button takes its label from its own accent', () => {
  const lime = { r: 196, g: 242, b: 75, a: 1 };
  const html = exportToHtml(page({
    n: { type: 'Newsletter', props: { heading: 'Join', buttonText: 'Subscribe', accent: lime } },
  }), 'newsletter');

  assert.match(html, /background: rgba\(196, 242, 75, 1\); color: rgb\(24, 24, 27\)/);
  assert.doesNotMatch(html, /background: rgba\(196, 242, 75, 1\); color: #fff/);
});

/* ---------------------------------------------------------------- *
 * Where the navigation actually goes
 * ---------------------------------------------------------------- */

test('the front page is a place a navigation bar can point at', () => {
  // "/" was not matched by the pattern that accepts page links, so the Home
  // entry of every multi-page site published from here rendered as an inert
  // word beside three working ones.
  const html = exportToHtml(page({
    n: {
      type: 'NavbarElement',
      props: {
        brand: 'Fold House',
        links: [
          { text: 'Home', href: '/' },
          { text: 'Rooms', href: '/rooms/' },
          { text: 'Nowhere', href: '#missing' },
        ],
      },
    },
  }), 'nav');

  assert.match(html, /<a href="\/">Home<\/a>/);
  assert.match(html, /<a href="\/rooms\/">Rooms<\/a>/);
  // An anchor with no section still renders as a word rather than a link.
  assert.match(html, /<span class="dead">Nowhere<\/span>/);
});

/* ---------------------------------------------------------------- *
 * Reading a stored design back
 * ---------------------------------------------------------------- */

test('a design comes back whether it was wrapped once or twice', async () => {
  const { parseDesign } = await import('../src/utils/projectPages.js');
  const map = page({ h: { type: 'Heading', props: { text: 'Hi' } } });

  // The editor's "save as template" writes one layer of JSON; the gallery build
  // used to write two. A single parse of the second hands back a string, which
  // Craft accepts — so the disagreement stayed invisible until a multi-page
  // template needed the envelope to be an object.
  assert.deepEqual(parseDesign(JSON.stringify(map)), map);
  assert.deepEqual(parseDesign(JSON.stringify(JSON.stringify(map))), map);
  assert.deepEqual(parseDesign(map), map);

  const envelope = { __dragcanvasPages: true, currentSlug: 'home', pages: [{ name: 'Home', slug: 'home', data: map }] };
  assert.equal(parseDesign(JSON.stringify(JSON.stringify(envelope))).pages.length, 1);
});

test('an unreadable design is nothing rather than a crash', async () => {
  const { parseDesign } = await import('../src/utils/projectPages.js');
  assert.equal(parseDesign('not json at all'), null);
  assert.equal(parseDesign(null), null);
  assert.equal(parseDesign(undefined), null);
  assert.equal(parseDesign('"still a string"'), null);
});
