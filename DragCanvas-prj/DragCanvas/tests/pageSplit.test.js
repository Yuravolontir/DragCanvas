/**
 * A whole site that arrived as one page.
 *
 * Asked for real page links the model writes them correctly - /about/,
 * /classes/, /contact/ - and then keeps writing, so About, Classes and Contact
 * arrive as more sections of the home page: one enormous page carrying four
 * navbars and four footers, whose links point at pages that do not exist. Every
 * site then looks the same, because what you are looking at is all of it at once.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { splitConcatenatedPages, promoteHeroToVideo, anchorNavLinks } from '../utils/ai.helpers.js';
import { contrastRatio } from '../src/utils/readableInk.js';
import { hasVideoHero } from '../features/ai/ai.ctrl.js';

const navbar = () => ({ type: 'NavbarElement', props: { variant: 'dark', brand: 'BMX School' }, children: [] });
const heading = (text) => ({ type: 'Heading', props: { text, fontSize: '32' }, children: [] });
const band = (...kids) => ({ type: 'Container', props: {}, children: kids });

/** The exact shape a real generation produced: four pages in one. */
const concatenated = () => ({
    sections: [
        navbar(),
        band(heading('Master the Ride')),
        band(heading('BMX School © 2024')),
        navbar(),
        band(heading('About Our BMX School')),
        navbar(),
        band(heading('Our BMX Class Offerings')),
        navbar(),
        band(heading('Get in Touch with BMX School')),
    ],
});

test('four navbars in one page become four pages', () => {
    const out = splitConcatenatedPages(concatenated());
    assert.equal(out.pages.length, 4);
    assert.deepEqual(out.pages.map(p => p.slug), ['home', 'about-our-bmx-school', 'our-bmx-class-offerings', 'get-in-touch-with-bmx-school']);
    assert.equal(out.pages[0].name, 'Home');
    assert.equal(out.pages[1].name, 'About Our BMX School');
});

test('each page keeps exactly one navbar, and nothing is dropped', () => {
    const before = concatenated();
    const out = splitConcatenatedPages(before);

    const count = (nodes) => (nodes || []).filter(s => s.type === 'NavbarElement').length;
    for (const page of out.pages) assert.equal(count(page.sections), 1, page.slug);

    const total = out.pages.reduce((n, p) => n + p.sections.length, 0);
    assert.equal(total, before.sections.length, 'every section survives the cut');
});

test('an ordinary single-page site is left exactly as it was', () => {
    const one = { sections: [navbar(), band(heading('Welcome'))] };
    assert.equal(splitConcatenatedPages(one), one, 'same object, untouched');
});

test('a layout that already has real pages is not re-cut', () => {
    const already = { pages: [{ name: 'Home', slug: 'home', sections: [navbar()] }, { name: 'About', slug: 'about', sections: [navbar()] }] };
    assert.equal(splitConcatenatedPages(already), already);
});

test('a single navbar is not evidence of concatenation', () => {
    // One navigation bar is just a page with a navbar. Cutting there would
    // turn every ordinary site into two.
    const one = { sections: [band(heading('Announcement')), navbar(), band(heading('More'))] };
    assert.equal(splitConcatenatedPages(one), one, 'left exactly as it was');
});

test('anything before the first navbar opens the first page', () => {
    const out = splitConcatenatedPages({
        sections: [band(heading('Announcement')), navbar(), band(heading('Home')), navbar(), band(heading('About Us'))],
    });
    assert.equal(out.pages.length, 3);
    assert.equal(out.pages[0].sections.length, 1, 'the banner is its own opening');
    assert.equal(out.pages[2].name, 'About Us');
});

// ---------- the hero, once the pages are right ----------

test('the video goes behind the hero, not behind the navigation', () => {
    const layout = splitConcatenatedPages(concatenated());
    assert.equal(promoteHeroToVideo(layout, 'BMX school'), true);

    const [nav, hero] = layout.pages[0].sections;
    assert.equal(nav.type, 'NavbarElement', 'the navbar is left alone');

    const [video] = hero.children;
    assert.equal(video.type, 'Video');
    assert.equal(video.props.sourceType, 'background');
    assert.equal(video.children[0].props.text, 'Master the Ride', 'the headline stays in front');
    assert.equal(hasVideoHero(layout), true);
});

test('a hero with an ordinary image uses that image as the poster', () => {
    const photo = { type: 'Image', props: { src: 'https://example.com/rider.png' }, children: [] };
    const layout = { sections: [navbar(), band(heading('Ride'), photo)] };
    promoteHeroToVideo(layout, 'BMX');

    assert.equal(layout.sections[1].children[0].props.poster, 'https://example.com/rider.png');
});

