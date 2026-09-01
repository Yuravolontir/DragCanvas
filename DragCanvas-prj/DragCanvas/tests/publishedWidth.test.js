/**
 * How wide a site is once it is published.
 *
 * The root container's width is the canvas somebody composed on - 800px for a
 * blank project, and an authoring aid rather than a decision about the finished
 * site. The exporter used to carry it through as a max-width, so a site
 * published as an 800px strip down the middle of the screen with the background
 * showing either side of it. Fifteen gallery templates escaped it only by
 * setting their own root to 100%, which is the same thing said by hand.
 *
 * The two halves are separate on purpose and both are checked here: the editor
 * keeps its column, and the published page fills the window.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { exportToHtml } from '../src/utils/exportToHtml.js';
import { buildCraftTree } from '../src/utils/craftTree.js';

/** The class the exporter gave the root, and the rule it wrote for it. */
function rootRule(html) {
  const cls = html.match(/<body>[\s\S]*?class="([a-z]+-\d+)"/)?.[1];
  if (!cls) return null;
  return html.match(new RegExp(`\\.${cls} \\{([^}]*)\\}`))?.[1] ?? null;
}

/** One small page, composed on a canvas of the given width. */
function page(rootWidth) {
  const { nodes } = buildCraftTree([
    { type: 'Container', props: { background: { r: 20, g: 20, b: 20, a: 1 } }, children: [
      { type: 'Heading', props: { text: 'Wide open', fontSize: '48', level: 1 }, children: [] },
    ] },
  ], '');
  nodes.ROOT.props.width = rootWidth;
  return nodes;
}

test('a published page is as wide as the window, whatever it was drawn on', () => {
  const rule = rootRule(exportToHtml(page('800px'), 'Site'));
  assert.ok(rule, 'the root gets a rule of its own');
  assert.match(rule, /max-width:\s*100%/);
  assert.doesNotMatch(rule, /max-width:\s*800px/, 'the canvas width is not a published constraint');
});

test('a canvas somebody widened publishes the same way', () => {
  // Whatever the root says, the answer is the window - there is nothing to
  // carry through, so nothing can be carried through wrongly.
  const rule = rootRule(exportToHtml(page('100%'), 'Site'));
  assert.match(rule, /max-width:\s*100%/);
});

test('the editor still hands out a column to compose on', () => {
  // The other half of the split. Fixing the published page by widening the
  // canvas is what this replaced.
  const { nodes } = buildCraftTree([{ type: 'Container', props: {}, children: [] }], '');
  assert.match(String(nodes.ROOT.props.width), /px$/, 'a fixed canvas, not the window');
});
