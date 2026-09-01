/**
 * The bar every visitor meets first, pointed at things that exist.
 *
 * NavbarElement's defaults are a brand reading "Brand" and links to #home,
 * #features and #pricing. They are right for somebody dragging a navbar onto a
 * blank canvas and wrong for every generated page: the model often writes the
 * element without its contents, the defaults fill the gap, and the site ships
 * with a bar whose every link goes nowhere and whose name is the word "Brand".
 *
 * Nothing could see it, either. Normalisation reads the layout, and the layout
 * says nothing at all in the place a default is about to appear - the same
 * shape of fault as the container that published white because its background
 * was unset.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { anchorNavLinks } from '../utils/ai.helpers.js';

const navbar = (props = {}) => ({ type: 'NavbarElement', props, children: [] });
const section = (anchor, heading) => ({
  type: 'Container',
  props: { anchor },
  children: heading ? [{ type: 'Heading', props: { text: heading }, children: [] }] : [],
});
const hrefs = (node) => node.props.links.map((link) => link.href);

// ---------- the case that was reported ----------

test('a multi-page navbar points at the pages, not at nothing', () => {
  // This returned immediately for anything with pages, so a multi-page site
  // kept all three dead anchors and nobody noticed until a published site had
  // navigation that did not navigate.
  const nav = navbar();
  anchorNavLinks({ pages: [
    { name: 'Home', slug: 'home', sections: [nav] },
    { name: 'Games', slug: 'games', sections: [] },
    { name: 'About', slug: 'about', sections: [] },
  ] }, 'gaming portal');

  assert.deepEqual(hrefs(nav), ['/', '/games/', '/about/']);
  assert.deepEqual(nav.props.links.map((l) => l.text), ['Home', 'Games', 'About']);
});

test('a navbar left unnamed does not greet anybody with "Brand"', () => {
  const nav = navbar();
  anchorNavLinks({ pages: [{ name: 'Home', slug: 'home', sections: [nav] }] }, 'gaming portal');
  assert.equal(nav.props.brand, 'Gaming Portal');
});

test('a name the model chose is kept', () => {
  const nav = navbar({ brand: 'Wanderlust Adventures' });
  anchorNavLinks({ pages: [{ name: 'Home', slug: 'home', sections: [nav] }] }, 'travel agency');
  assert.equal(nav.props.brand, 'Wanderlust Adventures');
});

// ---------- the single page it always handled ----------

test('a single-page navbar still points at its own sections', () => {
  const nav = navbar();
  anchorNavLinks({ sections: [
    nav,
    section('hero', 'Level Up'),
    section('features', 'What You Get'),
    section('pricing', 'Plans'),
  ] }, 'gaming portal');

  assert.deepEqual(hrefs(nav), ['#hero', '#features', '#pricing']);
});

test('the footer is not a destination', () => {
  // Reachable by scrolling, and a tab for it is a tab wasted.
  const nav = navbar();
  anchorNavLinks({ sections: [nav, section('hero', 'Top'), section('about', 'Us'), section('footer')] }, 'x');
  assert.ok(!hrefs(nav).includes('#footer'));
});

test('links the model wrote are kept when they lead somewhere', () => {
  const nav = navbar({ links: [
    { text: 'Start', href: '#hero' },
    { text: 'Plans', href: '#pricing' },
  ] });
  anchorNavLinks({ sections: [nav, section('hero', 'Top'), section('pricing', 'Plans')] }, 'x');
  assert.deepEqual(nav.props.links.map((l) => l.text), ['Start', 'Plans'], 'its wording is better than ours');
});

test('links that lead nowhere are replaced even when the model wrote them', () => {
  const nav = navbar({ links: [
    { text: 'Home', href: '#home' },
    { text: 'Features', href: '#features' },
    { text: 'Pricing', href: '#pricing' },
  ] });
  anchorNavLinks({ sections: [nav, section('hero', 'Top'), section('about', 'Us')] }, 'x');
  assert.deepEqual(hrefs(nav), ['#hero', '#about']);
});

// ---------- restraint ----------

test('a bar does not wrap: five destinations at most', () => {
  const nav = navbar();
  const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name) => section(name, name.toUpperCase()));
  anchorNavLinks({ sections: [nav, ...many] }, 'x');
  assert.equal(nav.props.links.length, 5);
});

test('a navbar nested inside a section is found', () => {
  const nav = navbar();
  anchorNavLinks({ pages: [{ name: 'Home', slug: 'home', sections: [
    { type: 'Container', props: {}, children: [nav] },
  ] }] }, 'shop');
  assert.deepEqual(hrefs(nav), ['/']);
});

test('a layout with no navbar and no sections is left alone', () => {
  assert.doesNotThrow(() => anchorNavLinks({}, 'x'));
  assert.doesNotThrow(() => anchorNavLinks({ sections: null }, 'x'));
  assert.doesNotThrow(() => anchorNavLinks(null, 'x'));
});
