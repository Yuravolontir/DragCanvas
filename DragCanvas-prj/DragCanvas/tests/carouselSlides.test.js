/**
 * The carousel's slides used to be twelve flat props and are an array now.
 *
 * Six built templates, every saved project and every live published site still
 * carry the flat shape, so `readSlides` has to keep reading it. These tests are
 * the contract between the old data and the new component — if they go red, a
 * published site somewhere lost its slides.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { readSlides, emptySlide } from '../src/utils/carouselSlides.js';

test('an array of slides is used as given', () => {
  const slides = readSlides({
    slides: [
      { src: 'a.jpg', heading: 'One', label: 'New', text: 'First' },
      { src: 'b.jpg', heading: 'Two' },
    ],
  });
  assert.equal(slides.length, 2);
  assert.equal(slides[0].src, 'a.jpg');
  assert.equal(slides[0].text, 'First');
  // missing fields become empty strings, never undefined
  assert.equal(slides[1].label, '');
  assert.equal(slides[1].text, '');
});

test('the legacy three-prop shape still reads as three slides', () => {
  const slides = readSlides({
    src1: 'a.jpg', src2: 'b.jpg', src3: 'c.jpg',
    heading1: 'One', heading2: 'Two', heading3: 'Three',
    label1: 'Featured', label2: 'New', label3: 'Hot',
    p1: 'First', p2: 'Second', p3: 'Third',
  });
  assert.equal(slides.length, 3);
  assert.deepEqual(
    slides.map((s) => [s.src, s.heading, s.label, s.text]),
    [
      ['a.jpg', 'One', 'Featured', 'First'],
      ['b.jpg', 'Two', 'New', 'Second'],
      ['c.jpg', 'Three', 'Hot', 'Third'],
    ]
  );
});

test('a legacy slot without an image is not a slide', () => {
  const slides = readSlides({ src1: 'a.jpg', heading1: 'Only one', src2: '', src3: '' });
  assert.equal(slides.length, 1);
  assert.equal(slides[0].heading, 'Only one');
});

test('an array wins over leftover legacy props', () => {
  const slides = readSlides({
    slides: [{ src: 'new.jpg', heading: 'Edited' }],
    src1: 'old.jpg', heading1: 'Stale',
  });
  assert.equal(slides.length, 1);
  assert.equal(slides[0].src, 'new.jpg');
});

test('an empty array falls back rather than showing nothing', () => {
  // Craft can hand back `slides: []` from a half-finished edit. Falling through
  // to the legacy props shows the user's three slides instead of a blank strip.
  const slides = readSlides({ slides: [], src1: 'a.jpg', heading1: 'One' });
  assert.equal(slides.length, 1);
});

test('a carousel with nothing in it reads as no slides', () => {
  assert.deepEqual(readSlides({}), []);
  assert.deepEqual(readSlides(), []);
});

test('alt falls back to the heading, because a background image had none', () => {
  const [withAlt, withoutAlt] = readSlides({
    slides: [
      { src: 'a.jpg', heading: 'The bar', alt: 'A long marble counter' },
      { src: 'b.jpg', heading: 'The roastery' },
    ],
  });
  assert.equal(withAlt.alt, 'A long marble counter');
  assert.equal(withoutAlt.alt, 'The roastery');
});

test('reading does not mutate the node props', () => {
  const props = { src1: 'a.jpg', heading1: 'One' };
  readSlides(props);
  assert.deepEqual(Object.keys(props).sort(), ['heading1', 'src1']);
  assert.equal(props.slides, undefined);
});

test('emptySlide is blank in every field', () => {
  assert.deepEqual(emptySlide(), { src: '', heading: '', label: '', text: '', href: '', alt: '' });
});
