import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLayout } from '../utils/ai.helpers.js';

test('AI multipage output is normalized without merging page content', () => {
  const result = normalizeLayout({ pages: [
    { name: 'Home', slug: 'home', sections: [{ type: 'Container', props: { anchor: 'hero' }, children: [] }] },
    { name: 'About us', slug: 'About Us', sections: [{ type: 'Container', props: { anchor: 'story' }, children: [] }] },
  ] });
  assert.equal(result.pages.length, 2);
  assert.equal(result.pages[0].slug, 'home');
  assert.equal(result.pages[1].slug, 'about-us');
  assert.equal(result.pages[0].sections[0].props.anchor, 'hero');
  assert.equal(result.pages[1].sections[0].props.anchor, 'story');
});

test('AI page slugs are unique and Home remains canonical', () => {
  const result = normalizeLayout({ pages: [
    { name: 'Start', slug: 'wrong', sections: [{ type: 'Container', props: {}, children: [] }] },
    { name: 'Home duplicate', slug: 'home', sections: [{ type: 'Container', props: {}, children: [] }] },
    { name: 'Home duplicate', slug: 'home', sections: [{ type: 'Container', props: {}, children: [] }] },
  ] });
  assert.deepEqual(result.pages.map((page) => page.slug), ['home', 'page-2', 'page-3']);
});

test('legacy single-page AI output stays supported', () => {
  const result = normalizeLayout({ sections: [{ type: 'Heading', props: { text: 'Hello' } }] });
  assert.equal(result.sections.length, 1);
  assert.equal(result.sections[0].type, 'Heading');
});
