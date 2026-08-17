/**
 * Build every template in scripts/templates/ and put it in the gallery.
 *
 *   node scripts/generate-templates.mjs           build, validate, write JSON, upsert
 *   node scripts/generate-templates.mjs --dry     everything except touching the database
 *
 * A template is a file exporting a default function that returns
 * { id?, name, category, thumb, map }. Files starting with an underscore are
 * shared machinery, not templates.
 *
 * Templates that carry an `id` replace that row rather than adding another. The
 * five originals keep theirs: somebody may have opened "Casa Oliva" already, and
 * a gallery with two of them helps nobody.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import pg from 'pg';

import { validateTemplate, checkRichness } from './templates/_validate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dry = process.argv.includes('--dry');

// ---------- load ----------

const dir = path.join(__dirname, 'templates');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();

const templates = [];
for (const file of files) {
  // Node's ESM loader requires a file:// URL on Windows; importing C:\\... is
  // parsed as the unsupported URL scheme "c:".
  const mod = await import(pathToFileURL(path.join(dir, file)).href);
  if (typeof mod.default !== 'function') {
    throw new Error(`${file}: expected a default-exported function`);
  }
  templates.push({ file, ...mod.default() });
}

// ---------- validate ----------

for (const t of templates) validateTemplate(t);

// Reported together rather than thrown one at a time: this is a standard the
// whole gallery is held to, and seeing which twelve fall short is more use than
// being told about the first.
const thin = templates
  .map((t) => [t.name, checkRichness(t)])
  .filter(([, shortfalls]) => shortfalls.length);

if (thin.length) {
  console.error(`\n${thin.length} template(s) do not show enough of the editor:\n`);
  for (const [name, shortfalls] of thin) console.error(`  ${name}\n    ${shortfalls.join('\n    ')}`);
  console.error('');
  process.exit(1);
}

// ---------- what the set covers ----------

const used = new Set();
for (const t of templates) {
  for (const n of Object.values(t.map)) used.add(n.type?.resolvedName);
}
console.log(`${templates.length} templates, ${used.size} distinct elements used`);
console.log([...used].sort().join(' '));

// ---------- write ----------

const outDir = path.join(__dirname, 'templates-out');
fs.mkdirSync(outDir, { recursive: true });

// Emptied first. A renamed template used to leave its old output behind, and a
// stale file in here reads exactly like a real one - the first audit of this set
// reported a template with no headings that had not existed for an hour.
for (const stale of fs.readdirSync(outDir).filter((f) => f.endsWith('.json'))) {
  fs.unlinkSync(path.join(outDir, stale));
}
for (const t of templates) {
  fs.writeFileSync(path.join(outDir, t.file.replace('.mjs', '.json')), JSON.stringify(t.map, null, 2));
}

if (dry) {
  console.log(`\nDry run: JSON written to ${outDir}, database untouched.`);
  process.exit(0);
}

// ---------- upsert ----------

const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const dbUrl = envText.match(/^DATABASE_?URL=(.+)$/m)?.[1]?.trim();
if (!dbUrl) throw new Error('DATABASE_URL not found in .env');

const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

for (const t of templates) {
  const flat = JSON.stringify(t.map);
  // TemplateData is a double-encoded JSON string, matching what the editor's
  // own "save as template" writes. Changing that here would break loading.
  const templateData = JSON.stringify(flat);
  const componentCount = Object.keys(t.map).length - 1;
  const size = (flat.length / 1024).toFixed(1);

  // Without an id, match on the name. Running this twice used to insert a second
  // copy of every template that had no id - nine duplicates in the gallery from
  // one extra run. A build script is going to be run more than once, so it has
  // to be safe to.
  let targetId = t.id;
  if (!targetId) {
    const found = await pool.query('SELECT "Template_ID" FROM "TBTemplates" WHERE "TemplateName" = $1', [t.name]);
    if (found.rowCount > 0) targetId = found.rows[0].Template_ID;
  }

  if (targetId) {
    const res = await pool.query(
      `UPDATE "TBTemplates"
          SET "TemplateName" = $2, "Category" = $3, "ThumbnailURL" = $4,
              "TemplateData" = $5, "ComponentCount" = $6, "IsActive" = true
        WHERE "Template_ID" = $1
      RETURNING "Template_ID"`,
      [targetId, t.name, t.category, t.thumb, templateData, componentCount]
    );
    if (res.rowCount === 0) throw new Error(`${t.name}: no template with id ${targetId} to replace`);
    console.log(`  replaced ${targetId}  ${t.name} (${componentCount} components, ${size} KB)`);
  } else {
    const res = await pool.query(
      `INSERT INTO "TBTemplates" ("TemplateName", "Category", "ThumbnailURL", "TemplateData", "ComponentCount", "CreatedBy", "IsActive")
       VALUES ($1, $2, $3, $4, $5, 1, true) RETURNING "Template_ID"`,
      [t.name, t.category, t.thumb, templateData, componentCount]
    );
    console.log(`  inserted ${res.rows[0].Template_ID}  ${t.name} (${componentCount} components, ${size} KB)`);
  }
}

await pool.end();
console.log('Done.');
