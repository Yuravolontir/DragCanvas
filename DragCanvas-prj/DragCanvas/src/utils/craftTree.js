/**
 * The generated layout, turned into the node map Craft.js edits.
 *
 * Craft stores a page as a flat map of nodes joined in two directions: a parent
 * lists its children in `nodes`, and every child names its parent back. Both
 * are written into the saved JSON, and both are read straight out of it when a
 * page is deserialised - nothing infers the missing half.
 *
 * This wrote only the downward half. The page appeared, looked right, published
 * right, and could not be edited: picking an element up, dropping it somewhere,
 * deleting it and adding a sibling all start by asking a node who its parent
 * is, and every generated node answered nobody. A template, saved by the editor
 * itself, always carried `parent`, which is why templates were editable and
 * generated pages were not.
 *
 * Living in its own file so the shape it produces can be checked against the
 * shape the editor actually saves, which is the comparison that would have
 * caught this.
 */

/**
 * @param {Array} sections     top-level sections of one page
 * @param {string} idPrefix    keeps ids distinct across the pages of one site
 * @returns {{nodes: object, nodeIdOf: Map}} the node map, and which node each
 *   source element became. The images are swapped in after the page is already
 *   on the canvas, and by then the layout JSON is no longer what the editor is
 *   showing - the nodes are. Without this mapping the only way back would be to
 *   deserialise a second time, which would throw away anything the person had
 *   touched in the meantime.
 */
export function buildCraftTree(sections, idPrefix = '') {
  const nodes = {};
  const nodeIdOf = new Map();

  nodes.ROOT = {
    type: { resolvedName: 'Container' },
    isCanvas: true,
    props: { width: '800px', height: 'auto', flexDirection: 'column' },
    displayName: 'Container',
    custom: {},
    hidden: false,
    nodes: [],
    linkedNodes: {},
  };

  let idCounter = 1;

  /** One node, joined to its parent in both directions. */
  const attach = (id, resolvedName, props, parentId, isCanvas) => {
    nodes[id] = {
      type: { resolvedName },
      isCanvas,
      props: props || {},
      displayName: resolvedName,
      custom: {},
      // The half that was missing. Craft reads it rather than working it out,
      // so a node without it is a node that cannot be moved or deleted.
      parent: parentId,
      hidden: false,
      nodes: [],
      linkedNodes: {},
    };
    nodes[parentId].nodes.push(id);
  };

  /** Only a Container holds children; a background video holds the hero. */
  const holdsChildren = (resolvedName, props) =>
    resolvedName === 'Container' || (resolvedName === 'Video' && props?.sourceType === 'background');

  const titleCase = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Container');

  const buildNode = (element, parentId) => {
    if (!element || typeof element !== 'object') return;
    const nodeId = `${idPrefix}node-${idCounter++}`;
    const resolvedName = titleCase(element.type);

    attach(nodeId, resolvedName, element.props, parentId, holdsChildren(resolvedName, element.props));
    nodeIdOf.set(element, nodeId);

    if (Array.isArray(element.children)) {
      for (const child of element.children) buildNode(child, nodeId);
    }
  };

  for (const section of sections || []) {
    if (!section || typeof section !== 'object') continue;
    const sectionId = `${idPrefix}section-${idCounter++}`;

    /*
     * A top-level section is usually a Container, but not always.
     *
     * The model sometimes puts a NavbarElement straight at the top rather than
     * wrapping it, and this loop used to build every section as a Container
     * regardless - so that navbar became an empty Container with a navbar's
     * props, and the page came out with no navigation at all. Two generations
     * out of three lost their navbar that way.
     */
    const sectionType = section.type && section.type.toLowerCase() !== 'container'
      ? titleCase(section.type)
      : 'Container';

    attach(sectionId, sectionType, section.props, 'ROOT', holdsChildren(sectionType, section.props));
    nodeIdOf.set(section, sectionId);

    if (Array.isArray(section.children)) {
      for (const child of section.children) buildNode(child, sectionId);
    }
  }

  return { nodes, nodeIdOf };
}
