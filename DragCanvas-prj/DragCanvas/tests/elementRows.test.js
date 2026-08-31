/**
 * The list elements, on both sides of the publish step.
 *
 * Nine elements moved from "alternating lines of text" to "a list of records",
 * and every one of them has live projects, built templates and generated pages
 * still holding the old shape. So each reader is tested against both shapes,
 * and the published markup is tested for the promises the new Properties panels
 * make: a member photo links, a logo links, a slide autoplays, a countdown with
 * a broken date does not print NaN.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countdownParts,
  countdownTarget,
  fromLocalInput,
  opensNewTab,
  readAccordionRows,
  readEngagementOptions,
  readLogoRows,
  readPricingRows,
  readProductRows,
  readStatRows,
  readTeamRows,
  readTimelineRows,
  safeHref,
  statDisplay,
  statDisplayAtProgress,
  toLocalInput,
} from '../src/utils/elementRows.js';
import { readSocialRows, socialHref, socialPlatform } from '../src/utils/socialPlatforms.js';
import { readSlides, slideInterval, slidesAutoplay, slidesPerView } from '../src/utils/carouselSlides.js';
import { exportToHtml } from '../src/utils/exportToHtml.js';

const page = (name, props) => ({
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['x'] },
  x: { type: { resolvedName: name }, isCanvas: false, props, nodes: [] },
});

/* ---------------------------------------------------------------- *
 * Reading both shapes
 * ---------------------------------------------------------------- */

test('an accordion reads the same whether it was saved as lines or as records', () => {
  const legacy = readAccordionRows({ items: ['Q one?', 'A one.', 'Q two?', 'A two.'] });
  assert.deepEqual(legacy, [
    { question: 'Q one?', answer: 'A one.' },
    { question: 'Q two?', answer: 'A two.' },
  ]);
  assert.deepEqual(readAccordionRows({ items: [{ question: 'Q one?', answer: 'A one.' }] }), [
    { question: 'Q one?', answer: 'A one.' },
  ]);
  // A question typed with no answer yet is still the author's work in progress.
  assert.deepEqual(readAccordionRows({ items: ['Half typed'] }), [{ question: 'Half typed', answer: '' }]);
  assert.deepEqual(readAccordionRows({}), []);
  assert.deepEqual(readAccordionRows({ items: 'not a list' }), []);
});

test('pricing keeps the old five-line tiers and the old featured index', () => {
  const legacy = readPricingRows({
    tiers: ['Starter', '$0', 'forever', 'Start', 'One site; Support', 'Studio', '$49', 'per month', 'Go', 'Ten sites'],
    featured: 2,
  });
  assert.equal(legacy.length, 2);
  assert.deepEqual(legacy[0].features, ['One site', 'Support']);
  assert.equal(legacy[0].featured, false);
  assert.equal(legacy[1].featured, true, 'the featured index still picks a tier out');

  const records = readPricingRows({
    tiers: [{ name: 'Studio', price: '$49', features: ['Ten sites'], featured: true, href: 'buy.example.com' }],
  });
  assert.equal(records[0].featured, true);
  assert.deepEqual(records[0].features, ['Ten sites']);
});

test('stats gain a prefix and a suffix without losing the old pairs', () => {
  assert.deepEqual(readStatRows({ items: ['1,200+', 'sites'] }), [
    { prefix: '', value: '1,200+', suffix: '', label: 'sites' },
  ]);
  const row = readStatRows({ items: [{ prefix: '$', value: '4', suffix: 'm', label: 'raised' }] })[0];
  assert.equal(statDisplay(row), '$4m');
});

