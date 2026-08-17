/**
 * Regression tests for the structure of a published page.
 *
 * The Text converter ended in `<h2>` unconditionally, so a page with thirty text
 * elements shipped thirty second-level headings and no `<h1>`. Body copy,
 * captions and image labels were all announced as headings: no subject for a
 * search engine, and an unusable outline for anyone navigating by heading.
 *
 * These are the two claims worth holding: prose publishes as prose, and a heading
 * publishes at the level it claims. Both are easy to lose the next time somebody
 * reaches for a bigger font.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const { exportToHtml } = await import('../src/utils/exportToHtml.js');

function page(children) {
  const nodes = {
    ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, props: {}, nodes: children.map((_, i) => `n${i}`) },
  };
  children.forEach((c, i) => { nodes[`n${i}`] = { ...c, nodes: [] }; });
  return nodes;
}

const text = (t) => ({ type: { resolvedName: 'Text' }, props: { text: t } });
const heading = (t, level) => ({ type: { resolvedName: 'Heading' }, props: { text: t, level } });

test('prose publishes as prose', () => {
  const html = exportToHtml(page([text('One'), text('Two'), text('Three')]), 'test');

  assert.equal((html.match(/<p class=/g) || []).length, 3);
  assert.doesNotMatch(html, /<h2[^>]*>One</, 'a paragraph must not be a heading');
});

test('a heading publishes at the level it claims', () => {
  const html = exportToHtml(page([
    heading('The page', '1'),
    heading('A section', '2'),
    heading('Under it', '3'),
  ]), 'test');

  assert.match(html, /<h1[^>]*>The page<\/h1>/);
  assert.match(html, /<h2[^>]*>A section<\/h2>/);
  assert.match(html, /<h3[^>]*>Under it<\/h3>/);
});

test('a page has exactly one h1 when it declares one', () => {
  const html = exportToHtml(page([
    heading('The page', '1'),
    text('Body copy'),
    heading('A section', '2'),
    text('More copy'),
  ]), 'test');

  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.equal((html.match(/<p class=/g) || []).length, 2);
});

test('a nonsense level never reaches the document', () => {
  // Two different kinds of wrong, handled differently on purpose. A level of 9 is
  // a real intention out of range, so it clamps to the nearest legal one. A level
  // of 0 or an empty string is not a level at all, so it falls back to the default
  // rather than being coerced into an <h1> the author never asked for - an
  // accidental second <h1> is worse than a heading one level off.
  for (const [given, expected] of [['0', 2], ['9', 6], ['', 2], [undefined, 2], ['abc', 2]]) {
    const html = exportToHtml(page([heading('X', given)]), 'test');
    assert.match(html, new RegExp(`<h${expected}[^>]*>X</h${expected}>`),
      `level ${given} should render as h${expected}`);
  }
});
