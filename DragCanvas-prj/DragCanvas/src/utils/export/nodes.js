import {
  ANIM_ATTR,
  DEFAULT_ANIMATION,
  DEFAULT_DELAY,
  DEFAULT_DURATION,
  REPEAT_ATTR,
  hasAnimation,
  readAnimation,
} from '../animation.js';
import {
  cssRules,
  generateClass,
  markUsesAnimation,
  mobileRules,
  tabletRules,
  timingRules,
} from './sheet.js';
import { spacingToCss, stylesToCss } from './values.js';

/**
 * Reading the saved node tree, and the two wrappers every converted node passes
 * through on its way out: its entrance animation and its per-device overrides.
 */

/** Every child of a node: ordinary children plus linked <Element id=...> ones. */
export const getChildIds = (node) => {
  const ids = Array.isArray(node.nodes) ? [...node.nodes] : [];
  if (node.linkedNodes && typeof node.linkedNodes === 'object') {
    ids.push(...Object.values(node.linkedNodes));
  }
  return ids;
};

/**
 * A "large" child forces its parent row to stack on a phone.
 *
 * Media and custom content always count. A Container counts when it is a real
 * column - a declared px/% width, or large content inside. An `auto` wrapper
 * around a few links or buttons (a nav pill) stays small, so nav bars wrap
 * instead of stacking.
 */
export const isLargeChild = (id, data) => {
  const node = data[id];
  if (!node) return false;

  const typeName = node.type?.resolvedName || node.type;
  if (typeName === 'Text' || typeName === 'Link' || typeName === 'Button') return false;
  if (typeName !== 'Container') return true; // media, custom, unknown

  const width = String(node.props?.width || '').trim();
  if (/^\d+(\.\d+)?(px|%)$/.test(width) && width !== '100%') return true;

  return getChildIds(node).some((childId) => isLargeChild(childId, data));
};

/**
 * Put an attribute list inside the first tag of some converted markup.
 *
 * Converters hand back strings, and there are forty of them: adding a wrapper
 * div around each would change flex and grid layouts, and threading a prop
 * through every converter would be forty chances to forget one. Attributes are
 * always safe to append, which is why the timing goes through an attribute
 * selector rather than a class or a style that would have to be merged with
 * whatever the converter already wrote.
 */
export const insertAttributes = (html, attributes) => {
  const open = html.indexOf('<');
  if (open === -1) return html;

  const close = html.indexOf('>', open);
  if (close === -1) return html;

  // Text going into an attribute has its > escaped, so the first one really is
  // the end of the tag. A self-closing tag keeps its slash last.
  const at = html[close - 1] === '/' ? close - 1 : close;
  return `${html.slice(0, at)}${attributes}${html.slice(at)}`;
};

/** Mark up one node with the entrance it asked for. */
export const withAnimation = (html, node, typeName, isRoot) => {
  // The page itself has nothing to arrive from, and hiding it would hide
  // everything. The panel does not offer it; nor does this.
  if (isRoot) return html;

  const spec = readAnimation(node.props, DEFAULT_ANIMATION[typeName] || 'none');
  if (!hasAnimation(spec)) return html;

  markUsesAnimation();
  let attributes = ` ${ANIM_ATTR}="${spec.name}"`;

  if (spec.duration !== DEFAULT_DURATION || spec.delay !== DEFAULT_DELAY) {
    const key = `${spec.duration}-${spec.delay}`;
    if (!timingRules.has(key)) {
      timingRules.set(key, `[data-dc-t="${key}"] { --dc-duration: ${spec.duration}ms; --dc-delay: ${spec.delay}ms; }`);
    }
    attributes += ` data-dc-t="${key}"`;
  }

  if (spec.repeat) attributes += ` ${REPEAT_ATTR}="1"`;
  return insertAttributes(html, attributes);
};

/** The handful of properties a node may override per device. */
const responsiveCss = (values = {}) => {
  const styles = {};
  if (values.width) styles.width = values.width;
  if (values.height) styles.height = values.height;
  if (Array.isArray(values.padding)) styles.padding = spacingToCss(values.padding);
  if (Array.isArray(values.margin)) styles.margin = spacingToCss(values.margin);
  if (values.visible === false) styles.display = 'none !important';
  return styles;
};

/**
 * Wrap a node so its tablet and phone overrides have something to apply to.
 *
 * The wrapper is `display: contents` on a wide screen, so it changes no layout
 * at all until one of the narrow rules turns it back into a real box.
 */
export const wrapResponsive = (html, node, depth) => {
  const responsive = node.props?.responsive;
  if (!responsive || (!responsive.tablet && !responsive.mobile)) return html;

  const className = generateClass('responsive');
  cssRules.push(`.${className} {\n  display: contents;\n}`);

  const addRule = (bucket, values) => {
    const styles = responsiveCss(values);
    if (!Object.keys(styles).length) return;
    if (styles.display !== 'none !important') styles.display = 'block';
    bucket.push(`  .${className} {\n${stylesToCss(styles)}\n  }`);
  };
  addRule(tabletRules, responsive.tablet);
  addRule(mobileRules, responsive.mobile);

  const indent = '  '.repeat(depth + 1);
  return `${indent}<div class="${className}">\n${html}${indent}</div>\n`;
};