test('team members, timeline steps, logos and products read both shapes', () => {
  assert.deepEqual(readTeamRows({ people: ['Dana', 'Baker', ''] }), [
    { name: 'Dana', role: 'Baker', photo: '', href: '' },
  ]);
  assert.deepEqual(readTimelineRows({ steps: ['1', 'Describe', 'One sentence'] }), [
    { marker: '1', title: 'Describe', detail: 'One sentence' },
  ]);
  // A logo line was either an address or a name, decided by how it started.
  assert.deepEqual(readLogoRows({ logos: ['https://example.com/a.svg', 'Northwind'] }), [
    { src: 'https://example.com/a.svg', label: '', href: '' },
    { src: '', label: 'Northwind', href: '' },
  ]);
  // The payment links were a second list that had to stay in the same order.
  assert.deepEqual(
    readProductRows({
      products: ['Kit', 'Everything needed', '29.00', ''],
      paymentLinks: ['https://buy.example.com/kit'],
    }),
    [{ name: 'Kit', description: 'Everything needed', price: '29.00', image: '', href: 'https://buy.example.com/kit' }]
  );
});

test('social rows work out their network when nothing recorded one', () => {
  const legacy = readSocialRows({ items: ['Instagram', 'https://instagram.com/x', 'Our shop', 'https://facebook.com/y'] });
  assert.equal(legacy[0].platform, 'instagram');
  assert.equal(legacy[1].platform, 'facebook', 'a custom label falls back to reading the address');
  assert.equal(legacy[1].label, 'Our shop', 'and the label the author wrote is kept');
  // Twitter became X; a row labelled either way gets the same mark.
  assert.equal(socialPlatform({ label: 'Twitter' }).id, 'x');
  assert.equal(socialPlatform({ href: 'https://example.com/page' }).id, 'website');
  assert.ok(legacy[0].icon.startsWith('M'), 'every row carries a drawable mark');
});

test('an email row links as mail and a script never becomes a link', () => {
  assert.equal(socialHref({ platform: 'email', href: 'hi@example.com' }), 'mailto:hi@example.com');
  assert.equal(socialHref({ platform: 'email', href: 'mailto:hi@example.com' }), 'mailto:hi@example.com');
  assert.equal(socialHref({ platform: 'instagram', href: 'instagram.com/x' }), 'https://instagram.com/x');
  assert.equal(socialHref({ platform: 'website', href: 'javascript:alert(1)' }), '');
  assert.equal(socialHref({ platform: 'website', href: '' }), '');
});

test('a link is only ever an ordinary web address', () => {
  assert.equal(safeHref('example.com/x'), 'https://example.com/x');
  assert.equal(safeHref('https://example.com/x'), 'https://example.com/x');
  assert.equal(safeHref('hello@example.com'), 'mailto:hello@example.com');
  assert.equal(safeHref('#pricing'), '#pricing');
  assert.equal(safeHref('/about/'), '/about/');
  assert.equal(safeHref('javascript:alert(1)'), '');
  assert.equal(safeHref('data:text/html,<script>'), '');
  assert.equal(safeHref(''), '');
  assert.equal(safeHref(null), '');
  assert.equal(opensNewTab('https://example.com'), true);
  assert.equal(opensNewTab('#pricing'), false);
});

test('malformed engagement options render as nothing rather than as a crash', () => {
  // Each of these has been in saved data, and each of them used to throw during
  // render, which takes the page down rather than just the element.
  assert.deepEqual(readEngagementOptions({ options: 'Yes,No' }), []);
  assert.deepEqual(readEngagementOptions({ options: null }), []);
  assert.deepEqual(readEngagementOptions({}), []);
  assert.deepEqual(readEngagementOptions({ options: ['Yes', '', null, 'No'] }), ['Yes', 'No']);
  assert.deepEqual(readEngagementOptions({ options: [{ label: 'Yes' }] }), ['Yes']);
});

/* ---------------------------------------------------------------- *
 * Countdown
 * ---------------------------------------------------------------- */

