import { converters } from './converters.js';
import { getChildIds, withAnimation, wrapResponsive } from './nodes.js';

/**
 * Turn one saved node, and everything under it, into HTML.
 *
 * `data` is the flat node map Craft hands back from query.serialize():
 * { ROOT: {...}, nodeId: {...}, ... }. Children are reached through the map
 * rather than nested, so this walks it by id.
 *
 * Declared with `function` rather than as a const, because the converters call
 * back into it and the two modules therefore import each other.
 */
export function convertNode(nodeId, data, depth = 0) {
  const node = data[nodeId];
  if (!node) return '';

  const typeName = node.type?.resolvedName || node.type;
  const converter = converters[typeName];

  if (converter) {
    const html = converter(node, data, depth, nodeId);
    const animated = withAnimation(html, node, typeName, nodeId === 'ROOT');
    return wrapResponsive(animated, node, depth);
  }

  // An element with no converter still has children, and dropping them silently
  // would lose the visitor's content. Render them inside a plain div instead.
  const childIds = getChildIds(node);
  if (childIds.length > 0) {
    let childrenHtml = '';
    for (const childNodeId of childIds) {
      childrenHtml += convertNode(childNodeId, data, depth + 1);
    }
    return `  <div>\n${childrenHtml}  </div>\n`;
  }

  console.warn(`No converter for type: ${typeName}`);
  return '';
}
