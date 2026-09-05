/**
 * The difference between "this is broken" and "this is probably not what you
 * meant", at the moment a site becomes public.
 *
 * Preflight already refused to publish real faults. What it had no way to say
 * was the quieter thing: a default left in place, plausible enough to survive a
 * read-through and wrong for this particular site. A booking element publishes
 * whatever hours its props hold and those start at UTC, so a site could offer
 * visitors a working day belonging to nobody, bookable, with nothing anywhere
 * pointing it out.
 *
 * The restraint matters as much as the check. A warning must never refuse a
 * publish, and the list must stay short enough to be read.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { inspectBeforePublish, blockersIn, warningsIn } from '../src/utils/publishPreflight.js';

const map = (nodes) => Object.fromEntries(nodes.map((node, i) => [`n${i}`, node]));
const node = (resolvedName, props = {}) => ({ type: { resolvedName }, props });
/** A page with nothing wrong on it, so a case tests only what it adds. */
const sound = (...extra) => map([node('Heading', { level: 1, text: 'Title' }), ...extra]);
const codes = (issues) => issues.map((issue) => issue.code).sort();

test('a booking element left in UTC is worth a sentence', () => {
  const issues = inspectBeforePublish(sound(node('Booking', {})), { title: 'Clinic' });
  assert.deepEqual(codes(warningsIn(issues)), ['booking-utc']);
  assert.deepEqual(blockersIn(issues), [], 'and it must not stop the publish');
});

test('a booking element given a real time zone says nothing', () => {
  const issues = inspectBeforePublish(sound(node('Booking', { timeZone: 'Asia/Jerusalem' })), { title: 'Clinic' });
  assert.deepEqual(warningsIn(issues), []);
});

test('a map still sitting where it was dropped is worth a sentence', () => {
  const issues = inspectBeforePublish(sound(node('Map', { lat: 32.3215, lng: 34.8532 })), { title: 'Cafe' });
  assert.deepEqual(codes(warningsIn(issues)), ['map-default-location']);
});

test('a map that has been moved says nothing', () => {
  const issues = inspectBeforePublish(sound(node('Map', { lat: 51.5072, lng: -0.1276 })), { title: 'Cafe' });
  assert.deepEqual(warningsIn(issues), []);
});

test('a real fault is still a blocker, not a warning', () => {
  // The whole point of the split is that these keep refusing.
  const issues = inspectBeforePublish(sound(node('Image', { src: 'x.jpg', alt: '' })), { title: 'Shop' });
  assert.deepEqual(codes(blockersIn(issues)), ['missing-alt']);
  assert.deepEqual(warningsIn(issues), []);
});

test('every issue says how firmly it means it', () => {
  const issues = inspectBeforePublish(map([node('Booking', {}), node('Image', { src: 'x.jpg', alt: '' })]), { title: '' });
  assert.ok(issues.length > 2);
  for (const issue of issues) {
    assert.ok(['blocker', 'warning'].includes(issue.severity), `${issue.code} has a severity`);
  }
  assert.equal(blockersIn(issues).length + warningsIn(issues).length, issues.length,
    'and every issue lands in exactly one of the two');
});

test('a sound page is silent', () => {
  assert.deepEqual(inspectBeforePublish(sound(), { title: 'Fine' }), []);
});

test('the same warning twice is still one sentence', () => {
  const issues = inspectBeforePublish(sound(node('Booking', {}), node('Booking', {})), { title: 'Clinic' });
  assert.equal(warningsIn(issues).length, 1, 'a list nobody reads is worse than no list');
});

test('publishing asks about warnings and refuses only blockers', () => {
  // The flow lives beside the exporter, not in the header that triggers it.
  const source = fs.readFileSync(
    new URL('../src/editor/projectPublishing.js', import.meta.url), 'utf8');
  const publish = source.slice(source.indexOf('const blockers = blockersIn(issues)'));

  const refusal = publish.indexOf('Fix these items before publishing');
  const question = publish.indexOf('Publish anyway');
  assert.ok(refusal > -1 && question > -1, 'both paths exist');
  assert.ok(refusal < question, 'a blocker is dealt with before anything is asked');
  assert.ok(!/warningsIn\(issues\)[\s\S]{0,200}Fix these items/.test(publish),
    'a warning may never be turned into a refusal');
});
