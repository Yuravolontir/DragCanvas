/**
 * The shared vocabulary for asking "can this text be read?".
 *
 * Two places need the same answer, and they must never disagree about the same
 * page: `scripts/check-contrast.mjs` audits the templates in the gallery, and
 * the AI path repairs colours the model chose before they reach the canvas. A
 * second implementation would drift from the first, and then the script that
 * tells a template author they are wrong would be arguing with the generator.
 *
 * What lives here is only what both share - the arithmetic, the WCAG size rule,
 * and the map of which prop on which element is text. The walk itself does not:
 * the script has a flat Craft.js node map with parent pointers, the AI path has
 * a nested tree, and the two traversals have nothing useful in common.
 *
 * `luminance` and `contrastRatio` are not repeated here; they belong to
 * readableInk.js, which is where the ink decision is made.
 */

import { contrastRatio } from './readableInk.js';

export { contrastRatio };

/** An rgba object as this editor stores colour, as opposed to anything else. */
export const isColour = (value) => Boolean(value) && typeof value === 'object' && typeof value.r === 'number';

/** What `over` actually looks like once its alpha is applied to `under`. */
export function composite(over, under) {
    const alpha = over.a ?? 1;
    if (alpha >= 1) return over;
    return {
        r: Math.round(over.r * alpha + under.r * (1 - alpha)),
        g: Math.round(over.g * alpha + under.g * (1 - alpha)),
        b: Math.round(over.b * alpha + under.b * (1 - alpha)),
        a: 1,
    };
}

/** Large text gets the easier threshold, exactly as WCAG defines it. */
export const isLarge = (size, weight) => {
    const px = Number(size) || 15;
    const bold = Number(weight) >= 700;
    return px >= 24 || (bold && px >= 18.66);
};

/** The floor a piece of text has to clear, given how big it is. */
export const floorFor = (size, weight) => (isLarge(size, weight) ? 3 : 4.5);

/**
 * What each navbar theme actually paints, from Bootstrap's own palette.
 *
 * `custom` is the one NavbarElement sets by hand (#333); the rest are
 * Bootstrap 5's .bg-dark, .bg-primary and .bg-light.
 */
export const NAVBAR_GROUND = {
    dark: { r: 33, g: 37, b: 41, a: 1 },
    primary: { r: 13, g: 110, b: 253, a: 1 },
    light: { r: 248, g: 249, b: 250, a: 1 },
    custom: { r: 51, g: 51, b: 51, a: 1 },
};

/** The label those elements print themselves, which follows their fill. */
export const ON_ACCENT = 'auto';

/**
 * The text colours each element type carries, and how big that text is.
 *
 * `size` is the prop naming the font size when the element has one, and a
 * number when the element sets it in its own stylesheet - Stats prints its
 * figure at 42px whatever the page says, and a rule that assumed 15px would
 * report a heading-sized number as body text.
 *
 * `on` is the ground the element paints for itself: a badge's pill, a button's
 * fill. A function, when whether it paints one at all depends on another prop -
 * an unpadded Icon has no chip, and reading its `background` anyway reported
 * every icon in the gallery as invisible.
 *
 * `colour` is usually a prop name, and sometimes a colour outright: seven
 * elements print white on their accent with no way to change it - the pricing
 * table's featured button, the timeline's numbered rail, and every submit
 * button in the set. An accent light enough to be pretty is an accent those
 * labels vanish into, and nothing anywhere said so.
 */
