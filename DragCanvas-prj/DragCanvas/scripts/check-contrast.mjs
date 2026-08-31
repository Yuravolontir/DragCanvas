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
import {
  ON_ACCENT,
  TEXT_PROPS,
  composite,
  contrastRatio as contrast,
  isColour,
  isLarge,
  renderedInk,
} from '../src/utils/contrast.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * Colour
 *
 * The arithmetic, the WCAG size rule and the map of which prop is text all
 * live in src/utils/contrast.js, because the AI path repairs colours with the
 * same rules and the two must never disagree about the same page. What stays
 * here is the walk, which has no counterpart there: this side has a flat
 * Craft.js node map with parent pointers, that side has a nested tree.
 * ------------------------------------------------------------------ */

const show = (colour) => `rgb(${colour.r},${colour.g},${colour.b})`;
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

      const text = renderedInk(foreground, spec, ground);
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
