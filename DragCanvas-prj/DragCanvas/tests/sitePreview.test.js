/**
 * The two promises a card makes about the site drawn on it.
 *
 * A preview renders a real page with real scripts, and the same component now
 * draws the user's own projects rather than only the gallery's templates. That
 * raises a question templates never had: a published page calls home when a
 * project id was baked into it, and a project has one. So the card must go on
 * being a picture of a site rather than a working copy of it.
 *
 * Read from the source because that is where the mistake would be made - a
 * third argument added to one call, a word added to one sandbox attribute.
 * Neither would fail anything else, and both would be invisible on screen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const preview = read('src/Components/SitePreview.jsx');
// The drawing itself moved next door, so the showcase can warm a template up
// before it is shown. The promise is unchanged and so is this test.
const cache = read('src/Components/sitePreviewCache.js');

test('a preview never claims to be a project', () => {
  const calls = [...cache.matchAll(/exportToHtml\(([^)]*)\)/g)].map((m) => m[1]);
  assert.equal(calls.length, 1, 'one place draws the page');
  assert.equal(calls[0].split(',').length, 2,
    'a third argument is options, and options is where projectId is passed - '
    + 'with one, the card\'s forms and bookings would post as the real project');
  assert.ok(!/projectId/.test(cache), 'nothing that draws a card knows a project id');
  assert.ok(!/projectId/.test(preview), 'nor does the card itself');
  assert.ok(!/exportToHtml/.test(preview),
    'and the card draws nothing of its own - one place, so there is one thing to check');
});

test('the frame is a stranger to this origin', () => {
  const sandbox = preview.match(/const SANDBOX = '([^']*)'/);
  assert.ok(sandbox, 'the sandbox is declared in one place');
  assert.equal(sandbox[1], 'allow-scripts',
    'allow-same-origin would give the frame our cookies and our storage');
  assert.ok(/sandbox={SANDBOX}/.test(preview), 'and the iframe uses it');
});

test('a card that gave up stops pretending to load', () => {
  // The sweeping panel says "any moment now". A design that will not draw and
  // has no stored picture behind it used to sweep for ever.
  assert.ok(/failed \? 'tpl-preview__blank' : 'tpl-preview__pending'/.test(preview));
  assert.ok(/\.tpl-preview__blank\s*{/.test(read('src/Components/TemplatePreview.css')),
    'and the still panel is actually styled');
});

test('the gallery still asks for a template, and a project for a project', () => {
  const template = read('src/Components/TemplatePreview.jsx');
  assert.ok(/\/api\/templates\/\$\{template\.Template_ID\}/.test(template));
  assert.ok(/designKey="TemplateData"/.test(template));

  const projects = read('src/MyProject.jsx');
  assert.ok(/\/api\/projects\/\$\{project\.Project_ID\}/.test(projects));
  assert.ok(/designKey="ProjectData"/.test(projects));
});

test('every project card carries a preview, thumbnail or not', () => {
  // The old markup was `{project.ThumbnailURL && <img .../>}`, so a project
  // nobody had ever captured showed no picture of itself at all - which is
  // most of them.
  const projects = read('src/MyProject.jsx');
  assert.ok(/<SitePreview/.test(projects));
  assert.ok(!/project\.ThumbnailURL &&/.test(projects),
    'nothing may make the preview conditional on a stored picture');
});