export const TEXT_PROPS = {
    Text: [{ colour: 'color', size: 'fontSize', weight: 'fontWeight' }],
    Heading: [{ colour: 'color', size: 'fontSize', weight: 700 }],
    Button: [{ colour: 'color', on: 'background', size: 16, weight: 600 }],
    Link: [{ colour: 'color', size: 'fontSize' }],
    Badge: [{ colour: 'color', on: 'background', size: 13, weight: 600 }],
    Quote: [{ colour: 'color', size: 'fontSize' }],
    List: [{ colour: 'color', size: 15 }],
    Stats: [
        { colour: 'accent', size: 42, weight: 800 },
        { colour: 'color', size: 14 },
    ],
    Testimonial: [{ colour: 'color', on: 'background', size: 18, opacity: 0.65 }],
    Timeline: [
        { colour: 'color', size: 15 },
        { colour: 'accent', size: 15 },
        { colour: ON_ACCENT, on: 'accent', size: 14, weight: 700 },
    ],
    TeamGrid: [{ colour: 'color', size: 15, opacity: 0.65 }],
    Accordion: [{ colour: 'color', on: 'background', size: 15 }],
    Pricing: [
        { colour: 'color', on: 'background', size: 15 },
        { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
    ],
    CTABanner: [
        { colour: 'color', on: 'background', size: 26, weight: 700 },
        { colour: 'buttonColor', on: 'buttonBackground', size: 16, weight: 600 },
    ],
    SocialLinks: [{ colour: 'color', on: 'background', size: 16 }],
    LogoStrip: [{ colour: 'color', size: 16 }],
    Newsletter: [
        { colour: 'color', size: 15 },
        { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
    ],
    Tabs: [{ colour: 'accent', size: 15, weight: 700 }],
    Countdown: [{ colour: 'accent', size: 30, weight: 700 }],
    ProductCatalog: [
        { colour: 'accent', size: 15 },
        { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
    ],
    // The navbar has no background prop: it paints itself with a Bootstrap
    // class chosen by `variant`, and defaults to the dark one. Reading a prop
    // that does not exist made the repair think the bar sat on whatever was
    // behind it - a white page - and set near-black type on a near-black bar,
    // 1.15:1, the whole navigation invisible. The ground comes from the variant.
    NavbarElement: [{ colour: 'textColor', on: (props) => NAVBAR_GROUND[props.variant || 'dark'] || NAVBAR_GROUND.dark, size: 15 }],
    Icon: [{ colour: 'color', on: (props) => (props.padded === 'yes' ? props.background : null), size: 32, weight: 700 }],
    Form: [
        { colour: 'textColor', on: 'background', size: 15 },
        { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
    ],
    Booking: [
        { colour: 'color', size: 15, opacity: 0.7 },
        { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
    ],
    Engagement: [
        { colour: 'color', size: 15 },
        { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
    ],
    // The slide label printed white on the accent whatever the accent was;
    // Carousel.jsx now asks readableInk, and this is what holds it there.
    Carousel: [{ colour: ON_ACCENT, on: 'accent', size: 12, weight: 600 }],
    Map: [{ colour: 'color', size: 14 }],
};

/**
 * The colour as it actually reaches the screen.
 *
 * Seven elements fade their own text in their stylesheet - a Stats label at
 * 0.7, a Timeline note at 0.7, a Pricing period at 0.6 - and CSS opacity is
 * invisible to anything reading props. A slate label measuring a comfortable
 * 7.58:1 on paper arrives at 3.59:1, under the floor, and both auditors called
 * it fine. `opacity` on a spec is how an element declares that fade.
 */
export function renderedInk(colour, spec, ground) {
    const fade = spec?.opacity;
    const alpha = (colour.a ?? 1) * (typeof fade === 'number' ? fade : 1);
    return composite({ ...colour, a: alpha }, ground);
}

/** Resolve a spec's `size`/`weight`, which may name a prop or be a number. */
export const specSize = (spec, props) => (typeof spec.size === 'string' ? props[spec.size] : spec.size);
export const specWeight = (spec, props) => (typeof spec.weight === 'string' ? props[spec.weight] : spec.weight);

/** The fill an element paints for itself, if it paints one. */
export function selfFill(spec, props) {
    const fill = typeof spec.on === 'function' ? spec.on(props) : spec.on && props[spec.on];
    return isColour(fill) && (fill.a ?? 1) > 0 ? fill : null;
}
