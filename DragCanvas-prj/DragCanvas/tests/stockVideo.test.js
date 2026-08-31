/**
 * The background hero, and the two things that were keeping it rare.
 *
 * One template in fifteen used the strongest element in the editor, and the
 * generator would sooner reach for a YouTube embed. Half of that was the prompt
 * talking anyone out of it; the other half was that a generated hero only got a
 * real clip when a stock-photo API key happened to be configured, and shipped
 * the literal string VIDEO_PLACEHOLDER_1 when it was not.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { STOCK_CLIPS, DEFAULT_CLIP, clipFor, pickStockClip } from '../src/utils/stockVideo.js';
import { fillRemainingVideoPlaceholders } from '../utils/ai.helpers.js';
import { exportToHtml } from '../src/utils/exportToHtml.js';

/* ---------------------------------------------------------------- *
 * The catalogue
 * ---------------------------------------------------------------- */

test('every clip is a described, playable file under its own topic', () => {
  const topics = new Set();
  for (const clip of STOCK_CLIPS) {
    assert.match(clip.url, /^https:\/\/videos\.pexels\.com\/video-files\/\d+\/[\w-]+\.mp4$/, clip.topic);
    assert.ok(clip.description, `${clip.topic} has no description`);
    assert.ok(clip.keywords.length, `${clip.topic} can never be picked`);
    assert.ok(!topics.has(clip.topic), `two clips claim the topic ${clip.topic}`);
    topics.add(clip.topic);
  }
});

test('the clips are landscape, which is the only shape a hero can use', () => {
  for (const clip of STOCK_CLIPS) {
    const [, width, height] = clip.url.match(/_(\d{3,4})_(\d{3,4})_\d+fps\.mp4$/) || [];
    assert.ok(width, `${clip.topic} does not say what shape it is`);
    assert.ok(Number(width) > Number(height), `${clip.topic} is portrait`);
    assert.ok(Number(width) <= 2048, `${clip.topic} is too large to autoplay behind a headline`);
  }
});

test('a subject finds its clip, and no subject still finds one', () => {
  assert.equal(pickStockClip('a small bakery in Tel Aviv').topic, 'bakery');
  assert.equal(pickStockClip('SPECIALITY COFFEE ROASTERS').topic, 'coffee');
  assert.equal(pickStockClip('a gym for climbers').topic, 'fitness');
  assert.equal(pickStockClip('two-day conference on interface design').topic, 'event');

  // Never nothing: this runs after a real stock search has already failed, and
  // a plausible clip behind a headline beats a broken one every time.
  assert.equal(pickStockClip('').topic, DEFAULT_CLIP.topic);
  assert.equal(pickStockClip(undefined).topic, DEFAULT_CLIP.topic);
  assert.equal(pickStockClip('zzzz').topic, DEFAULT_CLIP.topic);
});

test('a template can ask for a clip by name, and a wrong name still answers', () => {
  assert.equal(clipFor('travel').topic, 'travel');
  assert.equal(clipFor('nonsense').topic, DEFAULT_CLIP.topic);
});

/* ---------------------------------------------------------------- *
 * Nothing unresolved reaches the canvas
 * ---------------------------------------------------------------- */

test('a surviving placeholder becomes a real clip wherever it sits', () => {
  const layout = {
    sections: [{
      props: {},
      children: [
        { type: 'Video', props: { sourceType: 'background', src: 'VIDEO_PLACEHOLDER_1', poster: 'p.jpg' } },
        { type: 'Video', props: { sourceType: 'file', videoUrl: 'VIDEO_PLACEHOLDER_2', videoId: 'abc123' } },
      ],
    }],
  };
  fillRemainingVideoPlaceholders(layout, 'a coffee roastery');

  const [background, plain] = layout.sections[0].children;
  assert.equal(background.props.src, clipFor('coffee').url);
  assert.equal(plain.props.videoUrl, clipFor('coffee').url);
  // A url and an embed id are mutually exclusive on that element.
  assert.equal(plain.props.videoId, '');
  assert.doesNotMatch(JSON.stringify(layout), /VIDEO_PLACEHOLDER/);
});

test('filling placeholders touches nothing that is not one', () => {
  const layout = {
    sections: [{
      props: { anchor: 'home' },
      children: [
        { type: 'Image', props: { src: 'https://picsum.photos/seed/loaves/800/400', alt: 'Loaves' } },
        { type: 'Video', props: { sourceType: 'background', src: 'https://example.com/mine.mp4' } },
      ],
    }],
  };
  const before = JSON.stringify(layout);
  fillRemainingVideoPlaceholders(layout, 'a bakery');
  assert.equal(JSON.stringify(layout), before);
});

/* ---------------------------------------------------------------- *
 * What the published hero does
 * ---------------------------------------------------------------- */

const videoPage = (props) => ({
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['v'] },
  v: {
    type: { resolvedName: 'Video' },
    isCanvas: true,
    props: { sourceType: 'background', overlay: 55, minHeight: '520px', ...props },
    nodes: ['h'],
    parent: 'ROOT',
  },
  h: { type: { resolvedName: 'Heading' }, props: { text: 'Open at six' }, nodes: [], parent: 'v' },
});

test('a background hero publishes its clip behind its own children', () => {
  const html = exportToHtml(videoPage({
    src: clipFor('bakery').url,
    poster: 'https://picsum.photos/seed/loaves/1600/900',
  }), 'hero');

  assert.match(html, /<video muted loop playsinline/);
  assert.match(html, /poster="https:\/\/picsum\.photos\/seed\/loaves\/1600\/900"/);
  // Loaded by script, not by the parser: a hero clip must not hold up the page.
  assert.match(html, /preload="none"/);
  assert.match(html, new RegExp(`data-src="${clipFor('bakery').url.replace(/[/.]/g, '\\$&')}"`));
  assert.match(html, /Open at six/);
});

test('a hero with only a poster ships no player and no script', () => {
  const html = exportToHtml(videoPage({ poster: 'https://picsum.photos/seed/loaves/1600/900' }), 'still');
  assert.doesNotMatch(html, /<video/);
  assert.doesNotMatch(html, /playsinline/);
  // The poster is still the section's background, so the hero is not empty.
  assert.match(html, /background-image: url\('https:\/\/picsum\.photos\/seed\/loaves\/1600\/900'\)/);
});

test('a video hero is a section a navigation link can reach', () => {
  // The exporter disables links that point at nothing, so a hero that kept its
  // generated id instead of its anchor turned the navbar's own Home link inert.
  const html = exportToHtml({
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['n', 'v'] },
    n: {
      type: { resolvedName: 'NavbarElement' },
      props: { brand: 'Studio', links: [{ text: 'Home', href: '#home' }] },
      nodes: [], parent: 'ROOT',
    },
    v: {
      type: { resolvedName: 'Video' },
      isCanvas: true,
      props: { sourceType: 'background', anchor: 'home', src: clipFor('studio').url, poster: 'p.jpg' },
      nodes: [], parent: 'ROOT',
    },
  }, 'anchored');

  assert.match(html, /<div class="backgroundvideo-\d+" id="home">/);
  assert.match(html, /href="#home"/);
  // One id, and the loader has to be looking for that one.
  assert.match(html, /getElementById\('home'\)/);
});
