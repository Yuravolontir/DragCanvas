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

import { validateTemplate } from './templates/_validate.mjs';
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

try {
  validateTemplate({ name, map });
} catch (error) {
  console.error(`\n  ✗ ${error.message}\n`);
  process.exit(1);
}

const nodes = Object.values(map);
const used = [...new Set(nodes.map((n) => n.type?.resolvedName))].sort();
const sections = (map.ROOT.nodes || []).length;

console.log(`\n  ✓ ${name}`);
console.log(`    ${nodes.length} nodes, ${sections} sections, ${used.length} element types`);
console.log(`    ${used.join(' ')}`);

const out = file.replace(/\.json$/, '') + '.preview.html';
fs.writeFileSync(out, exportToHtml(map, name.replace(/\.json$/, '')));
console.log(`\n    Written ${out} - open it and look at it before you trust it.\n`);
