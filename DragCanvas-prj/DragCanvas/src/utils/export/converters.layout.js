import { cssRules, generateClass, knownAnchors, mobileRules } from './sheet.js';
import {
  capPx,
  escapeAttribute,
  rgbaToString,
  slugifyAnchor,
  spacingToCss,
  stylesToCss,
} from './values.js';
import { resolveImageSrc } from './images.js';
import { getChildIds, isLargeChild } from './nodes.js';
import { convertNode } from './convertNode.js';
import { columnTracks } from '../columnTracks.js';

/**
 * The boxes a page is arranged with: the page itself, its rows, and the
 * space between them.
 *
 * Each entry turns one saved node into the markup a published page needs.
 * They are gathered up in converters.js next door.
 */
export const layoutConverters = {
  Container: (node, data, depth = 0, nodeId) => {
    const props = node.props || {};
    const isRoot = nodeId === 'ROOT';
    const className = generateClass('container');

    // A photograph behind the section, with a scrim over it for the text. Two
    // stacked backgrounds rather than an <img>, so nothing needs positioning.
    const bgImage = String(props.backgroundImage || '').trim();
    const scrim = rgbaToString(props.overlay) || 'rgba(0,0,0,0.45)';
    const background = bgImage
      ? `linear-gradient(${scrim}, ${scrim}), url('${resolveImageSrc(bgImage)}')`
      : rgbaToString(props.background);

    const styles = {
      display: 'flex',
      flexDirection: props.flexDirection || 'column',
      alignItems: props.alignItems || 'flex-start',
      justifyContent: props.justifyContent || 'flex-start',
      width: isRoot ? '100%' : (props.width || '100%'),
      height: props.height || 'auto',
      padding: spacingToCss(props.padding),
      margin: isRoot ? '0 auto' : spacingToCss(props.margin),
      background,
      backgroundSize: bgImage ? 'cover' : undefined,
      backgroundPosition: bgImage ? 'center' : undefined,
      color: rgbaToString(props.color),
      borderRadius: `${props.radius || 0}px`,
      boxShadow: props.shadow > 0
        // Same two layers as the canvas; see Container.jsx.
        ? `0 1px 2px rgba(0,0,0,0.06), 0 ${props.shadow}px ${props.shadow * 2}px ${-Math.round(props.shadow / 2)}px rgba(0,0,0,0.14)`
        : 'none',
      flex: props.fillSpace === 'yes' ? '1' : 'unset',
      boxSizing: 'border-box',
    };

    if (isRoot) {
      /*
       * A published page is as wide as the window.
       *
       * The root's own width is the canvas somebody composed on - 800px for a
       * blank project, and an authoring aid rather than a decision about the
       * finished site. This used to carry it through as a max-width, so a site
       * published as an 800px strip down the middle of the screen with the
       * background showing either side of it. The templates in the gallery
       * escaped only by setting their root to 100%, which is the same thing
       * said by hand.
       *
       * Sections bring their own padding, so full width does not mean text
       * running the length of a monitor.
       */
      styles.maxWidth = '100%';
    }

    cssRules.push(`.${className} {\n${stylesToCss(styles)}\n}`);

    // --- Mobile overrides ---
    const childIds = getChildIds(node);
    const mobile = {};

    if ((props.flexDirection || 'column') === 'row') {
      const largeChildren = childIds.filter((id) => isLargeChild(id, data));
      if (largeChildren.length >= 2) {
        // "column + column" sections stack vertically on phones
        mobile.flexDirection = 'column';
        mobile.alignItems = 'stretch';
      } else {
        // small inline groups (links, buttons) just wrap
        mobile.flexWrap = 'wrap';
      }
    }

    // Fixed px widths overflow a 375px screen; percentage columns
    // (width: 30% etc.) stay too narrow once their parent stacks
    const width = String(props.width || '').trim();
    const pctMatch = width.match(/^(\d+(?:\.\d+)?)%$/);
    if (!isRoot && (/^\d+(\.\d+)?px$/.test(width) || (pctMatch && Number(pctMatch[1]) < 100))) {
      mobile.width = '100%';
    }

    // Cap oversized paddings (vertical <=24px, horizontal <=16px)
    if (Array.isArray(props.padding) && props.padding.length === 4) {
      const caps = [24, 16, 24, 16];
      const capped = props.padding.map((v, i) => capPx(v, caps[i]));
      if (capped.some((v) => v !== null)) {
        mobile.padding = capped
          .map((v, i) => `${v !== null ? v : (Number(props.padding[i]) || 0)}px`)
          .join(' ');
      }
    }

    if (Object.keys(mobile).length > 0) {
      mobileRules.push(`  .${className} {\n${stylesToCss(mobile)}\n  }`);
    }

    let childrenHtml = '';
    for (const childNodeId of childIds) {
      childrenHtml += convertNode(childNodeId, data, depth + 1);
    }

    // An anchor makes this section something a navigation link can reach. Only
    // the generator sets one, and only on top-level sections; everything else
    // renders exactly as before.
    const anchor = slugifyAnchor(props.anchor);
    if (anchor) knownAnchors.add(anchor);
    const idAttr = anchor ? ` id="${escapeAttribute(anchor)}"` : '';

    return `  <div${idAttr} class="${className}">\n${childrenHtml}  </div>\n`;
  },

  /**
   * Columns, and the stacking that keeps them usable on a phone.
   *
   * The share each child takes is written once on the row as a custom property
   * and read by a `> *` rule, because the children are arbitrary elements that
   * know nothing about being in a column.
   */
  Columns: (node, data, depth = 0) => {
    const props = node.props || {};
    const className = generateClass('columns');
    const columns = Number(props.count) || 2;
    const gap = Number(props.gap) || 24;

    // Grid rather than flex: a Container emits `flex: unset`, which resets
    // flex-basis and wins on order, so flex children of a Columns were never
    // sized at all. Grid tracks do not care what a child says about its width.
    cssRules.push(`.${className} {
  display: grid;
  grid-template-columns: ${columnTracks(columns, props.ratio)};
  gap: ${gap}px;
  align-items: ${props.align || 'stretch'};
  width: 100%;
}

.${className} > * {
  min-width: 0;
}`);

    if (props.stack !== 'no') {
      mobileRules.push(`  .${className} {\n    grid-template-columns: minmax(0, 1fr);\n  }`);
    }

    let childrenHtml = '';
    for (const childNodeId of getChildIds(node)) {
      childrenHtml += convertNode(childNodeId, data, depth + 1);
    }

    return `  <div class="${className}">\n${childrenHtml}  </div>\n`;
  },

  /** Deliberate empty space, so a gap does not have to belong to its neighbour. */
  Spacer: (node) => {
    const className = generateClass('spacer');
    cssRules.push(`.${className} {\n  width: 100%;\n  height: ${Number(node.props?.height) || 48}px;\n  flex-shrink: 0;\n}`);
    return `    <div class="${className}" aria-hidden="true"></div>\n`;
  },

  /** A rule between two things. */
  Divider: (node) => {
    const props = node.props || {};
    const className = generateClass('divider');
    const colour = rgbaToString(props.color) || 'rgba(0,0,0,0.12)';

    cssRules.push(`.${className} {
  width: 100%;
  padding: ${Number(props.spacing) || 24}px ${Number(props.inset) || 0}px;
}

.${className} hr {
  border: none;
  border-top: ${Number(props.thickness) || 1}px solid ${colour};
  margin: 0;
}`);

    return `    <div class="${className}"><hr></div>\n`;
  },
};
