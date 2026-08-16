/**
 * Regression tests for navigation in an exported site.
 *
 * The navigation bar always emitted its links, and no section in the document
 * ever carried an id, so every link in every published site pointed at an anchor
 * that did not exist. Clicking one did nothing, which is the complaint that
 * started this change.
 *
 * Two claims are worth holding onto, and they pull against each other: a link to
 * a real section must work, and a link to a section that is not there must stop
 * looking like a link. The second is the easy one to lose later - it is tempting
 * to "just emit the href" - so it is tested explicitly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const { exportToHtml } = await import('../src/utils/exportToHtml.js');

/** The flat node map Craft.js hands the exporter. */
function page({ links, anchors }) {
  const nodes = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['nav', ...anchors.map((_, i) => `s${i}`)] },
    nav: { type: { resolvedName: 'NavbarElement' }, props: { brand: 'Test', links }, nodes: [] },
  };
  anchors.forEach((anchor, i) => {
    nodes[`s${i}`] = { type: { resolvedName: 'Container' }, isCanvas: true, props: { anchor }, nodes: [] };
  });
  return nodes;
}

test('a section with an anchor gets an id to jump to', () => {
  const html = exportToHtml(page({ links: [], anchors: ['our-menu'] }), 'test');
  assert.match(html, /id="our-menu"/);
});

test('a link to a section that exists stays a link', () => {
  const html = exportToHtml(page({
    links: [{ text: 'Menu', href: '#our-menu' }],
    anchors: ['our-menu'],
  }), 'test');
  assert.match(html, /<a href="#our-menu">Menu<\/a>/);
});

test('a link to a section that does not exist is not a link', () => {
  const html = exportToHtml(page({
    links: [{ text: 'Pricing', href: '#pricing' }],
    anchors: ['our-menu'],
  }), 'test');

  assert.doesNotMatch(html, /href="#pricing"/, 'the dead href must be gone');
  assert.match(html, /<span class="dead">Pricing<\/span>/, 'the label must survive');
});

test('an external link is left alone', () => {
  const html = exportToHtml(page({
    links: [
      { text: 'Instagram', href: 'https://instagram.com/example' },
      { text: 'Email', href: 'mailto:hi@example.com' },
    ],
    anchors: [],
  }), 'test');

  assert.match(html, /href="https:\/\/instagram\.com\/example"/);
  assert.match(html, /href="mailto:hi@example\.com"/);
});

test('anchors from one export do not leak into the next', () => {
  // knownAnchors lives at module scope, so a page exported after one that had
  // an anchor could otherwise inherit it and resurrect a dead link.
  exportToHtml(page({ links: [], anchors: ['our-menu'] }), 'first');
  const second = exportToHtml(page({
    links: [{ text: 'Menu', href: '#our-menu' }],
    anchors: [],
  }), 'second');

  assert.doesNotMatch(second, /href="#our-menu"/);
});

test('the document scrolls rather than teleports', () => {
  const html = exportToHtml(page({ links: [], anchors: ['top'] }), 'test');
  assert.match(html, /scroll-behavior:\s*smooth/);
});
