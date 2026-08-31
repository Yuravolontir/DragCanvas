/**
 * Can the text in these templates actually be read?
 *
 *   node scripts/check-contrast.mjs            every template in the gallery
 *   node scripts/check-contrast.mjs coffee     just one
 *
 * Colour in this editor is a stack: a node states a text colour, and the
 * background it lands on belongs to some ancestor, possibly several levels up,
 * possibly a photograph with a scrim over it. Nothing in the authoring path
 * compares the two, so a heading set in cream on a container whose background
 * was changed to cream three edits later is a heading nobody can read and
 * nobody is told about.
 *
 * The rule is WCAG AA: 4.5:1 for body text, 3:1 once the text is large (24px,
 * or 18.66px when bold). Failures are reported together with what the text
 * actually landed on, because "Text-14 is unreadable" is not something anybody
 * can act on.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { applyDefaultMotion } from './templates/_builder.mjs';
import { templatePages } from './templates/_validate.mjs';
import { readableInk } from '../src/utils/readableInk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * Colour
 * ------------------------------------------------------------------ */

const isColour = (value) => value && typeof value === 'object' && typeof value.r === 'number';

/** sRGB relative luminance, per WCAG. */
function luminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** What `over` actually looks like once its alpha is applied to `under`. */
function composite(over, under) {
  const alpha = over.a ?? 1;
  if (alpha >= 1) return over;
  return {
    r: Math.round(over.r * alpha + under.r * (1 - alpha)),
    g: Math.round(over.g * alpha + under.g * (1 - alpha)),
    b: Math.round(over.b * alpha + under.b * (1 - alpha)),
    a: 1,
  };
}

const show = (colour) => `rgb(${colour.r},${colour.g},${colour.b})`;

/* ------------------------------------------------------------------ *
 * Which prop is the text, and which is the ground
 * ------------------------------------------------------------------ */

/**
 * The text colours each element type carries, and how big that text is.
 *
 * `size` is the prop naming the font size when the element has one, and a
 * number when the element sets it in its own stylesheet — Stats prints its
 * figure at 42px whatever the page says, and a rule that assumed 15px would
 * report a heading-sized number as body text.
 *
 * `on` is the ground the element paints for itself: a badge's pill, a button's
 * fill. A function, when whether it paints one at all depends on another prop —
 * an unpadded Icon has no chip, and reading its `background` anyway reported
 * every icon in the gallery as invisible.
 *
 * `colour` is usually a prop name, and sometimes a colour outright: seven
 * elements print white on their accent with no way to change it — the pricing
 * table's featured button, the timeline's numbered rail, and every submit
 * button in the set. An accent light enough to be pretty is an accent those
 * labels vanish into, and nothing anywhere said so.
 */
