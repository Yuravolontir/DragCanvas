/**
 * The colour repair that runs over every generated layout.
 *
 * The prompt asks for readable contrast in prose and nothing used to check it,
 * so a heading in the palette's accent on the palette's light ground shipped
 * below the WCAG floor - in all ten palettes we offer. These cases are the ones
 * that made the repair worth having, written against the real palette values
 * rather than invented colours.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { repairContrast, normalizeLayout } from '../utils/ai.helpers.js';
import { contrastRatio } from '../src/utils/readableInk.js';

/* Real values from features/ai/prompt/design.presets.js */
const MIDNIGHT_LIGHT = { r: 245, g: 245, b: 250, a: 1 };
const MIDNIGHT_DARK = { r: 18, g: 18, b: 28, a: 1 };
const MIDNIGHT_ACCENT = { r: 99, g: 102, b: 241, a: 1 };
const ESPRESSO_CREAM = { r: 247, g: 242, b: 235, a: 1 };

const section = (props, children) => ({ type: 'Container', props, children });
const layoutOf = (...sections) => ({ sections });

/** The colour a node's prop ended up with after the repair. */
const colourOf = (node, prop = 'color') => node.props[prop];

// ---------- the case the repair exists for ----------

test('cream text on a cream container is repaired', () => {
    const heading = { type: 'Heading', props: { text: 'Fresh today', fontSize: '18', color: { ...ESPRESSO_CREAM } }, children: [] };
    repairContrast(layoutOf(section({ background: { ...ESPRESSO_CREAM } }, [heading])));

    const ink = colourOf(heading);
    assert.notDeepEqual(ink, ESPRESSO_CREAM, 'cream on cream must not survive');
    assert.ok(contrastRatio(ink, ESPRESSO_CREAM) >= 4.5, 'the replacement must actually read');
});

test('the same cream text on a dark container is left alone', () => {
    const heading = { type: 'Heading', props: { text: 'Fresh today', fontSize: '18', color: { ...ESPRESSO_CREAM } }, children: [] };
    repairContrast(layoutOf(section({ background: { ...MIDNIGHT_DARK } }, [heading])));

    assert.deepEqual(colourOf(heading), ESPRESSO_CREAM, 'readable text must keep the colour the model chose');
});

// ---------- the size rule ----------

test('accent on a large heading survives, accent on body text does not', () => {
    // 4.11:1 in this palette - above the 3:1 floor for large text, below 4.5:1.
    const big = { type: 'Heading', props: { text: 'Ship faster', fontSize: '44', color: { ...MIDNIGHT_ACCENT } }, children: [] };
    const small = { type: 'Text', props: { text: 'A longer sentence of body copy.', fontSize: '16', color: { ...MIDNIGHT_ACCENT } }, children: [] };

    repairContrast(layoutOf(section({ background: { ...MIDNIGHT_LIGHT } }, [big, small])));

    assert.deepEqual(colourOf(big), MIDNIGHT_ACCENT, 'a 44px heading clears the large-text floor');
    assert.notDeepEqual(colourOf(small), MIDNIGHT_ACCENT, '16px body text does not');
    assert.ok(contrastRatio(colourOf(small), MIDNIGHT_LIGHT) >= 4.5);
});

// ---------- alpha ----------

test('a translucent background is composited before it is judged', () => {
    // Black at half alpha over the white canvas is mid-grey. Read raw it would
    // look like black, and white text on it would appear to pass at 21:1.
    const heading = { type: 'Heading', props: { text: 'Overlaid', fontSize: '16', color: { r: 255, g: 255, b: 255, a: 1 } }, children: [] };
    repairContrast(layoutOf(section({ background: { r: 0, g: 0, b: 0, a: 0.5 } }, [heading])));

    const ink = colourOf(heading);
    assert.notDeepEqual(ink, { r: 255, g: 255, b: 255, a: 1 }, 'white on mid-grey is 3.95:1 and must be repaired');
});

// ---------- what must be left alone ----------

