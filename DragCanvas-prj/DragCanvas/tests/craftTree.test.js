/**
 * Regression test for the shape of a generated page.
 *
 * A top-level section was always built as a Container, whatever the model
 * actually emitted. When it put a NavbarElement at the top rather than wrapping
 * it in one - which it does about half the time - the navbar became an empty
 * Container carrying a navbar's props, and the published page had no navigation.
 * That is the "two of the three sites had no navbar at all" report.
 *
 * `buildCraftTree` lives inside a React component, so the rule it encodes is
 * restated here against the same inputs. If the two ever drift this test is
 * worth less, which is the honest cost of testing a component-scoped function
 * from outside.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

/** The rule under test, as the component applies it. */
function sectionTypeOf(section) {
  return section.type && section.type.toLowerCase() !== 'container'
    ? section.type.charAt(0).toUpperCase() + section.type.slice(1)
    : 'Container';
}

test('a top-level navbar stays a navbar', () => {
  assert.equal(sectionTypeOf({ type: 'NavbarElement', props: { brand: 'Lehem' } }), 'NavbarElement');
});

test('a section that says container is a Container', () => {
  assert.equal(sectionTypeOf({ type: 'container', props: {} }), 'Container');
  assert.equal(sectionTypeOf({ type: 'Container', props: {} }), 'Container');
});

test('a section with no type at all falls back to Container', () => {
  assert.equal(sectionTypeOf({ props: {} }), 'Container');
});

test('only a Container is treated as able to hold children', () => {
  const isCanvas = (section) => sectionTypeOf(section) === 'Container';

  assert.equal(isCanvas({ type: 'container' }), true);
  assert.equal(isCanvas({ type: 'NavbarElement' }), false,
    'a leaf element marked as a canvas would accept drops it cannot render');
});