test('a countdown never produces NaN, whatever is stored in it', () => {
  assert.equal(countdownTarget(''), null);
  assert.equal(countdownTarget('next friday'), null);
  assert.equal(countdownTarget(undefined), null);
  assert.equal(countdownTarget('2030-01-01T00:00:00Z'), Date.parse('2030-01-01T00:00:00Z'));
  // A space where the T should be, which people type and some browsers refuse.
  assert.equal(countdownTarget('2030-01-01 00:00:00Z'), Date.parse('2030-01-01T00:00:00Z'));

  const none = countdownParts(null);
  assert.deepEqual([none.days, none.hours, none.minutes, none.seconds], [0, 0, 0, 0]);
  assert.equal(none.expired, false, 'no deadline is not an expired deadline');

  const past = countdownParts(Date.parse('2000-01-01T00:00:00Z'));
  assert.equal(past.expired, true);
  assert.deepEqual([past.days, past.hours, past.minutes, past.seconds], [0, 0, 0, 0]);

  const future = countdownParts(Date.parse('2030-01-03T00:00:00Z'), Date.parse('2030-01-01T01:02:03Z'));
  assert.equal(future.days, 1);
  assert.equal(future.hours, 22);
});

test('the date picker round-trips through the browser clock', () => {
  const iso = fromLocalInput('2030-06-01T09:30');
  assert.equal(toLocalInput(iso), '2030-06-01T09:30');
  assert.equal(fromLocalInput(''), '');
  assert.equal(fromLocalInput('not a date'), '');
  assert.equal(toLocalInput('nonsense'), '', 'an unreadable value leaves the field blank, not at 1970');
});

/* ---------------------------------------------------------------- *
 * Carousel behaviour
 * ---------------------------------------------------------------- */

test('autoplay is on only when it was really switched on', () => {
  assert.equal(slidesAutoplay({ autoplay: true }), true);
  assert.equal(slidesAutoplay({ autoplay: 'true' }), true);
  // The bug: a string is truthy, so a carousel switched off played anyway.
  assert.equal(slidesAutoplay({ autoplay: 'false' }), false);
  assert.equal(slidesAutoplay({}), false);

  assert.equal(slideInterval({ interval: 3000 }), 3000);
  assert.equal(slideInterval({ interval: 10 }), 5000, 'a tenth of a second is not a slide');
  assert.equal(slideInterval({ interval: 'soon' }), 5000);

  // One number is set in the panel; the narrower screens follow it.
  assert.deepEqual(slidesPerView({ perView: 4 }), { desktop: 4, tablet: 2, mobile: 1 });
  assert.deepEqual(slidesPerView({}), { desktop: 1, tablet: 1, mobile: 1 });
  assert.deepEqual(slidesPerView({ perView: 'x' }), { desktop: 1, tablet: 1, mobile: 1 });
});

test('a carousel told to play publishes a timer, and one told not to does not', () => {
  const slides = [
    { src: 'https://example.com/1.jpg', heading: 'One' },
    { src: 'https://example.com/2.jpg', heading: 'Two' },
  ];
  const playing = exportToHtml(page('Carousel', { slides, autoplay: true, interval: 3000 }), 'gallery');
  assert.match(playing, /setInterval\(function \(\) \{ go\(1\); \}, 3000\)/);

  const still = exportToHtml(page('Carousel', { slides, autoplay: 'false' }), 'gallery');
  assert.ok(!still.includes('setInterval(function () { go(1);'), 'a carousel that is off must not carry a timer');
});

test('a slide with a link publishes as a link with rel protection', () => {
  const html = exportToHtml(
    page('Carousel', { slides: [{ src: 'https://example.com/1.jpg', heading: 'One', href: 'example.com/summer' }] }),
    'gallery'
  );
  assert.match(html, /<a href="https:\/\/example\.com\/summer" target="_blank" rel="noopener noreferrer">/);
  assert.deepEqual(readSlides({ slides: [{ src: 'a.jpg', href: 'b' }] })[0].href, 'b');
});

/* ---------------------------------------------------------------- *
 * The published page
 * ---------------------------------------------------------------- */

