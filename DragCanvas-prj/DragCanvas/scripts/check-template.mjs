/**
 * Check one hand-written or AI-written template, and render it so you can look.
 *
 *   node scripts/check-template.mjs florist.json
 *
 * Takes the flat Craft.js node map a template consists of - the value that goes
 * in TBTemplates.TemplateData - and holds it to exactly the rules the gallery
 * build enforces, because they are the same rules: both call validateTemplate.
 *
 * Then it exports the page to HTML next to the input and tells you to open it.
 * Passing the checks means the file is structurally sound; it does not mean the
 * page looks good, and the only way to find that out is to look at it. Every
 * ugly template in this gallery's first pass was valid JSON.
 */
import fs from 'fs';
import path from 'path';

import { validateTemplate, templatePages } from './templates/_validate.mjs';
import { applyDefaultMotion } from './templates/_builder.mjs';
import { exportToHtml } from '../src/utils/exportToHtml.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/check-template.mjs <template.json>');
  process.exit(2);
}

let map;
try {
  const raw = fs.readFileSync(file, 'utf8');
  map = JSON.parse(raw);
} catch (error) {
  console.error(`Cannot read ${file}: ${error.message}`);
  process.exit(1);
}

// An AI asked for "the JSON" often wraps it in the row it belongs to. Accept
// either, rather than making somebody unwrap it by hand.
if (map.TemplateData || map.templateData) {
  map = map.TemplateData || map.templateData;
  if (typeof map === 'string') map = JSON.parse(map);
}

const name = path.basename(file);

/*
 * A file here is either a node map or the multi-page envelope the editor
 * writes, and the checker used to assume the first — a four-page template
 * failed with "has no ROOT node", which describes the checker rather than the
 * template.
 */
const template = map?.__dragcanvasPages && Array.isArray(map.pages)
  ? { name, pages: map.pages.map((page) => ({ name: page.name, slug: page.slug, map: page.data })) }
  : { name, map };

const pages = templatePages(template);

try {
  // The gallery build gives every template the same rhythm; a template checked
  // by hand has to be checked as it will ship, not as it was written.
  for (const page of pages) applyDefaultMotion(page.map);
  validateTemplate(template);
} catch (error) {
  console.error(`\n  ✗ ${error.message}\n`);
  process.exit(1);
}

const nodes = pages.flatMap((page) => Object.values(page.map));
const used = [...new Set(nodes.map((n) => n.type?.resolvedName))].sort();
const sections = pages.reduce((total, page) => total + (page.map.ROOT.nodes || []).length, 0);

console.log(`\n  ✓ ${name}`);
console.log(
  pages.length > 1
    ? `    ${pages.length} pages (${pages.map((page) => '/' + page.slug + '/').join(' ')}), `
      + `${nodes.length} nodes, ${sections} sections, ${used.length} element types`
    : `    ${nodes.length} nodes, ${sections} sections, ${used.length} element types`,
);
console.log(`    ${used.join(' ')}`);

// ── Things that pass every structural check and still make the page useless ──
//
// A template pack generated from the prompt came back valid six times over and
// shared sixty-eight per cent of its visible copy between a SaaS, a restaurant
// and a dental clinic: one skeleton, six accent colours. None of the rules above
// can see that, because each file on its own is fine. These are warnings rather
// than failures - a human decides - but they are what to look at first.

const VISIBLE = ['text', 'title', 'quote', 'author', 'role', 'brand', 'attribution',
  'heading1', 'heading2', 'heading3', 'p1', 'p2', 'p3', 'cta', 'submitText',
  'successMessage', 'label'];
const LIST_PROPS = ['items', 'tiers', 'people', 'steps', 'logos'];

/** The visible copy of one page, so repetition is counted where it shows. */
const linesOf = (pageNodes) => {
  const visibleLines = [];
  for (const n of pageNodes) {
  const props = n.props || {};
  for (const key of VISIBLE) {
    if (typeof props[key] === 'string' && props[key].trim().length > 8) visibleLines.push(props[key].trim());
  }
  for (const key of LIST_PROPS) {
    if (!Array.isArray(props[key])) continue;
    for (const entry of props[key]) {
      if (typeof entry === 'string' && entry.trim().length > 8 && !/^https?:|^mailto:/.test(entry)) {
        visibleLines.push(entry.trim());
      }
    }
  }
  }
  return visibleLines;
};

const warnings = [];

// Names and addresses that appear in the prompt as illustrations. Copied
// through, they put somebody else's placeholder on the page.
const BORROWED = ['Dana Levi', 'Omer Katz', 'Kettle', 'Fathom', 'Northwind',
  'hello@example.com', 'example.com', 'Lorem', 'Your text here', 'Company Name',
  'DragCanvas'];
const raw = JSON.stringify(pages.map((page) => page.map));
const borrowed = BORROWED.filter((word) => raw.includes(word));
if (borrowed.length) {
  warnings.push(`copied from the prompt's examples rather than written: ${borrowed.join(', ')}`);
}

// The same sentence three times over is filler standing in for three thoughts.
// The business's own name is exempt: it belongs in the navbar, the footer and
// usually the copy, and flagging it would teach you to ignore this list.
//
// Counted one page at a time, because the navigation bar and the footer are
// supposed to be identical on every page — counting across a four-page site
// reported the footer's own strapline as filler four times over.
const brands = new Set(nodes.map((n) => n.props?.brand).filter(Boolean));
for (const page of pages) {
  const seenLines = new Map();
  for (const line of linesOf(Object.values(page.map))) {
    if (brands.has(line)) continue;
    seenLines.set(line, (seenLines.get(line) || 0) + 1);
  }
  const where = pages.length > 1 ? ` on /${page.slug}/` : ' on the page';
  for (const [line, n] of [...seenLines].filter(([, n]) => n >= 3)) {
    warnings.push(`"${line.slice(0, 54)}" appears ${n} times${where}`);
  }
}

if (warnings.length) {
  console.log('\n    Worth a look:');
  for (const w of warnings.slice(0, 8)) console.log(`      · ${w}`);
}

// One file per page. Handing the multi-page envelope to the exporter produced
// a three-kilobyte page with nothing on it, which looks like a broken template
// rather than a checker that was given the wrong shape.
const base = file.replace(/\.json$/, '');
const title = name.replace(/\.json$/, '');
const written = pages.map((page) => {
  const out = pages.length > 1 ? `${base}.${page.slug}.preview.html` : `${base}.preview.html`;
  fs.writeFileSync(out, exportToHtml(page.map, pages.length > 1 ? `${title} — ${page.name}` : title));
  return out;
});
console.log(`\n    Written ${written.join('\n            ')}`);
console.log('    Open them and look before you trust any of it.\n');
