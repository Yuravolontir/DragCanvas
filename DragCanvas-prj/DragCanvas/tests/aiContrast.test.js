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

import { repairContrast } from '../utils/ai.helpers.js';
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

test('the ground is inherited through nested containers', () => {
    const heading = { type: 'Heading', props: { text: 'Deep', fontSize: '16', color: { ...MIDNIGHT_DARK } }, children: [] };
    const inner = section({}, [heading]);
    const outer = section({ background: { ...MIDNIGHT_DARK } }, [inner]);

    repairContrast(layoutOf(outer));

    assert.notDeepEqual(colourOf(heading), MIDNIGHT_DARK, 'dark on dark two levels down is still dark on dark');
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
