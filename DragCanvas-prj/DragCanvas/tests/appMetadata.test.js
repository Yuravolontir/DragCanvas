/**
 * The link preview card, as a crawler assembles it.
 *
 * A shared link is read by a program, not a browser: it fetches the HTML, takes
 * the tags at their word, then fetches the image separately. So the failure mode
 * is quiet - WhatsApp printed the title and the description and simply dropped
 * the picture, saying nothing about why. These assertions pin the three things
 * that were guessed at while that was being diagnosed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const meta = (key) => {
  const found = html.match(new RegExp(`(?:property|name)="${key}" content="([^"]*)"`));
  return found?.[1];
};

/**
 * A JPEG's real width and height, from the frame header rather than the tags.
 *
 * The tags are what the card is drawn from, so a picture that stops agreeing
 * with them is rendered at the wrong shape rather than not at all - a failure
 * nothing else in this repo would notice.
 */
function jpegSize(buffer) {
  let at = 2; // past the SOI marker
  while (at < buffer.length) {
    if (buffer[at] !== 0xff) return null;
    const marker = buffer[at + 1];
    // Every SOF except the four that reuse the range for tables and restarts.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(at + 5), width: buffer.readUInt16BE(at + 7) };
    }
    at += 2 + buffer.readUInt16BE(at + 2);
  }
  return null;
}

test('the preview image is the file the tags name', () => {
  const url = meta('og:image');
  assert.ok(url?.startsWith('https://'), 'a crawler fetches this on its own, so it cannot be relative');
  assert.equal(meta('og:image:secure_url'), url, 'the two addresses must not drift apart');
  assert.equal(meta('twitter:image'), url);

  const onDisk = path.join(root, 'public', path.basename(new URL(url).pathname));
  assert.ok(fs.existsSync(onDisk), `${url} has nothing behind it in public/`);
});

test('the declared size is the size the picture actually is', () => {
  const bytes = fs.readFileSync(path.join(root, 'public', path.basename(new URL(meta('og:image')).pathname)));
  assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], 'a real JPEG, matching og:image:type');
  assert.equal(meta('og:image:type'), 'image/jpeg');

  const { width, height } = jpegSize(bytes);
  assert.equal(String(width), meta('og:image:width'));
  assert.equal(String(height), meta('og:image:height'));
});

test('the picture stays under the weight WhatsApp silently drops', () => {
  // Meta documents 600 KB; WhatsApp drops the thumbnail somewhere around 300 KB
  // and reports nothing. 200 KB is the margin, not the limit - the 195 KB PNG
  // this replaced broke no documented rule and still came back without a card.
  const bytes = fs.readFileSync(path.join(root, 'public', path.basename(new URL(meta('og:image')).pathname)));
  assert.ok(bytes.length < 200 * 1024, `${Math.round(bytes.length / 1024)} KB is too close to the threshold`);
});

test('the card carries the text a preview needs', () => {
  assert.equal(meta('og:title'), 'DragCanvas — Visual Website Builder');
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.ok(meta('og:description')?.length > 20);
  assert.ok(meta('og:url')?.startsWith('https://'));
});
