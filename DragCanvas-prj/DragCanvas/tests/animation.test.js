/**
 * The entrance vocabulary, and what a published page does with it.
 *
 * Every rule here exists because the animation used to live in four places at
 * once: the canvas showed nothing, the published page faded every section up
 * over 450ms whatever the author wanted, and a page whose script never ran was
 * a page of invisible sections.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANIMATIONS,
  ANIMATION_NAMES,
  DEFAULT_ANIMATION,
  DEFAULT_DELAY,
  DEFAULT_DURATION,
  READY_CLASS,
  animationRuntime,
  animationStyleSheet,
  hasAnimation,
  readAnimation,
} from '../src/utils/animation.js';
import { exportToHtml } from '../src/utils/exportToHtml.js';

const page = (nodes) => ({
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: Object.keys(nodes) },
  ...Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [
      id,
      { isCanvas: false, nodes: [], parent: 'ROOT', ...node, type: { resolvedName: node.type } },
    ]),
  ),
});

/* ---------------------------------------------------------------- *
 * The vocabulary
 * ---------------------------------------------------------------- */

test('every entrance is offered under a name, and none of them collide', () => {
  assert.equal(new Set(ANIMATION_NAMES).size, ANIMATIONS.length);
  assert.ok(ANIMATIONS.every((entry) => entry.label));
  assert.equal(ANIMATIONS[0].value, 'none');
  assert.ok(ANIMATIONS.length >= 8, 'a menu with three entries is a switch, not a choice');
});

test('a stored animation is read back, and nonsense is not', () => {
  assert.equal(readAnimation({ animation: 'zoomIn' }).name, 'zoomIn');
  assert.equal(readAnimation({ animation: 'somersault' }).name, 'none');
  assert.equal(readAnimation({}).name, 'none');
  assert.equal(hasAnimation(readAnimation({ animation: 'fade' })), true);
  assert.equal(hasAnimation(readAnimation({})), false);
});

test('the fallback only speaks for a node that stored nothing', () => {
  // A page published before any of this keeps the entrance it was published
  // with; an author who picked None gets None, not the fallback back again.
  assert.equal(readAnimation({}, 'fadeUp').name, 'fadeUp');
  assert.equal(readAnimation({ animation: '' }, 'fadeUp').name, 'fadeUp');
  assert.equal(readAnimation({ animation: 'none' }, 'fadeUp').name, 'none');
  assert.equal(readAnimation({ animation: 'pop' }, 'fadeUp').name, 'pop');
});

test('timings are clamped rather than trusted', () => {
  assert.equal(readAnimation({ animation: 'fade' }).duration, DEFAULT_DURATION);
  assert.equal(readAnimation({ animation: 'fade' }).delay, DEFAULT_DELAY);
  assert.equal(readAnimation({ animation: 'fade', animationDuration: '450' }).duration, 450);
  assert.equal(readAnimation({ animation: 'fade', animationDuration: 999999 }).duration, 4000);
  assert.equal(readAnimation({ animation: 'fade', animationDelay: -80 }).delay, 0);
  assert.equal(readAnimation({ animation: 'fade', animationDuration: 'soon' }).duration, DEFAULT_DURATION);
  assert.equal(readAnimation({ animation: 'fade', animationRepeat: 'yes' }).repeat, false);
  assert.equal(readAnimation({ animation: 'fade', animationRepeat: true }).repeat, true);
});