test('a team member with a link publishes a clickable portrait', () => {
  const html = exportToHtml(
    page('TeamGrid', {
      people: [{ name: 'Dana Levi', role: 'Baker', photo: 'https://example.com/dana.jpg', href: 'linkedin.com/in/dana' }],
    }),
    'team'
  );
  assert.match(html, /<a href="https:\/\/linkedin\.com\/in\/dana" target="_blank" rel="noopener noreferrer">/);
  assert.match(html, /alt="Dana Levi"/, 'the photo describes who it shows');

  const plain = exportToHtml(page('TeamGrid', { people: [{ name: 'Dana', role: 'Baker' }] }), 'team');
  assert.ok(!plain.includes('<a href'), 'a member with no link gets no empty link');
  assert.match(plain, /class="initial">D</, 'no photo falls back to the initial');
});

test('a logo strip publishes wordmarks, images and links from one list', () => {
  const html = exportToHtml(
    page('LogoStrip', {
      logos: [
        { src: '', label: 'Northwind', href: 'northwind.example.com' },
        { src: 'https://example.com/a.svg', label: 'Kettle', href: '' },
      ],
    }),
    'clients'
  );
  assert.match(html, /<a href="https:\/\/northwind\.example\.com\/"[^>]*rel="noopener noreferrer"><span>Northwind<\/span><\/a>/);
  assert.match(html, /<img src="https:\/\/example\.com\/a\.svg" alt="Kettle"/);
});

test('a pricing plan with a checkout link publishes a working button', () => {
  const html = exportToHtml(
    page('Pricing', {
      tiers: [
        { name: 'Studio', price: '$49', period: 'per month', cta: 'Choose Studio', href: 'buy.example.com/studio', features: ['Ten sites'], featured: true },
        { name: 'Free', price: '$0', period: 'forever', cta: 'Start', href: '', features: ['One site'], featured: false },
      ],
    }),
    'plans'
  );
  assert.match(html, /<a href="https:\/\/buy\.example\.com\/studio" target="_blank" rel="noopener noreferrer"><span>Choose Studio<\/span><\/a>/);
  assert.match(html, /<span class="cta"><span>Start<\/span><\/span>/, 'a plan with no link is not given a dead one');
  assert.match(html, /class="tier featured"/);
  assert.match(html, /<li>Ten sites<\/li>/);
});

test('stats publish their prefix and suffix around the figure', () => {
  const html = exportToHtml(
    page('Stats', { animation: 'countUp', items: [{ prefix: '$', value: '1,200', suffix: '+', label: 'raised' }] }),
    'numbers'
  );
  assert.match(html, /<span class="value"[^>]*>\$1,200\+<\/span>/);
  assert.match(html, /<span class="label">raised<\/span>/);
  assert.match(html, /IntersectionObserver/);
  assert.match(html, /prefers-reduced-motion/);
});

test('stats count numeric values without losing their prefix, grouping or decimals', () => {
  assert.equal(statDisplayAtProgress({ prefix: '$', value: '1,200', suffix: '+' }, 0.5), '$600+');
  assert.equal(statDisplayAtProgress({ prefix: '', value: '99.9', suffix: '%' }, 1), '99.9%');
  assert.equal(statDisplayAtProgress({ prefix: '', value: '1,200+', suffix: '' }, 0.5), '600+');
  assert.equal(statDisplayAtProgress({ prefix: '', value: '4 min', suffix: '' }, 0.5), '2 min');
  assert.equal(statDisplayAtProgress({ prefix: '', value: '24/7', suffix: '' }, 0.25), '24/7');
});

test('stats count their figures unless they are told not to', () => {
  const counting = exportToHtml(page('Stats', { items: [{ value: '12', label: 'offices' }] }), 'counting');
  const still = exportToHtml(page('Stats', { countUp: false, items: [{ value: '12', label: 'offices' }] }), 'still');
  assert.match(counting, /duration = 1000/);
  assert.doesNotMatch(still, /duration = 1000/);
});

