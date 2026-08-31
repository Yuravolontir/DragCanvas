import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const image = fs.readFileSync(path.join(root, 'public/dragcanvas-og.png'));

test('the app shell exposes an absolute WhatsApp-compatible Open Graph image', () => {
  assert.match(html, /property="og:title" content="DragCanvas — Visual Website Builder"/);
  assert.match(html, /property="og:image" content="https:\/\/dragcanvasapp\.netlify\.app\/dragcanvas-og\.png"/);
  assert.match(html, /property="og:image:type" content="image\/png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});