test('the stylesheet describes every moving entrance and no still one', () => {
  const css = animationStyleSheet();
  for (const entry of ANIMATIONS) {
    if (entry.value === 'none') continue;
    assert.ok(css.includes(`@keyframes dc-${entry.value}`), `${entry.value} has no keyframes`);
    assert.ok(css.includes(`[data-dc-anim="${entry.value}"]`), `${entry.value} is never played`);
  }
  assert.ok(!css.includes('[data-dc-anim="none"]'));
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('nothing is hidden until something can un-hide it', () => {
  // Every hiding rule hangs off the ready class, which only a running script
  // adds. Without that a visitor with no JavaScript gets a blank page.
  // Keyframes are exempt: a @keyframes block hides nothing by itself, it is the
  // rule that plays it that has to be gated, and that is checked below.
  const sheet = animationStyleSheet().replace(/@keyframes[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');

  for (const [, selector, body] of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/opacity:\s*0\b/.test(body)) continue;
    assert.ok(
      selector.includes(`.${READY_CLASS}`),
      `"${selector.trim()}" hides something without waiting for .${READY_CLASS}`,
    );
  }

  for (const [, selector] of sheet.matchAll(/([^{}]+)\{[^{}]*animation:\s*dc-/g)) {
    assert.ok(
      selector.includes(`.${READY_CLASS}`),
      `"${selector.trim()}" plays an entrance without waiting for .${READY_CLASS}`,
    );
  }
});

test('an arrived element is left alone', () => {
  // A transition has to hold transform: none on the finished element, which
  // flattened whatever the element did for itself — an animated button stopped
  // lifting on hover. A keyframe with only a from block animates towards the
  // element's own styles and then lets go.
  const sheet = animationStyleSheet();
  assert.doesNotMatch(sheet, /transform:\s*none/);
  assert.doesNotMatch(sheet, /transition/);
  for (const [, body] of sheet.matchAll(/@keyframes[^{]*\{([\s\S]*?)\n/g)) {
    assert.doesNotMatch(body, /\bto\s*\{/, 'a to block pins the finished element in place');
  }
  assert.match(sheet, /backwards/);
});

test('the runtime lets go of what it has seen and keeps what replays', () => {
  const runtime = animationRuntime();
  assert.match(runtime, /arrive\.unobserve/);
  assert.match(runtime, /data-dc-repeat/);
  assert.match(runtime, /reduced \|\| !\('IntersectionObserver' in window\)/);
});

/* ---------------------------------------------------------------- *
 * What reaches the published page
 * ---------------------------------------------------------------- */

test('any element can be given an entrance', () => {
  const html = exportToHtml(page({
    a: { type: 'Heading', props: { text: 'Hi', animation: 'fadeLeft' } },
    b: { type: 'Button', props: { text: 'Go', animation: 'pop' } },
    c: { type: 'Divider', props: { animation: 'fade' } },
    d: { type: 'Quote', props: { text: 'Said so', animation: 'blurIn' } },
  }), 'many');

  assert.match(html, /<h2[^>]*data-dc-anim="fadeLeft"/);
  assert.match(html, /<button[^>]*data-dc-anim="pop"/);
  assert.match(html, /data-dc-anim="fade"/);
  assert.match(html, /data-dc-anim="blurIn"/);
});

test('a self-closing tag keeps its slash where it belongs', () => {
  const html = exportToHtml(page({
    a: { type: 'Image', props: { src: 'https://example.com/a.jpg', animation: 'zoomIn' } },
  }), 'image');
  assert.match(html, /<img[^>]*data-dc-anim="zoomIn"[^>]*\/>/);
  assert.doesNotMatch(html, /\/\s+data-dc-anim/);
});

test('sections still arrive the way they always did', () => {
  const html = exportToHtml(page({
    s: { type: 'Container', isCanvas: true, props: {} },
  }), 'section');
  assert.equal(DEFAULT_ANIMATION.Container, 'fadeUp');
  assert.match(html, /class="container-2" data-dc-anim="fadeUp"/);
});

test('a section told to stand still stands still', () => {
  const html = exportToHtml(page({
    s: { type: 'Container', isCanvas: true, props: { animation: 'none' } },
  }), 'still');
  assert.doesNotMatch(html, /data-dc-anim/);
  // Nothing animates, so the page carries neither the stylesheet nor the script.
  assert.doesNotMatch(html, new RegExp(READY_CLASS));
});

test('the page itself never arrives from anywhere', () => {
  const html = exportToHtml({
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: { animation: 'fadeUp' }, nodes: [] },
  }, 'root');
  assert.doesNotMatch(html, /data-dc-anim/);
});

test('a page that animates says so before it paints', () => {
  const html = exportToHtml(page({
    a: { type: 'Heading', props: { text: 'Hi', animation: 'fade' } },
  }), 'guard');
  const guard = html.indexOf(`classList.add("${READY_CLASS}")`);
  const body = html.indexOf('<body>');
  assert.ok(guard > -1, 'the ready class is never switched on');
  assert.ok(guard < body, 'the ready class is switched on after the page has painted');
});

test('timings become rules, and identical timings become one rule', () => {
  const html = exportToHtml(page({
    a: { type: 'Heading', props: { text: 'A', animation: 'fade', animationDelay: 100 } },
    b: { type: 'Heading', props: { text: 'B', animation: 'fade', animationDelay: 100 } },
    c: { type: 'Heading', props: { text: 'C', animation: 'fade', animationDuration: 900 } },
  }), 'timings');

  const rules = html.match(/\[data-dc-t="[^"]+"\] \{[^}]+\}/g) || [];
  assert.equal(rules.length, 2, 'three staggered elements over two timings need two rules');
  assert.ok(rules.some((rule) => rule.includes('--dc-delay: 100ms')));
  assert.ok(rules.some((rule) => rule.includes('--dc-duration: 900ms')));
});

test('a default timing needs no rule of its own', () => {
  const html = exportToHtml(page({
    a: { type: 'Heading', props: { text: 'A', animation: 'fade' } },
  }), 'plain');
  assert.doesNotMatch(html, /data-dc-t=/);
});

test('replaying is marked on the element that asked for it', () => {
  const html = exportToHtml(page({
    a: { type: 'Heading', props: { text: 'A', animation: 'fade', animationRepeat: true } },
    b: { type: 'Heading', props: { text: 'B', animation: 'fade' } },
  }), 'repeat');
  assert.equal((html.match(/data-dc-repeat="1"/g) || []).length, 1);
});

test('a page with nothing to animate carries no animation code', () => {
  const html = exportToHtml({
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: ['a'] },
    a: { type: { resolvedName: 'Heading' }, props: { text: 'Hi', animation: 'none' }, nodes: [], parent: 'ROOT' },
  }, 'quiet');
  assert.doesNotMatch(html, /data-dc-anim/);
  assert.doesNotMatch(html, /IntersectionObserver/);
});

test('the published script parses', () => {
  const html = exportToHtml(page({
    a: { type: 'Heading', props: { text: 'A', animation: 'fade', animationRepeat: true } },
  }), 'parse');
  for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => new Function(code));
  }
});
