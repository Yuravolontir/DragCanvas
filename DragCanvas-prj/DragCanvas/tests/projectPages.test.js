import test from 'node:test';
import assert from 'node:assert/strict';
import { blankPageFrom, pageSlugFromHref, syncSharedChrome } from '../src/utils/projectPages.js';

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

test('switching pages preserves their content while refreshing shared chrome', () => {
  const source = page('Home hero');
  source.navText.props.text = 'Updated navigation';
  const target = page('About hero');
  target.navText.props.text = 'Old navigation';
  const synced = syncSharedChrome(source, target);
  assert.equal(synced.hero.props.text, 'About hero');
  assert.equal(synced.navText.props.text, 'Updated navigation');
});
