/**
 * The node map a generated page becomes, checked against the one the editor
 * itself saves.
 *
 * A generated site appeared, looked right and published right, and could not be
 * edited: nothing could be picked up, moved or deleted. Craft joins a page in
 * two directions - a parent lists its children, a child names its parent - and
 * reads both out of the saved JSON rather than working either one out. Only the
 * downward half was being written, so every generated node answered "nobody"
 * when asked who its parent was.
 *
 * A shipped template is the reference, because it was saved by the editor and
 * is known to be editable. Comparing against it is the check that was missing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCraftTree } from '../src/utils/craftTree.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const sections = [
  { type: 'NavbarElement', props: { variant: 'dark' } },
  { type: 'Container', props: {}, children: [
    { type: 'Heading', props: { text: 'Ship faster' } },
    { type: 'Columns', props: {}, children: [
      { type: 'Container', props: {}, children: [{ type: 'Text', props: { text: 'one' } }] },
      { type: 'Container', props: {}, children: [{ type: 'Text', props: { text: 'two' } }] },
    ] },
  ] },
  { type: 'Video', props: { sourceType: 'background' }, children: [
    { type: 'Heading', props: { text: 'On footage' } },
  ] },
];

/** The node map of a template the editor saved, as the reference shape. */
function templateNodes() {
  const dir = path.join(root, 'scripts/templates-out');
  const raw = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir).find((f) => f.endsWith('.json'))), 'utf8'));
  const page = raw.pages ? raw.pages[0] : raw;
  const data = page.data ?? page;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

test('a generated node carries every field an editable node carries', () => {
  const { nodes } = buildCraftTree(sections);
  const reference = templateNodes();

  const fieldsOf = (map, pick) => Object.keys(map[Object.keys(map).find(pick)]).sort();
  const expected = fieldsOf(reference, (id) => id !== 'ROOT');
  const actual = fieldsOf(nodes, (id) => id !== 'ROOT');

  assert.deepEqual(actual, expected,
    'the editor saves this shape, so a page built any other way is a page it cannot open');
});

test('a generated page is composed on the same canvas as a blank one', () => {
  /*
   * The root's width is the drawing board, not the finished site. It was
   * briefly 100%, which fixed a published page by making the editor wrong:
   * composing on a canvas as wide as the window is not what anybody wants.
   *
   * The blank project's own canvas is the reference, so the two cannot drift.
   */
  const blank = fs.readFileSync(path.join(root, 'src/editor/DefaultProjectCanvas.jsx'), 'utf8');
  const canvasWidth = blank.match(/width="(\d+px)"/)?.[1];
  assert.ok(canvasWidth, 'the blank canvas states its width');

  const { nodes } = buildCraftTree(sections);
  assert.equal(nodes.ROOT.props.width, canvasWidth);
});

test('every node names its parent, and the parent claims it back', () => {
  const { nodes } = buildCraftTree(sections);

  for (const [id, node] of Object.entries(nodes)) {
    if (id === 'ROOT') {
      assert.equal(node.parent, undefined, 'the page itself has no parent');
      continue;
    }
    assert.ok(node.parent, `${id} must name a parent - without one it cannot be moved or deleted`);
    assert.ok(nodes[node.parent], `${id} names a parent that exists`);
    assert.ok(nodes[node.parent].nodes.includes(id), `${node.parent} claims ${id} back`);
  }
});

test('the two directions agree exactly', () => {
  const { nodes } = buildCraftTree(sections);
  for (const [id, node] of Object.entries(nodes)) {
    for (const childId of node.nodes) {
      assert.equal(nodes[childId].parent, id, `${childId} is listed by ${id} and must say so`);
    }
  }
});

test('only the things that hold children are canvases', () => {
  const { nodes } = buildCraftTree(sections);
  const byName = (name) => Object.values(nodes).filter((n) => n.type.resolvedName === name);

  assert.ok(byName('Container').every((n) => n.isCanvas), 'containers hold things');
  assert.ok(byName('Video').every((n) => n.isCanvas), 'a background video holds the hero');
  assert.ok(byName('Heading').every((n) => !n.isCanvas));
  assert.ok(byName('NavbarElement').every((n) => !n.isCanvas));
});

test('a navbar written as a top-level section stays a navbar', () => {
  // It used to become an empty Container wearing a navbar's props, and two
  // generations out of three came out with no navigation at all.
  const { nodes } = buildCraftTree(sections);
  const first = nodes[nodes.ROOT.nodes[0]];
  assert.equal(first.type.resolvedName, 'NavbarElement');
  assert.equal(first.parent, 'ROOT');
});

test('ids stay distinct across the pages of one site', () => {
  const home = buildCraftTree(sections, 'home-');
  const about = buildCraftTree(sections, 'about-');
  const shared = Object.keys(home.nodes).filter((id) => id !== 'ROOT' && about.nodes[id]);
  assert.deepEqual(shared, [], 'two pages must not name the same node');
});

test('each source element is mapped to the node it became', () => {
  // The images are filled in after the page is on the canvas, by which time the
  // layout JSON is no longer what the editor shows - the nodes are.
  const { nodes, nodeIdOf } = buildCraftTree(sections);
  const heading = sections[1].children[0];
  assert.ok(nodeIdOf.has(heading));
  assert.equal(nodes[nodeIdOf.get(heading)].props.text, 'Ship faster');
});