test('a hero with no picture at all still gets its clip', () => {
    const layout = { sections: [navbar(), band(heading('Words only'))] };
    assert.equal(promoteHeroToVideo(layout, 'BMX'), true);
    assert.match(layout.sections[1].children[0].props.src, /^https:\/\/videos\.pexels\.com\//);
});

// ---------- what the model paints over the footage ----------

test('the band in front of the video stops painting over it', () => {
    // A Container the model gave no background to renders the opaque white in
    // its defaultProps, so it covered the clip completely.
    const band = { type: 'Container', props: {}, children: [heading('Master the Art of BMX')] };
    const layout = { sections: [navbar(), { type: 'Container', props: {}, children: [band] }] };
    promoteHeroToVideo(layout, 'BMX');

    const video = layout.sections[1].children[0];
    assert.equal(video.type, 'Video');
    assert.equal(video.children[0].props.background.a, 0, 'transparent, or the footage is hidden');
});

test('type over the footage is set to ink that reads on a scrim', () => {
    const band = { type: 'Container', props: {}, children: [{ type: 'Heading', props: { text: 'Hi', color: { r: 20, g: 20, b: 20, a: 1 } }, children: [] }] };
    const layout = { sections: [navbar(), { type: 'Container', props: {}, children: [band] }] };
    promoteHeroToVideo(layout, 'BMX');

    const ink = layout.sections[1].children[0].children[0].children[0].props.color;
    assert.ok(contrastRatio(ink, { r: 0, g: 0, b: 0, a: 1 }) >= 4.5, 'must read against a dark scrim');
});

// ---------- navigation that points at pages nobody generated ----------

test('a one-page site gets anchors, not links to pages that do not exist', () => {
    const nav = { type: 'NavbarElement', props: { links: [
        { text: 'Home', href: '/' },
        { text: 'About Us', href: '/about-us/' },
        { text: 'Classes', href: '/classes/' },
    ] }, children: [] };
    anchorNavLinks({ sections: [nav] });

    assert.deepEqual(nav.props.links.map(l => l.href), ['#home', '#about-us', '#classes']);
});

test('a real multipage site keeps its real links', () => {
    const nav = { type: 'NavbarElement', props: { links: [{ text: 'About', href: '/about/' }] }, children: [] };
    const layout = { pages: [{ name: 'Home', slug: 'home', sections: [nav] }] };
    anchorNavLinks(layout);

    assert.equal(nav.props.links[0].href, '/about/', 'these pages exist');
});

test('an anchor the model already wrote is left alone', () => {
    const nav = { type: 'NavbarElement', props: { links: [{ text: 'Pricing', href: '#pricing' }] }, children: [] };
    anchorNavLinks({ sections: [nav] });
    assert.equal(nav.props.links[0].href, '#pricing');
});

// ---------- the bar that lives inside the opening section ----------

test('a hero carrying the navbar is still a hero', () => {
    // The model often puts the bar inside the opening section. Treating that as
    // navigation skipped the only hero on the page and put the video behind the
    // row of feature cards that came next.
    const hero = { type: 'Container', props: {}, children: [navbar(), heading('Your Vision. Our Code.')] };
    const cards = { type: 'Container', props: {}, children: [heading('Our Core Competencies')] };
    const layout = { sections: [hero, cards] };

    assert.equal(promoteHeroToVideo(layout, 'web agency'), true);
    assert.equal(layout.sections[1].children[0].type, 'Heading', 'the cards are left alone');

    const video = hero.children.find(c => c.type === 'Video');
    assert.ok(video, 'the opening section got the footage');
    assert.equal(video.children[0].props.text, 'Your Vision. Our Code.');
});

test('the navigation stays in front of the footage, not behind it', () => {
    const hero = { type: 'Container', props: {}, children: [navbar(), heading('Words')] };
    promoteHeroToVideo({ sections: [hero] }, 'anything');

    assert.equal(hero.children[0].type, 'NavbarElement', 'the bar is above the video, still clickable');
    assert.equal(hero.children[1].type, 'Video');
});

test('a section that is only the navigation is still skipped', () => {
    const layout = { sections: [navbar(), { type: 'Container', props: {}, children: [heading('Real hero')] }] };
    promoteHeroToVideo(layout, 'x');

    assert.equal(layout.sections[0].type, 'NavbarElement', 'untouched');
    assert.equal(layout.sections[1].children[0].type, 'Video');
});