/** The label those seven elements actually print, which follows the fill. */
const ON_ACCENT = 'auto';
const TEXT_PROPS = {
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
  Testimonial: [{ colour: 'color', on: 'background', size: 18 }],
  Timeline: [
    { colour: 'color', size: 15 },
    { colour: 'accent', size: 15 },
    { colour: ON_ACCENT, on: 'accent', size: 14, weight: 700 },
  ],
  TeamGrid: [{ colour: 'color', size: 15 }],
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
  NavbarElement: [{ colour: 'textColor', on: 'background', size: 15 }],
  Icon: [{ colour: 'color', on: (props) => (props.padded === 'yes' ? props.background : null), size: 32, weight: 700 }],
  Form: [
    { colour: 'textColor', on: 'background', size: 15 },
    { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
  ],
  Booking: [
    { colour: 'color', size: 15 },
    { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
  ],
  Engagement: [
    { colour: 'color', size: 15 },
    { colour: ON_ACCENT, on: 'accent', size: 15, weight: 600 },
  ],
  Map: [{ colour: 'color', size: 14 }],
};

/** Large text gets the easier threshold, exactly as WCAG defines it. */
const isLarge = (size, weight) => {
  const px = Number(size) || 15;
  const bold = Number(weight) >= 700;
  return px >= 24 || (bold && px >= 18.66);
};

/* ------------------------------------------------------------------ *
 * Walking the tree
 * ------------------------------------------------------------------ */

const WHITE = { r: 255, g: 255, b: 255, a: 1 };

/**
 * What this node's text is sitting on.
 *
 * Walks up until it finds something opaque, compositing anything translucent
 * on the way. A photograph counts as its scrim: the image underneath is
 * unknowable, so a scrim that is nearly opaque is treated as the ground and a
 * thin one is reported separately — text over a bare photograph is a gamble
 * whatever colour it is.
 */
function groundUnder(map, id, seed) {
  const layers = [];
  if (seed) layers.push(seed);

  let current = map[id];
  let thinScrim = null;
  while (current) {
    const props = current.props || {};

    if (current.type?.resolvedName === 'Video' && props.sourceType === 'background') {
      // The exporter dims the footage with black at overlay/100.
      const dim = Math.min(100, Math.max(0, Number(props.overlay ?? 40))) / 100;
      layers.push({ r: 0, g: 0, b: 0, a: dim });
      if (dim < 0.5) thinScrim = `video scrim at ${Math.round(dim * 100)}%`;
      // Footage is unknowable; black under the scrim is the fair assumption.
      layers.push({ r: 0, g: 0, b: 0, a: 1 });
      break;
    }

    if (props.backgroundImage) {
      const scrim = isColour(props.overlay) ? props.overlay : null;
      if (scrim) {
        layers.push(scrim);
        if ((scrim.a ?? 1) < 0.5) thinScrim = `photo scrim at ${Math.round((scrim.a ?? 1) * 100)}%`;
      } else {
        thinScrim = 'a photograph with no scrim at all';
      }
      layers.push({ r: 128, g: 128, b: 128, a: 1 });
      break;
    }

    if (isColour(props.background) && (props.background.a ?? 1) > 0) {
      layers.push(props.background);
      if ((props.background.a ?? 1) >= 1) break;
    }

    current = map[current.parent];
  }

  let ground = WHITE;
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    ground = composite(layers[index], ground);
  }
  return { ground, thinScrim };
}

/* ------------------------------------------------------------------ *
 * The check
 * ------------------------------------------------------------------ */

export function auditContrast(name, map) {
  const problems = [];

  for (const [id, node] of Object.entries(map)) {
    const type = node.type?.resolvedName;
    const specs = TEXT_PROPS[type];
    if (!specs) continue;
    const props = node.props || {};

    for (const spec of specs) {
      const fill = typeof spec.on === 'function' ? spec.on(props) : spec.on && props[spec.on];
      const foreground = spec.colour === ON_ACCENT
        ? (isColour(fill) ? readableInk(fill) : null)
        : isColour(spec.colour) ? spec.colour : props[spec.colour];
      if (!isColour(foreground)) continue;

      // An element that paints its own card sits on that card, not on the
      // section behind it.
      const seed = isColour(fill) && (fill.a ?? 1) > 0 ? fill : null;
      const { ground, thinScrim } = groundUnder(map, seed ? id : node.parent, seed);

      const text = composite(foreground, ground);
      const ratio = contrast(text, ground);
      const size = typeof spec.size === 'string' ? props[spec.size] : spec.size;
      const weight = typeof spec.weight === 'string' ? props[spec.weight] : spec.weight;
      const need = isLarge(size, weight) ? 3 : 4.5;

      if (ratio + 0.005 < need) {
        problems.push({
          id,
          type,
          prop: spec.colour === ON_ACCENT ? `label on .${spec.on}` : spec.colour,
          ratio,
          need,
          text: show(text),
          ground: show(ground),
          label: node.custom?.displayName || type,
          thinScrim,
        });
      }
    }
  }

  return { name, problems };
}

/* ------------------------------------------------------------------ *
 * Running it
 * ------------------------------------------------------------------ */

const only = process.argv[2];
const dir = path.join(__dirname, 'templates');
const files = fs.readdirSync(dir)
  .filter((file) => file.endsWith('.mjs') && !file.startsWith('_'))
  .filter((file) => !only || file.startsWith(only))
  .sort();

let failures = 0;
for (const file of files) {
  const module = await import(pathToFileURL(path.join(dir, file)).href);
  const template = module.default();

  // A multi-page template is several designs, and text is unreadable one page
  // at a time.
  const pages = templatePages(template);
  const problems = [];
  for (const page of pages) {
    applyDefaultMotion(page.map);
    const found = auditContrast(template.name, page.map).problems;
    const where = pages.length > 1 ? `/${page.slug}/ ` : '';
    problems.push(...found.map((problem) => ({ ...problem, label: where + problem.label })));
  }
  const pad = template.name.padEnd(22);

  if (!problems.length) {
    console.log(`  ${pad} ok`);
    continue;
  }

  failures += problems.length;
  console.log(`\n  ${pad} ${problems.length} unreadable`);
  for (const problem of problems) {
    console.log(
      `    ${problem.label} (${problem.id}) .${problem.prop}`
      + `  ${problem.ratio.toFixed(2)}:1, needs ${problem.need}:1`,
    );
    console.log(`      ${problem.text} on ${problem.ground}${problem.thinScrim ? `  — ${problem.thinScrim}` : ''}`);
  }
}

console.log(
  failures
    ? `\n${failures} piece(s) of text cannot be read against what they sit on.\n`
    : '\nevery template reads\n',
);
process.exit(failures ? 1 : 0);