test('text over a background image keeps its colour', () => {
    // What it sits on depends on the photograph, which no prop knows; the
    // overlay prop owns that case.
    const heading = { type: 'Heading', props: { text: 'On a photo', fontSize: '16', color: { ...ESPRESSO_CREAM } }, children: [] };
    repairContrast(layoutOf(section({ backgroundImage: 'https://example.com/x.jpg' }, [heading])));

    assert.deepEqual(colourOf(heading), ESPRESSO_CREAM);
});

test('text over a background video keeps its colour', () => {
    const heading = { type: 'Heading', props: { text: 'On footage', fontSize: '16', color: { ...ESPRESSO_CREAM } }, children: [] };
    const video = { type: 'Video', props: { sourceType: 'background', overlay: 45 }, children: [heading] };
    repairContrast(layoutOf(section({}, [video])));

    assert.deepEqual(colourOf(heading), ESPRESSO_CREAM);
});

test('a node whose colour the model never set is not given one', () => {
    const heading = { type: 'Heading', props: { text: 'Inherits', fontSize: '16' }, children: [] };
    repairContrast(layoutOf(section({ background: { ...ESPRESSO_CREAM } }, [heading])));

    assert.equal(colourOf(heading), undefined, 'inheritance is not ours to override');
});

// ---------- structure ----------

test('a declared ground is inherited through nested containers', () => {
    // Two levels down, both declaring the same dark: still dark on dark.
    const heading = { type: 'Heading', props: { text: 'Deep', fontSize: '16', color: { ...MIDNIGHT_DARK } }, children: [] };
    const inner = section({ background: { ...MIDNIGHT_DARK } }, [heading]);
    const outer = section({ background: { ...MIDNIGHT_DARK } }, [inner]);

    repairContrast(layoutOf(outer));

    assert.notDeepEqual(colourOf(heading), MIDNIGHT_DARK, 'dark on dark two levels down is still dark on dark');
    assert.ok(contrastRatio(colourOf(heading), MIDNIGHT_DARK) >= 4.5);
});

test('multipage layouts are repaired on every page', () => {
    const onPageTwo = { type: 'Heading', props: { text: 'Second', fontSize: '16', color: { ...ESPRESSO_CREAM } }, children: [] };
    repairContrast({
        pages: [
            { name: 'Home', slug: 'home', sections: [section({ background: { ...MIDNIGHT_DARK } }, [])] },
            { name: 'About', slug: 'about', sections: [section({ background: { ...ESPRESSO_CREAM } }, [onPageTwo])] },
        ],
    });

    assert.notDeepEqual(colourOf(onPageTwo), ESPRESSO_CREAM);
});

test('repair is idempotent', () => {
    const build = () => {
        const heading = { type: 'Heading', props: { text: 'Twice', fontSize: '16', color: { ...ESPRESSO_CREAM } }, children: [] };
        return { heading, layout: layoutOf(section({ background: { ...ESPRESSO_CREAM } }, [heading])) };
    };

    const first = build();
    repairContrast(first.layout);
    const once = colourOf(first.heading);

    repairContrast(first.layout);
    assert.deepEqual(colourOf(first.heading), once, 'a second pass must change nothing');
});

// ---------- grounds an element paints without a prop to read ----------

test('the navbar is judged against the theme it paints, not the page behind it', () => {
    // It has no background prop - Bootstrap's bg-dark comes from `variant` - so
    // reading one made the repair think the bar sat on the white page and set
    // near-black type on a near-black bar: 1.15:1, the navigation invisible.
    const nav = { type: 'NavbarElement', props: { variant: 'dark', textColor: { r: 24, g: 24, b: 27, a: 1 } }, children: [] };
    repairContrast(layoutOf(section({ background: { r: 255, g: 255, b: 255, a: 1 } }, [nav])));

    assert.ok(contrastRatio(nav.props.textColor, { r: 33, g: 37, b: 41, a: 1 }) >= 4.5, 'must read on bg-dark');
});