test('stats count again on every return only when the block replays', () => {
  const once = exportToHtml(page('Stats', { items: [{ value: '12', label: 'offices' }] }), 'once');
  const again = exportToHtml(page('Stats', { animationRepeat: true, items: [{ value: '12', label: 'offices' }] }), 'again');
  assert.match(once, /arrive\.disconnect\(\)/);
  assert.doesNotMatch(once, /leave\.observe\(root\)/);
  assert.doesNotMatch(again, /arrive\.disconnect\(\)/);
  assert.match(again, /leave\.observe\(root\)/);
});

test('a stat block that only counts leaves the box entrance alone', () => {
  const html = exportToHtml(page('Stats', { items: [{ value: '12', label: 'offices' }] }), 'plain');
  // Counting is about the figures. The block arrives through the shared
  // animation like every other element, or not at all.
  assert.doesNotMatch(html, /class="stats-\d+"[^>]*data-dc-anim/);
});

test('social links publish as inline marks that open safely', () => {
  const html = exportToHtml(
    page('SocialLinks', {
      items: [
        { platform: 'instagram', label: 'Instagram', href: 'https://instagram.com/x' },
        { platform: 'email', label: 'Email us', href: 'hi@example.com' },
        { platform: 'website', label: 'Nowhere', href: 'javascript:alert(1)' },
      ],
    }),
    'follow'
  );
  assert.match(html, /aria-label="Instagram" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /<svg viewBox="0 0 24 24"/, 'the mark is inlined, not fetched');
  assert.match(html, /href="mailto:hi@example\.com"/);
  assert.ok(!html.includes('javascript:'), 'a script never becomes a social link');
});

test('an accordion saved as records still publishes its FAQ markup and JSON-LD', () => {
  const html = exportToHtml(
    page('Accordion', { items: [{ question: 'How long?', answer: 'Two days.' }] }),
    'faq'
  );
  assert.match(html, /<summary>How long\?<\/summary>/);
  const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  assert.ok(json);
  assert.equal(JSON.parse(json)['@graph'][0].mainEntity[0].acceptedAnswer.text, 'Two days.');
});

test('an engagement element with unusable saved data still publishes', () => {
  // The crash this guards: options held a string, and the converter called
  // slice(0, 20) on it and then map, so publishing threw.
  const html = exportToHtml(page('Engagement', { mode: 'poll', options: 'Yes,No', heading: 'Pick one' }), 'poll');
  assert.match(html, /class="engagement-\d+"/);
  assert.match(html, /Pick one/);
  assert.ok(!html.includes('<button data-option='), 'nothing usable in the list means no option buttons');

  const nonsense = exportToHtml(page('Engagement', { mode: 'made up', options: null }), 'poll');
  assert.match(nonsense, /Your opinion/, 'an unknown kind falls back to the review board');
});

test('a countdown with an unreadable date publishes a stopped counter, not NaN', () => {
  const broken = exportToHtml(page('Countdown', { target: 'next friday', label: 'Ends in' }), 'sale');
  assert.ok(!broken.includes('NaN'));
  assert.match(broken, /target=null/);

  const real = exportToHtml(page('Countdown', { target: '2030-01-01T00:00:00Z' }), 'sale');
  assert.match(real, new RegExp(`target=${Date.parse('2030-01-01T00:00:00Z')}`));
});

test('a product with no checkout link still publishes as a card', () => {
  const html = exportToHtml(
    page('ProductCatalog', {
      products: [
        { name: 'Kit', description: 'All of it', price: '29.00', image: '', href: 'buy.example.com/kit' },
        { name: 'Workshop', description: 'An hour', price: '79.00', image: '', href: '' },
      ],
      currency: 'usd',
    }),
    'shop'
  );
  assert.match(html, /<h3>Workshop<\/h3>/);
  assert.match(html, /href="https:\/\/buy\.example\.com\/kit" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /79\.00 USD/);
});
