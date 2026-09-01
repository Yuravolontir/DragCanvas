/**
 * The entrances a generated page arrives with.
 *
 * The prompt has asked for staggered rows all along and nothing checked, so
 * when the model skipped the ANIMATION block the page fell back to one uniform
 * section fade and nothing inside a section moved at all. Half of these cases
 * are the repair; the other half are the promises it must not break, because
 * the thing worse than a page that under-animates is one that changed unasked.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { staggerAnimations, countAuthoredAnimation } from '../utils/ai.animation.js';
import { normalizeLayout } from '../utils/ai.helpers.js';
import { readAnimation, DEFAULT_ANIMATION, ANIMATION_NAMES } from '../src/utils/animation.js';

const node = (type, props = {}, children = []) => ({ type, props, children });
const layoutOf = (...sections) => ({ sections });
const row = (...cards) => node('Columns', {}, cards);
const card = (label) => node('Container', {}, [node('Text', { text: label })]);

const delays = (nodes) => nodes.map((n) => n.props.animationDelay);

// ---------- the case the pass exists for ----------

test('a row of cards arrives one after another', () => {
  const cards = [card('one'), card('two'), card('three')];
  staggerAnimations(layoutOf(node('Container', {}, [row(...cards)])));

  assert.deepEqual(delays(cards), [0, 90, 180], 'the rhythm the prompt asks for in prose');
  for (const c of cards) assert.equal(c.props.animation, 'fadeUp');
});

test('a heading, its sentence and the row below share one sequence', () => {
  const heading = node('Heading', { text: 'Ship faster' });
  const text = node('Text', { text: 'A sentence.' });
  const cards = [card('one'), card('two')];
  staggerAnimations(layoutOf(node('Container', {}, [heading, text, row(...cards)])));

  assert.deepEqual(delays([heading, text, ...cards]), [0, 90, 180, 270], 'reading order, not nesting order');
});

test('the rhythm stops running away', () => {
  const many = Array.from({ length: 9 }, (_, i) => card(`card ${i}`));
  staggerAnimations(layoutOf(node('Container', {}, [row(...many)])));

  assert.deepEqual(delays(many), [0, 90, 180, 270, 360, 360, 360, 360, 360]);
});

test('a picture grows into place rather than rising', () => {
  const picture = node('Image', { src: 'x.jpg' });
  const words = node('Text', { text: 'beside it' });
  staggerAnimations(layoutOf(node('Container', {}, [picture, words])));

  assert.equal(picture.props.animation, 'zoomIn');
  assert.equal(words.props.animation, 'fadeUp');
});

// ---------- what it must not touch ----------

test('a choice the model made is never overruled', () => {
  const chosen = node('Text', { text: 'mine', animation: 'blurIn', animationDelay: 500 });
  const other = node('Text', { text: 'theirs' });
  staggerAnimations(layoutOf(node('Container', {}, [chosen, other])));

  assert.equal(chosen.props.animation, 'blurIn');
  assert.equal(chosen.props.animationDelay, 500);
});

test('"none" is a choice, and it survives', () => {
  const still = node('Text', { text: 'still', animation: 'none' });
  staggerAnimations(layoutOf(node('Container', {}, [still, node('Text', { text: 'other' })])));

  assert.equal(still.props.animation, 'none');
});

test('an animated card keeps the gap it left in the row', () => {
  const cards = [card('one'), card('two'), card('three')];
  cards[1].props.animation = 'pop';
  staggerAnimations(layoutOf(node('Container', {}, [row(...cards)])));

  assert.deepEqual([cards[0].props.animationDelay, cards[2].props.animationDelay], [0, 180],
    'the third still arrives third');
});

test('the sections themselves are left exactly as they were', () => {
  const section = node('Container', {}, [card('one'), card('two')]);
  staggerAnimations(layoutOf(section));

  assert.equal(section.props.animation, undefined, 'the fadeUp fallback still speaks for it');
  assert.equal(readAnimation(section.props, DEFAULT_ANIMATION.Container).name, 'fadeUp');
});

test('a navbar, a spacer and a divider never move', () => {
  const nav = node('NavbarElement', { variant: 'dark' });
  const spacer = node('Spacer', {});
  const divider = node('Divider', {});
  staggerAnimations(layoutOf(node('Container', {}, [nav, spacer, divider, node('Text', { text: 'a' }), node('Text', { text: 'b' })])));

  for (const n of [nav, spacer, divider]) assert.equal(n.props.animation, undefined);
});

test('the hero footage is looked through, not faded in', () => {
  const heading = node('Heading', { text: 'On footage' });
  const button = node('Button', { text: 'Start' });
  const video = node('Video', { sourceType: 'background' }, [heading, button]);
  staggerAnimations(layoutOf(node('Container', {}, [video])));

  assert.equal(video.props.animation, undefined, 'scenery does not arrive');
  assert.deepEqual(delays([heading, button]), [0, 90], 'the words on it do');
});

test('footage standing among siblings is looked through too', () => {
  // The hero clip is usually a section's only child, which reaches the same
  // rule by a different road. This is the road the other case does not take.
  const heading = node('Heading', { text: 'On footage' });
  const video = node('Video', { sourceType: 'background' }, [heading]);
  const caption = node('Text', { text: 'below' });
  staggerAnimations(layoutOf(node('Container', {}, [video, caption])));

  assert.equal(video.props.animation, undefined, 'scenery does not arrive, wherever it stands');
  assert.equal(heading.props.animation, 'fadeUp');
});

test('a lone element is left to the section fading up around it', () => {
  const only = node('Heading', { text: 'Just me' });
  staggerAnimations(layoutOf(node('Container', {}, [only])));

  assert.equal(only.props.animation, undefined, 'one arrival is not a stagger');
});

test('a card arrives whole, its contents riding along', () => {
  const label = node('Text', { text: 'inside' });
  const cards = [node('Container', {}, [label]), card('two')];
  staggerAnimations(layoutOf(node('Container', {}, [row(...cards)])));

  assert.equal(cards[0].props.animation, 'fadeUp');
  assert.equal(label.props.animation, undefined, 'a caption must not arrive before its card');
});

// ---------- shape ----------

test('running it twice changes nothing the second time', () => {
  const build = () => {
    const cards = [card('one'), card('two'), card('three')];
    return { cards, layout: layoutOf(node('Container', {}, [row(...cards)])) };
  };
  const first = build();
  staggerAnimations(first.layout);
  const once = JSON.stringify(first.layout);
  staggerAnimations(first.layout);
  assert.equal(JSON.stringify(first.layout), once);
});

test('every entrance it writes is one the editor knows', () => {
  const cards = [card('a'), node('Image', { src: 'x' }), card('c')];
  staggerAnimations(layoutOf(node('Container', {}, [row(...cards)])));
  for (const c of cards) assert.ok(ANIMATION_NAMES.includes(c.props.animation));
});

test('multipage layouts are staggered on every page', () => {
  const cards = [card('one'), card('two')];
  staggerAnimations({
    pages: [
      { name: 'Home', slug: 'home', sections: [node('Container', {}, [])] },
      { name: 'About', slug: 'about', sections: [node('Container', {}, [row(...cards)])] },
    ],
  });
  assert.deepEqual(delays(cards), [0, 90]);
});

test('counting only counts what the model itself wrote', () => {
  const bare = layoutOf(node('Container', {}, [card('one'), card('two')]));
  assert.equal(countAuthoredAnimation(bare), 0);
  bare.sections[0].children[0].props.animation = 'fade';
  assert.equal(countAuthoredAnimation(bare), 1);
});

// ---------- the answer the model actually sent ----------

test('a malformed answer is counted, not crashed on', () => {
  /*
   * countAuthoredAnimation reads the model's answer before normalisation -
   * that is the point of it, since normalisation is what fills the gaps in.
   * But nothing has straightened the shape out yet either, and a model that
   * writes `children` as an object is a model whose page is still repairable.
   *
   * This threw. It threw on every one of the three attempts, so the whole
   * generation answered 502, which the error middleware redacts into
   * "Something went wrong on our side" - a sentence that says nothing about a
   * page that was one repair away from being fine.
   */
  const shapes = [
    { sections: [{ type: 'Container', props: {}, children: { nested: true } }] },
    { sections: 'not a list' },
    { sections: [null, undefined, 7] },
    { pages: [{ name: 'Home' }] },
    { pages: [{ sections: { nested: true } }] },
    { pages: 'not a list' },
    {},
    null,
    [],
  ];

  for (const shape of shapes) {
    const seen = JSON.stringify(shape);
    assert.doesNotThrow(() => countAuthoredAnimation(shape), `counting ${seen}`);
    assert.doesNotThrow(() => staggerAnimations(shape), `staggering ${seen}`);
  }
});

test('an odd shape is read as nothing rather than guessed at', () => {
  assert.equal(countAuthoredAnimation({ sections: [{ type: 'Container', props: {}, children: { a: 1 } }] }), 0);
});

// ---------- the whole path ----------

test('a model answer with no animation at all comes out of normalisation moving', () => {
  const out = normalizeLayout({ sections: [
    { type: 'Container', props: { background: { r: 18, g: 18, b: 28, a: 1 } }, children: [
      { type: 'Heading', props: { text: 'Ship faster', fontSize: '48' }, children: [] },
      { type: 'Columns', props: {}, children: [
        { type: 'Container', props: {}, children: [{ type: 'Text', props: { text: 'one' }, children: [] }] },
        { type: 'Container', props: {}, children: [{ type: 'Text', props: { text: 'two' }, children: [] }] },
        { type: 'Container', props: {}, children: [{ type: 'Text', props: { text: 'three' }, children: [] }] },
      ] },
    ] },
  ] });

  const [heading, columns] = out.sections[0].children;
  assert.equal(heading.props.animation, 'fadeUp');
  assert.deepEqual(delays(columns.children), [90, 180, 270], 'the cards follow the heading');
});