test('a light navbar keeps dark type', () => {
    const nav = { type: 'NavbarElement', props: { variant: 'light', textColor: { r: 255, g: 255, b: 255, a: 1 } }, children: [] };
    repairContrast(layoutOf(section({ background: { r: 18, g: 18, b: 28, a: 1 } }, [nav])));

    assert.ok(contrastRatio(nav.props.textColor, { r: 248, g: 249, b: 250, a: 1 }) >= 4.5, 'white on bg-light must be repaired');
});

test('a container the model gave no background to lets the section through', () => {
    // Container.defaultProps.background is opaque white, which is right on a
    // blank canvas and wrong for every container the model writes: it nests
    // them in dark sections and expects the section to show. The default put a
    // white rectangle in the middle of a purple footer, and over a background
    // video it put a white slab under white type at 1.00:1.
    const PALE = { r: 248, g: 244, b: 250, a: 1 };
    const DARK = { r: 30, g: 18, b: 36, a: 1 };
    const label = { type: 'Text', props: { text: 'BMX School', fontSize: '18', fontWeight: '700', color: { ...PALE } }, children: [] };
    const out = normalizeLayout({ sections: [
        { type: 'Container', props: { background: { ...DARK } }, children: [
            { type: 'Container', props: {}, children: [label] },
        ] },
    ] });

    const inner = out.sections[0].children[0];
    assert.equal(inner.props.background.a, 0, 'says transparent rather than falling through to white');
    assert.deepEqual(inner.children[0].props.color, PALE, 'light type on a dark footer is left alone');
    assert.ok(contrastRatio(inner.children[0].props.color, DARK) >= 4.5);
});

test('a container that does declare white is taken at its word', () => {
    const PALE = { r: 248, g: 244, b: 250, a: 1 };
    const label = { type: 'Text', props: { text: 'On a card', fontSize: '16', color: { ...PALE } }, children: [] };
    const out = normalizeLayout({ sections: [
        { type: 'Container', props: { background: { r: 30, g: 18, b: 36, a: 1 } }, children: [
            { type: 'Container', props: { background: { r: 255, g: 255, b: 255, a: 1 } }, children: [label] },
        ] },
    ] });

    const ink = out.sections[0].children[0].children[0].props.color;
    assert.notDeepEqual(ink, PALE, 'pale on a declared white card must be repaired');
});

test('a container that does declare a background still inherits normally', () => {
    const PALE = { r: 243, g: 245, b: 248, a: 1 };
    const heading = { type: 'Heading', props: { text: 'On dark', fontSize: '48', color: { ...PALE } }, children: [] };
    const band = { type: 'Container', props: { background: { r: 28, g: 32, b: 38, a: 1 } }, children: [heading] };
    repairContrast(layoutOf(section({}, [band])));

    assert.deepEqual(colourOf(heading), PALE, 'readable on the dark it declared');
});

test('a dark section declares type that reads on it, rather than inheriting black', () => {
    // Container.craft's colour default is black, and colour is what everything
    // inside inherits when it sets none of its own. A section written as a dark
    // ground therefore declared black on near-black - 1.10:1 - and took the
    // accordion answers, the tabs panels and the footer small print with it.
    const DARK = { r: 14, g: 16, b: 20, a: 1 };
    const out = normalizeLayout({ sections: [
        { type: 'Container', props: { background: { ...DARK } }, children: [
            { type: 'Text', props: { text: 'inherits its colour' }, children: [] },
        ] },
    ] });

    const declared = out.sections[0].props.color;
    assert.ok(declared, 'the section says what its type is');
    assert.ok(contrastRatio(declared, DARK) >= 4.5, 'and it reads on its own ground');
});

test('a colour the model chose for a section is left alone', () => {
    const CHOSEN = { r: 86, g: 204, b: 218, a: 1 };
    const out = normalizeLayout({ sections: [
        { type: 'Container', props: { background: { r: 14, g: 16, b: 20, a: 1 }, color: { ...CHOSEN } }, children: [] },
    ] });
    assert.deepEqual(out.sections[0].props.color, CHOSEN);
});
