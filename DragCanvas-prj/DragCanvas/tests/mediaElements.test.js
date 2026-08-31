/**
 * The media elements, on both sides of the publish step.
 *
 * Image, Video and YouTube are read twice - once by the canvas and once by the
 * exporter - so the helpers they share are tested directly, and the published
 * markup is tested for the promises the Properties panels now make: a YouTube
 * link in any form works, a video loops or does not, a caption sits over the
 * clip, and an element sized in pixels still fits a phone.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { imageAltText, videoMode, youTubeId } from '../src/utils/elementData.js';
import { exportToHtml } from '../src/utils/exportToHtml.js';

const page = (name, props) => ({
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['x'] },
  x: { type: { resolvedName: name }, isCanvas: false, props, nodes: [] },
});

test('a YouTube video is recognised however the owner copied it', () => {
  assert.equal(youTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youTubeId('https://www.youtube.com/watch?list=PL1&v=dQw4w9WgXcQ&t=30'), 'dQw4w9WgXcQ');
  assert.equal(youTubeId('https://youtu.be/dQw4w9WgXcQ?si=abc'), 'dQw4w9WgXcQ');
  assert.equal(youTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youTubeId('https://vimeo.com/12345'), '');
  assert.equal(youTubeId(''), '');
});

test('a picture with no description falls back to its file name, not to noise', () => {
  assert.equal(imageAltText({ alt: 'Written by hand', src: 'x/other.jpg' }), 'Written by hand');
  assert.equal(imageAltText({ src: 'https://cdn.example.com/sourdough-loaves.jpg' }), 'Sourdough loaves');
  assert.equal(imageAltText({ src: 'https://cdn.example.com/team_photo_2024.png?w=800' }), 'Team photo 2024');
  assert.equal(imageAltText({ src: 'https://cdn.example.com/a1b2c3d4e5f67890.webp' }), '');
  assert.equal(imageAltText({}), '');
});

test('a video node saved under any of the three modes is still read correctly', () => {
  assert.equal(videoMode({ sourceType: 'background', src: 'a.mp4' }), 'background');
  assert.equal(videoMode({ sourceType: 'youtube', videoId: 'dQw4w9WgXcQ' }), 'youtube');
  assert.equal(videoMode({ sourceType: 'file', videoUrl: 'a.mp4' }), 'file');
  // Saved before sourceType existed: the filled-in field is the only clue.
  assert.equal(videoMode({ videoId: 'dQw4w9WgXcQ' }), 'youtube');
  assert.equal(videoMode({ videoUrl: 'a.mp4' }), 'file');
});

test('the YouTube element publishes as an embed that fits a phone', () => {
  const html = exportToHtml(
    page('YouTube', { video: 'https://youtu.be/dQw4w9WgXcQ', width: '560px', height: '315px' }),
    'clip'
  );
  assert.match(html, /src="https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ"/);
  assert.match(html, /class="youtube-\d+"/);
  assert.match(html, /max-width: 100%/);
  assert.match(html, /@media \(max-width: 768px\)[\s\S]*width: 100%/);
});

test('a YouTube element with nothing pasted into it publishes nothing', () => {
  const html = exportToHtml(page('YouTube', { video: '' }), 'clip');
  assert.ok(!html.includes('youtube.com/embed'));
});

test('an old Video node holding a YouTube id still publishes as that video', () => {
  const html = exportToHtml(page('Video', { sourceType: 'youtube', videoId: 'IwzUs1IMdyQ' }), 'legacy');
  assert.match(html, /src="https:\/\/www\.youtube\.com\/embed\/IwzUs1IMdyQ"/);
});

test('a video file publishes with its loop and its caption centred over the clip', () => {
  const looping = exportToHtml(
    page('Video', { sourceType: 'file', videoUrl: 'https://example.com/tour.mp4', text: 'Watch the tour' }),
    'tour'
  );
  assert.match(looping, /<source src="https:\/\/example\.com\/tour\.mp4">/);
  assert.match(looping, /\bloop\b/);
  assert.match(looping, /<span>Watch the tour<\/span>/);
  // Centring is the whole promise of the caption control.
  assert.match(looping, /align-items: center/);
  assert.match(looping, /justify-content: center/);

  const once = exportToHtml(
    page('Video', { sourceType: 'file', videoUrl: 'https://example.com/tour.mp4', loop: false }),
    'tour'
  );
  assert.ok(!/\n\s+loop\b/.test(once), 'a video told to stop must not loop on the published page');
});

test('a background video hero is untouched by the split', () => {
  const html = exportToHtml(
    page('Video', { sourceType: 'background', src: 'https://example.com/loop.mp4', poster: 'https://example.com/p.jpg' }),
    'hero'
  );
  assert.match(html, /https:\/\/example\.com\/loop\.mp4/);
  assert.match(html, /poster="https:\/\/example\.com\/p\.jpg"/);
});

test('a published image describes itself even though Properties stopped asking', () => {
  const html = exportToHtml(page('Image', { src: 'https://example.com/harbour-at-dawn.jpg' }), 'photo');
  assert.match(html, /alt="Harbour at dawn"/);
});

test('a map inserted at a fixed width is capped to the screen when published', () => {
  const html = exportToHtml(page('Map', { lat: 32.0853, lng: 34.7818, width: '560px', height: '320px' }), 'here');
  assert.match(html, /width: 560px/);
  assert.match(html, /max-width: 100%/);
});

test('a payment button publishes as a new-tab link to any checkout, and refuses a script', () => {
  const good = exportToHtml(
    page('Button', { text: 'Buy now', action: 'payment', actionValue: 'buy.example.com/plan' }),
    'shop'
  );
  assert.match(good, /href="https:\/\/buy\.example\.com\/plan"/);
  assert.match(good, /target="_blank" rel="noopener noreferrer"/);
  assert.match(good, />Buy now<\/a>/);

  const bad = exportToHtml(
    page('Button', { text: 'Buy now', action: 'payment', actionValue: 'javascript:alert(1)' }),
    'shop'
  );
  assert.ok(!bad.includes('javascript:'), 'a script must never become a checkout link');
  assert.match(bad, /<button class="button-\d+" type="button">Buy now<\/button>/);
});
