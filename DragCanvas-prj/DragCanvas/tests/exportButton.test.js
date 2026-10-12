/**
 * The editor's Export button.
 *
 * It copied the canvas out of the page by a CSS selector, and when the canvas
 * markup changed the selector matched nothing: the click returned early and
 * nothing was downloaded, with no error anywhere. It now hands the node map to
 * the same exporter publishing uses, which does not depend on markup.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { downloadHtml } from '../src/utils/exportToHtml.js';

const page = {
  ROOT: {
    type: { resolvedName: 'Container' }, isCanvas: true, props: { width: '800px', flexDirection: 'column' },
    nodes: ['h'], linkedNodes: {}, parent: null,
  },
  h: { type: { resolvedName: 'Heading' }, props: { text: 'Hello export' }, nodes: [], linkedNodes: {}, parent: 'ROOT' },
};

test('Export downloads the published page, named after the project', async (t) => {
  const clicked = [];
  const previous = globalThis.document;
  globalThis.document = {
    createElement: () => ({ click() { clicked.push(this); } }),
    body: { appendChild() {}, removeChild() {} },
  };
  t.after(() => { globalThis.document = previous; });
  let blob;
  t.mock.method(URL, 'createObjectURL', (b) => { blob = b; return 'blob:x'; });
  t.mock.method(URL, 'revokeObjectURL', () => {});

  downloadHtml(page, 'Bakery.html', { projectId: 42 });

  assert.equal(clicked.length, 1, 'a download was actually started');
  assert.equal(clicked[0].download, 'Bakery.html');
  const html = await blob.text();
  assert.match(html, /^<!DOCTYPE html>/i);
  assert.match(html, /Hello export/);
  assert.match(html, /var projectId = 42;/, 'forms on the file still reach the project');
});

test('the header no longer depends on a selector into the canvas markup', () => {
  const header = fs.readFileSync(new URL('../src/editor/Landing/Header.jsx', import.meta.url), 'utf8');
  assert.match(header, /downloadHtml\(query\.serialize\(\)/);
  assert.ok(!fs.existsSync(new URL('../src/editor/downloadCanvasHtml.js', import.meta.url)));
});
