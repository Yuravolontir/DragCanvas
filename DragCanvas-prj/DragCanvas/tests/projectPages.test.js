import test from 'node:test';
import assert from 'node:assert/strict';
import { blankPageFrom, emptyPageFrom, pageSlugFromHref, syncSharedChrome } from '../src/utils/projectPages.js';

test('editor preview recognizes project-page links without hijacking external or anchor links', () => {
  assert.equal(pageSlugFromHref('/'), 'home');
  assert.equal(pageSlugFromHref('/about/'), 'about');
  assert.equal(pageSlugFromHref('/our-menu'), 'our-menu');
  assert.equal(pageSlugFromHref('#menu'), null);
  assert.equal(pageSlugFromHref('https://example.com'), null);
});

const page = (heroText) => ({
  ROOT: { nodes: ['nav', 'hero', 'footer'] },
  nav: { type: { resolvedName: 'NavbarElement' }, nodes: ['navText'], props: {} },
  navText: { type: { resolvedName: 'Text' }, nodes: [], props: { text: 'Shared nav' } },
  hero: { type: { resolvedName: 'Container' }, nodes: [], props: { text: heroText } },
  footer: { type: { resolvedName: 'Container' }, nodes: ['footerText'], custom: { displayName: 'Footer' }, props: {} },
  footerText: { type: { resolvedName: 'Text' }, nodes: [], props: { text: 'Shared footer' } },
});

test('a new page is visually blank except for shared navbar and footer', () => {
  const blank = blankPageFrom(page('Home hero'));
  assert.deepEqual(blank.ROOT.nodes, ['nav', 'footer']);
  assert.equal(blank.hero, undefined);
  assert.equal(blank.navText.props.text, 'Shared nav');
});

test('clearing a page removes every visible and linked child but keeps Craft root metadata', () => {
  const source = page('Home hero');
  source.ROOT.linkedNodes = { slot: 'hero' };
  source.ROOT.custom = { displayName: 'App' };
  const empty = emptyPageFrom(source);
  assert.deepEqual(Object.keys(empty), ['ROOT']);
  assert.deepEqual(empty.ROOT.nodes, []);
  assert.deepEqual(empty.ROOT.linkedNodes, {});
  assert.deepEqual(empty.ROOT.custom, { displayName: 'App' });
  assert.equal(empty.ROOT.isCanvas, true);
  assert.equal(empty.ROOT.type.resolvedName, 'Container');
  assert.equal(empty.ROOT.props.width, '800px');
  assert.equal(empty.ROOT.props.height, 'auto');
  assert.deepEqual(source.ROOT.nodes, ['nav', 'hero', 'footer']);
});

test('clearing a page drops the App container styling instead of carrying it over', () => {
  const source = page('Home hero');
  source.ROOT.props = {
    background: { r: 12, g: 12, b: 12, a: 1 },
    color: { r: 255, g: 255, b: 255, a: 1 },
    backgroundImage: 'https://example.com/hero.jpg',
    overlay: { r: 0, g: 0, b: 0, a: 0.45 },
    padding: ['80', '40', '80', '40'],
    margin: ['20', '0', '20', '0'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadow: 30,
    radius: 24,
    width: '100%',
    height: 'auto',
  };
  const { props } = emptyPageFrom(source).ROOT;
  assert.deepEqual(props.background, { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(props.color, { r: 0, g: 0, b: 0, a: 1 });
  assert.equal(props.backgroundImage, '');
  assert.equal(props.overlay.a, 0);
  assert.deepEqual(props.padding, ['0', '0', '0', '0']);
  assert.deepEqual(props.margin, ['0', '0', '0', '0']);
  assert.equal(props.flexDirection, 'column');
  assert.equal(props.alignItems, 'flex-start');
  assert.equal(props.justifyContent, 'flex-start');
  assert.equal(props.shadow, 0);
  assert.equal(props.radius, 0);
  assert.equal(props.width, '800px');
  assert.equal(props.height, 'auto');
});

test('cleared pages do not share mutable prop objects', () => {
  const first = emptyPageFrom(page('a')).ROOT.props;
  const second = emptyPageFrom(page('b')).ROOT.props;
  first.padding[0] = '64';
  first.background.r = 0;
  assert.deepEqual(second.padding, ['0', '0', '0', '0']);
  assert.equal(second.background.r, 255);
});

test('switching pages preserves their content while refreshing shared chrome', () => {
  const source = page('Home hero');
  source.navText.props.text = 'Updated navigation';
  const target = page('About hero');
  target.navText.props.text = 'Old navigation';
  const synced = syncSharedChrome(source, target);
  assert.equal(synced.hero.props.text, 'About hero');
  assert.equal(synced.navText.props.text, 'Updated navigation');
});
