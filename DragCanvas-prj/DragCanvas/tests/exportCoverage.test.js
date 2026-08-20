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
  ['Video', true, { sourceType: 'background', src: 'https://example.com/hero.mp4', poster: 'https://example.com/hero.jpg' }],
  ['BackgroundVideo', true, { src: 'https://example.com/loop.mp4', poster: 'https://example.com/p.jpg' }],
  ['Link', false, { text: 'Here', href: 'https://example.com' }],
  ['Carousel', false, { slides: [{ src: 'https://example.com/1.jpg', heading: 'One' }] }],
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

/**
 * Slides became an array, but six built templates, every saved project and every
 * live published site still carry src1..p3. If this goes red, those sites lost
 * their slides on the next publish.
 */
test('a carousel saved in the old three-prop shape still publishes', () => {
  const nodes = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['c'] },
    c: {
      type: { resolvedName: 'Carousel' }, isCanvas: false, nodes: [],
      props: {
        src1: 'https://example.com/1.jpg', heading1: 'One', label1: 'Featured', p1: 'First',
        src2: 'https://example.com/2.jpg', heading2: 'Two',
      },
    },
  };
  const html = exportToHtml(nodes, 'legacy');

  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-label="1 of 2"/, 'the first slide announces its position');
  assert.match(html, /aria-label="2 of 2"/, 'the second slide survived');
  assert.ok(!html.includes('3 of 2'), 'an empty third slot is not a slide');
  assert.match(html, /src="https:\/\/example\.com\/1\.jpg"/);
  assert.match(html, /alt="One"/, 'alt falls back to the heading');
  assert.match(html, /loading="lazy"/, 'off-screen slides are not fetched on load');
  assert.match(html, /<span class="badge">Featured<\/span>/);
});

test('button actions publish as working and safe links', () => {
  const nodes = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['button'] },
    button: { type: { resolvedName: 'Button' }, isCanvas: false, nodes: [], props: {
      text: 'Visit', action: 'url', actionValue: 'example.com', newTab: true,
    } },
  };
  const html = exportToHtml(nodes, 'button-action');
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
});

test('form appearance reaches the published form', () => {
  const nodes = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['form'] },
    form: { type: { resolvedName: 'Form' }, isCanvas: false, nodes: [], props: {
      fields: [{ label: 'Email', type: 'email' }],
      textColor: { r: 1, g: 2, b: 3, a: 1 },
      inputBackground: { r: 4, g: 5, b: 6, a: 1 },
      inputBorder: { r: 7, g: 8, b: 9, a: 1 },
    } },
  };
  const html = exportToHtml(nodes, 'form-colours');
  assert.match(html, /color: rgba\(1, 2, 3, 1\)/);
  assert.match(html, /background: rgba\(4, 5, 6, 1\)/);
  assert.match(html, /border: 1px solid rgba\(7, 8, 9, 1\)/);
});

test('responsive element overrides are emitted for tablet and mobile', () => {
  const data = {
    ROOT: {
      type: { resolvedName: 'Container' }, isCanvas: true, nodes: ['copy'], parent: null,
      props: { width: '100%', height: 'auto', padding: ['0', '0', '0', '0'], margin: ['0', '0', '0', '0'] },
    },
    copy: {
      type: { resolvedName: 'Text' }, isCanvas: false, nodes: [], parent: 'ROOT',
      props: {
        text: 'Responsive copy', width: '100%', height: 'auto',
        responsive: {
          tablet: { width: '80%' },
          mobile: { visible: false, margin: ['8', '4', '8', '4'] },
        },
      },
    },
  };
  const html = exportToHtml(data);
  assert.match(html, /@media \(max-width: 1024px\)/);
  assert.match(html, /width: 80%/);
  assert.match(html, /@media \(max-width: 768px\)/);
  assert.match(html, /display: none !important/);
  assert.match(html, /margin: 8px 4px 8px 4px/);
});
