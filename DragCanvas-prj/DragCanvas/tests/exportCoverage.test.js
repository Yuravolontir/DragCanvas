/**
 * Every element the editor can produce must survive being published.
 *
 * An element needs five registrations to work - component, settings, barrel,
 * resolver, converter - and the converter is the one whose absence is invisible
 * until somebody publishes and finds their block missing. Nothing in the editor
 * complains; the element simply is not in the output.
 *
 * So this walks the resolver's list and asserts each name produces markup. It is
 * the cheapest possible guard, and it is aimed squarely at the mistake this change
 * is most likely to make seventeen times.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const { exportToHtml } = await import('../src/utils/exportToHtml.js');

/**
 * Every element the editor registers, with props realistic enough to render.
 *
 * Empty props are not a fair test: a Video with no URL has nothing to show and is
 * right to emit nothing. What is being checked is that an element given sensible
 * content reaches the page - not that it copes with being given nothing.
 */
const ELEMENTS = [
  ['Container', true, {}],
  ['Text', false, { text: 'Body copy' }],
  ['Heading', false, { text: 'Title', level: '2' }],
  ['Button', false, { text: 'Go' }],
  ['Image', false, { src: 'https://example.com/a.jpg' }],
  ['Video', false, { sourceType: 'url', videoUrl: 'https://example.com/a.mp4' }],
  ['Link', false, { text: 'Here', href: 'https://example.com' }],
  ['Carousel', false, { src1: 'https://example.com/1.jpg', heading1: 'One' }],
  ['Map', false, { lat: 32.0853, lng: 34.7818, label: 'Tel Aviv' }],
  ['Form', false, { fields: [{ label: 'Name', type: 'text' }], submitText: 'Send' }],
  ['NavbarElement', false, { brand: 'Brand', links: [{ text: 'Home', href: '#' }] }],
  ['Columns', true, { count: '3' }],
  ['Spacer', false, { height: '48' }],
  ['Divider', false, { thickness: '1' }],
  ['List', false, { items: ['One', 'Two'] }],
  ['Quote', false, { text: 'A sentence' }],
  ['Icon', false, { name: 'bolt' }],
  ['Badge', false, { text: 'New' }],
  ['Accordion', false, { items: ['Q?', 'A.'] }],
  ['Pricing', false, { tiers: ['Free', '0', 'forever', 'Start', 'One site'], featured: 1 }],
  ['Testimonial', false, { quote: 'Good', author: 'Dana', role: 'Owner' }],
  ['Stats', false, { items: ['1,200', 'sites'] }],
  ['TeamGrid', false, { people: ['Dana', 'Baker', ''] }],
  ['Timeline', false, { steps: ['1', 'Describe', 'One sentence'] }],
  ['CTABanner', false, { title: 'Ready?', cta: 'Start' }],
  ['LogoStrip', false, { logos: ['https://example.com/a.svg'] }],
  ['SocialLinks', false, { items: ['Instagram', 'https://instagram.com/'] }],
];

test('every registered element produces markup when published', () => {
  const missing = [];

  for (const [name, isCanvas, props] of ELEMENTS) {
    const nodes = {
      ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['x'] },
      x: { type: { resolvedName: name }, isCanvas, props, nodes: [] },
    };

    let html = '';
    try {
      html = exportToHtml(nodes, 'test');
    } catch (error) {
      missing.push(`${name}: threw ${error.message}`);
      continue;
    }

    // Every converter generates a class named after itself, so its presence is
    // proof the converter ran rather than the node being skipped. The wrapping
    // ROOT container is always there, which is why a length check would not do.
    const own = name.toLowerCase().replace('element', '');
    const body = html.slice(html.indexOf('<body>'), html.indexOf('</body>'));

    if (!new RegExp(`class="${own}-\\d`).test(body) && !body.includes(`<${own}`)) {
      missing.push(`${name}: nothing of it reached the page`);
    }
  }

  assert.deepEqual(missing, [], 'these elements have no converter and vanish on publish');
});
