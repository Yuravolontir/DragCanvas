import test from 'node:test';
import assert from 'node:assert/strict';
import { craftPageToSections, craftProjectToAiLayout } from '../src/utils/craftToAiLayout.js';

const page = text => ({
  ROOT: { nodes: ['hero'] },
  hero: { type: { resolvedName: 'Container' }, props: { backgroundColor: '#111' }, nodes: ['title'] },
  title: { type: { resolvedName: 'Heading' }, props: { text }, nodes: [] },
});

test('saved Craft nodes become an AI-refinable element tree', () => {
  const sections = craftPageToSections(page('Welcome'));
  assert.equal(sections[0].type, 'Container');
  assert.equal(sections[0].children[0].type, 'Heading');
  assert.equal(sections[0].children[0].props.text, 'Welcome');
});

test('the currently edited page wins over its last saved page snapshot', () => {
  const layout = craftProjectToAiLayout({
    currentSlug: 'about',
    pages: [
      { name: 'Home', slug: 'home', data: page('Home') },
      { name: 'About', slug: 'about', data: page('Old about') },
    ],
  }, page('Manually edited about'));
  assert.equal(layout.pages[0].sections[0].children[0].props.text, 'Home');
  assert.equal(layout.pages[1].sections[0].children[0].props.text, 'Manually edited about');
});
