import { columnTracks } from './columnTracks.js';
import { pairUp, imageAltText, normalizePaymentUrl, videoMode, youTubeId } from './elementData.js';
import { readSlides, slideInterval, slidesAutoplay, slidesPerView } from './carouselSlides.js';
import {
  countdownTarget,
  engagementMode,
  readEngagementOptions,
  opensNewTab,
  readAccordionRows,
  readLogoRows,
  readPricingRows,
  readProductRows,
  readStatRows,
  readTeamRows,
  readTimelineRows,
  safeHref,
  statDisplay,
  statsCountUp,
} from './elementRows.js';
import { readSocialRows, socialHref } from './socialPlatforms.js';
import { readableInkCss } from './readableInk.js';
import {
  ANIM_ATTR,
  DEFAULT_ANIMATION,
  DEFAULT_DELAY,
  DEFAULT_DURATION,
  READY_CLASS,
  REPEAT_ATTR,
  animationRuntime,
  animationStyleSheet,
  hasAnimation,
  readAnimation,
} from './animation.js';

/**
 * Convert Craft.js serialized data to clean HTML with inline CSS
 */

// Helper: Convert rgba object to CSS color string
const rgbaToString = (color) => {
  if (!color) return 'rgba(0, 0, 0, 1)';
  if (typeof color === 'string') return color;
  return `rgba(${color.r || 0}, ${color.g || 0}, ${color.b || 0}, ${color.a !== undefined ? color.a : 1})`;
};

// Helper: Convert padding/margin array to CSS string.
// The editor writes `${p[0]}px ${p[1]}px ...` — if the array is malformed
// (e.g. AI-generated [20202020]), that CSS is invalid and the browser ignores it.
// Mirror that behaviour: all 4 values must be valid numbers, otherwise 0.
const spacingToCss = (spacing) => {
  if (!Array.isArray(spacing) || spacing.length !== 4) return '0';
  if (spacing.some((v) => v === undefined || v === null || v === '' || isNaN(Number(v)))) return '0';
  return `${spacing[0]}px ${spacing[1]}px ${spacing[2]}px ${spacing[3]}px`;
};

// Helper: { flexDirection: 'row' } → "  flex-direction: row;" (valid CSS, not React camelCase)
const stylesToCss = (styles) => {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `  ${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}: ${value};`)
    .join('\n');
};

// Helper: published sites can't use the dev server's image proxy — restore the original URL
const resolveImageSrc = (src) => {
  if (!src) return '';
  const marker = '/api/image-proxy?url=';
  const idx = src.indexOf(marker);
  if (idx === -1) return src;
  try {
    return decodeURIComponent(src.slice(idx + marker.length));
  } catch {
    return src;
  }
};

const cloudinaryVariant = (src, width) => {
  const resolved = resolveImageSrc(src);
  if (!/res\.cloudinary\.com\/.+\/image\/upload\//.test(resolved)) return resolved;
  return resolved.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
};

const responsiveImageAttrs = (src) => {
  const resolved = resolveImageSrc(src);
  if (!/res\.cloudinary\.com\/.+\/image\/upload\//.test(resolved)) return '';
  return ` srcset="${[480, 768, 1280].map((width) => `${escapeAttribute(cloudinaryVariant(resolved, width))} ${width}w`).join(', ')}" sizes="(max-width: 768px) 100vw, 1280px"`;
};

// Helper: Generate unique ID for CSS rules
let ruleCounter = 0;
const generateClass = (prefix) => {
  return `${prefix}-${++ruleCounter}`;
};

// Store all CSS rules
const cssRules = [];

// Mobile (<=768px) overrides collected during conversion,
// emitted as a single @media block after the base rules
const mobileRules = [];
const tabletRules = [];

const responsiveCss = (values = {}) => {
  const styles = {};
  if (values.width) styles.width = values.width;
  if (values.height) styles.height = values.height;
  if (Array.isArray(values.padding)) styles.padding = spacingToCss(values.padding);
  if (Array.isArray(values.margin)) styles.margin = spacingToCss(values.margin);
  if (values.visible === false) styles.display = 'none !important';
  return styles;
};

const wrapResponsive = (html, node, depth) => {
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

/** Distinct duration/delay pairs, so ten staggered cards share three rules. */
let timingRules = new Map();

/** Whether this page needs the animation stylesheet and script at all. */
let usesAnimation = false;

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
const insertAttributes = (html, attributes) => {
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
const withAnimation = (html, node, typeName, isRoot) => {
  // The page itself has nothing to arrive from, and hiding it would hide
  // everything. The panel does not offer it; nor does this.
  if (isRoot) return html;
  const spec = readAnimation(node.props, DEFAULT_ANIMATION[typeName] || 'none');
  if (!hasAnimation(spec)) return html;

  usesAnimation = true;
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

// A node is "large" (forces its parent row to stack on mobile) when it is
// media/custom content, or a Container that is a real column: declared
// px/% width, or large content inside. width:auto wrappers around a few
// links/buttons (nav pills) stay "small" so nav bars wrap instead of stacking.
const isLargeChild = (id, data) => {
  const node = data[id];
  if (!node) return false;
  const typeName = node.type?.resolvedName || node.type;
  if (typeName === 'Text' || typeName === 'Link' || typeName === 'Button') return false;
  if (typeName !== 'Container') return true; // media, custom, unknown
  const width = String(node.props?.width || '').trim();
  if (/^\d+(\.\d+)?(px|%)$/.test(width) && width !== '100%') return true;
  return getChildIds(node).some((childId) => isLargeChild(childId, data));
};

// Cap a px value, return null when no override is needed
const capPx = (value, cap) => {
  const n = Number(value);
  if (isNaN(n) || n <= cap) return null;
  return cap;
};

// Helper: collect all child node ids (regular children + linked <Element id=...> children)
const getChildIds = (node) => {
  const ids = Array.isArray(node.nodes) ? [...node.nodes] : [];
  if (node.linkedNodes && typeof node.linkedNodes === 'object') {
    ids.push(...Object.values(node.linkedNodes));
  }
  return ids;
};

/**
 * Per-export context: which project this is and where its forms should post.
 * Kept alongside cssRules as module state and reset on every export, because
 * converters are plain functions called deep inside the recursion.
 */
let exportContext = {};

/** Values that came from user input must not be able to break out of the HTML. */
const escapeHtmlText = (text) =>
  String(text ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/**
 * Anchors that some section in this document actually claimed.
 *
 * Collected while converting so that navigation links can be checked against
 * reality rather than hope. Reset per export - a module-level Set would carry
 * one page's anchors into the next.
 */
let knownAnchors = new Set();

/** A section's anchor, reduced to something legal in a URL fragment. */
const slugifyAnchor = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

const escapeAttribute = (text) =>
  String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Component converters
const converters = {
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
        ? `0px 3px 100px ${props.shadow}px rgba(0, 0, 0, 0.13)`
        : 'none',
      flex: props.fillSpace === 'yes' ? '1' : 'unset',
      boxSizing: 'border-box',
    };

    if (isRoot) {
      // Designs are authored on a fixed-width canvas (800px default):
      // keep that as max-width and center the page on wide screens
      styles.maxWidth = props.width || '800px';
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
   * A heading, at the level it says it is.
   *
   * The level decides the tag and nothing else; the size is a separate property.
   * Tying them together is how a page ends up choosing its structure by how large
   * somebody wanted the letters, which is what produced a document of thirty
   * <h2> elements and no <h1>.
   */
  Heading: (node) => {
    const props = node.props || {};
    const className = generateClass('heading');
    const level = Math.min(Math.max(Number(props.level) || 2, 1), 6);

    const styles = {
      width: '100%',
      margin: spacingToCss(props.margin),
      color: rgbaToString(props.color),
      fontSize: `${props.fontSize || 32}px`,
      fontWeight: props.fontWeight || '700',
      textAlign: props.textAlign || 'left',
      lineHeight: '1.15',
      letterSpacing: '-0.02em',
    };

    cssRules.push(`.${className} {\n${stylesToCss(styles)}\n}`);

    // Headings shrink on a phone; 48px of headline leaves no room for anything else
    const big = Number(props.fontSize) || 32;
    if (big > 30) {
      mobileRules.push(`  .${className} {\n    font-size: ${Math.round(big * 0.62)}px;\n  }`);
    }

    let text = escapeHtmlText(props.text || 'Heading');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return `    <h${level} class="${className}">${text}</h${level}>\n`;
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

  /**
   * A map, in a page that has no JavaScript.
   *
   * There was no converter for this at all, so every published site quietly lost
   * its map - the element is in the toolbox and in the resolver, and the export
   * simply skipped it. Found by the coverage test rather than by anyone noticing,
   * which is the point of that test.
   *
   * The editor draws it with Leaflet. Reproducing that in the export would mean a
   * script and a stylesheet from someone else's CDN on every published page, for
   * a static picture of a location. OpenStreetMap's embed is an iframe: no
   * script, nothing to load from a third party at runtime beyond the tiles
   * themselves, and it still pans and zooms.
   */
  Map: (node) => {
    const props = node.props || {};
    const className = generateClass('map');
    const lat = Number(props.lat) || 32.0853;
    const lng = Number(props.lng) || 34.7818;
    // A rough bounding box around the point; the zoom prop decides how tight
    const span = Math.max(0.002, 0.4 / Math.pow(1.6, (Number(props.zoom) || 13) - 8));
    const bbox = [lng - span, lat - span / 2, lng + span, lat + span / 2].join('%2C');

    cssRules.push(`.${className} {
  width: ${props.width || '100%'};
  /* A map inserted at a fixed width still has to fit a phone. */
  max-width: 100%;
  height: ${props.height || '300px'};
  border-radius: 8px;
  overflow: hidden;
}

.${className} iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}`);

    const label = escapeAttribute(props.label || 'Location');
    return `    <div class="${className}">
      <iframe title="${label}" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&amp;layer=mapnik&amp;marker=${lat}%2C${lng}"></iframe>
    </div>\n`;
  },

  /** A real list, so four items read as four items and not four paragraphs. */
  List: (node) => {
    const props = node.props || {};
    const className = generateClass('list');
    const ordered = props.ordered === 'yes';
    const items = Array.isArray(props.items) ? props.items : [];

    cssRules.push(`.${className} {
  margin: 0;
  padding-left: 1.4em;
  list-style: ${ordered ? 'decimal' : 'disc'};
  display: flex;
  flex-direction: column;
  gap: ${Number(props.gap) || 8}px;
  font-size: ${Number(props.fontSize) || 16}px;
  color: ${rgbaToString(props.color) || 'inherit'};
  line-height: 1.6;
}`);

    const tag = ordered ? 'ol' : 'ul';
    const lis = items.map(item => `      <li>${escapeHtmlText(String(item))}</li>`).join('\n');
    return `    <${tag} class="${className}">\n${lis}\n    </${tag}>\n`;
  },

  /** A pull quote, published as the blockquote it is. */
  Quote: (node) => {
    const props = node.props || {};
    const className = generateClass('quote');
    const centred = props.align === 'center';

    cssRules.push(`.${className} {
  margin: 0;
  padding: ${centred ? '4px 0' : '4px 0 4px 20px'};
  ${centred ? '' : `border-left: 3px solid ${rgbaToString(props.accent) || '#0040e0'};`}
  text-align: ${props.align || 'left'};
  font-size: ${Number(props.fontSize) || 20}px;
  line-height: 1.5;
  font-style: italic;
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} footer {
  margin-top: 10px;
  font-size: 0.72em;
  font-style: normal;
  opacity: 0.7;
}`);

    const attribution = props.attribution
      ? `\n      <footer>&mdash; ${escapeHtmlText(props.attribution)}</footer>`
      : '';
    return `    <blockquote class="${className}">${escapeHtmlText(props.text || '')}${attribution}\n    </blockquote>\n`;
  },

  /**
   * One Material symbol.
   *
   * The published page needs the icon font, which the editor gets from the
   * document head. It is requested here too, once, for pages that carry an icon.
   */
  Icon: (node) => {
    const props = node.props || {};
    const className = generateClass('icon');
    const box = Number(props.size) || 32;
    const padded = props.padded === 'yes';

    if (!cssRules.some(rule => rule.includes('Material+Symbols+Outlined'))) {
      cssRules.unshift(`@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');`);
    }

    cssRules.push(`.${className} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${padded ? `width: ${box * 2}px;\n  height: ${box * 2}px;\n  border-radius: 50%;` : ''}
  background: ${padded ? (rgbaToString(props.background) || 'transparent') : 'transparent'};
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} span {
  font-family: 'Material Symbols Outlined';
  font-size: ${box}px;
  line-height: 1;
}`);

    return `    <span class="${className}"><span>${escapeHtmlText(props.name || 'star')}</span></span>\n`;
  },

  /** A small pill of text. */
  Badge: (node) => {
    const props = node.props || {};
    const className = generateClass('badge');

    cssRules.push(`.${className} {
  display: inline-block;
  padding: 5px 12px;
  border-radius: ${props.radius ?? 999}px;
  background: ${rgbaToString(props.background) || '#eef0ff'};
  color: ${rgbaToString(props.color) || '#0040e0'};
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}`);

    return `    <span class="${className}">${escapeHtmlText(props.text || 'Badge')}</span>\n`;
  },

  /**
   * Questions that open and close, with no JavaScript.
   *
   * `<details>` does this in the browser. Reproducing it with a script would mean
   * every published page carrying code whose only job is to toggle a class, and
   * a page that needs no script cannot break because one failed to load.
   */
  Accordion: (node) => {
    const props = node.props || {};
    const className = generateClass('accordion');
    const entries = readAccordionRows(props);

    cssRules.push(`.${className} {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${className} details {
  background: ${rgbaToString(props.background) || '#f4f3f2'};
  color: ${rgbaToString(props.color) || 'inherit'};
  border-radius: ${props.radius ?? 10}px;
  padding: 14px 18px;
}

.${className} summary {
  cursor: pointer;
  font-weight: 600;
}

.${className} .answer {
  margin-top: 10px;
  opacity: 0.85;
  line-height: 1.6;
}`);

    const html = entries.map((entry) => `      <details>
        <summary>${escapeHtmlText(entry.question)}</summary>
        <div class="answer">${escapeHtmlText(entry.answer)}</div>
      </details>`).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Tiers in a grid, so the columns line up and the buttons share a baseline. */
  Pricing: (node) => {
    const props = node.props || {};
    const className = generateClass('pricing');
    const records = readPricingRows(props);
    const accent = rgbaToString(props.accent) || '#0040e0';

    cssRules.push(`.${className} {
  display: grid;
  grid-template-columns: repeat(${Math.max(records.length, 1)}, minmax(0, 1fr));
  gap: 20px;
  width: 100%;
  align-items: stretch;
}

.${className} .tier {
  display: flex;
  flex-direction: column;
  padding: 26px;
  border-radius: 14px;
  background: ${rgbaToString(props.background) || '#ffffff'};
  color: ${rgbaToString(props.color) || 'inherit'};
  border: 2px solid rgba(0,0,0,0.08);
}

.${className} .tier.featured {
  border-color: ${accent};
  box-shadow: 0 18px 40px -20px rgba(0,0,0,0.35);
}

.${className} .name { font-size: 15px; font-weight: 600; opacity: 0.7; }
.${className} .price { font-size: 38px; font-weight: 800; letter-spacing: -0.02em; margin-top: 6px; }
.${className} .period { font-size: 13px; opacity: 0.6; }
.${className} ul { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
.${className} .cta { margin-top: auto; padding-top: 20px; }
.${className} .cta span {
  display: block;
  text-align: center;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  border: 2px solid ${accent};
  color: ${accent};
}
.${className} .tier.featured .cta span { background: ${accent}; color: ${readableInkCss(props.accent)}; }
.${className} .cta a { display: block; text-decoration: none; }`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: minmax(0, 1fr);\n  }`);

    const tiers = records.map((tier) => {
      const items = tier.features
        .map(f => `          <li>${escapeHtmlText(f)}</li>`).join('\n');
      const href = safeHref(tier.href);
      // The button is a link only when the author gave it somewhere to go. A
      // dead link invites the click and then does nothing, which is worse than
      // a label that plainly is not one.
      const label = `<span>${escapeHtmlText(tier.cta)}</span>`;
      const button = tier.cta
        ? (href
          ? `<a href="${escapeAttribute(href)}"${opensNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
          : label)
        : '';
      return `      <div class="tier${tier.featured ? ' featured' : ''}">
        <span class="name">${escapeHtmlText(tier.name)}</span>
        <span class="price">${escapeHtmlText(tier.price)}</span>
        <span class="period">${escapeHtmlText(tier.period)}</span>
        <ul>
${items}
        </ul>
        <span class="cta">${button}</span>
      </div>`;
    }).join('\n');

    return `    <div class="${className}">\n${tiers}\n    </div>\n`;
  },

  /** Somebody vouching for the thing, with a face attached. */
  Testimonial: (node) => {
    const props = node.props || {};
    const className = generateClass('testimonial');

    cssRules.push(`.${className} {
  margin: 0;
  padding: 28px;
  border-radius: 14px;
  background: ${rgbaToString(props.background) || '#ffffff'};
  color: ${rgbaToString(props.color) || 'inherit'};
  border: 1px solid rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.${className} blockquote { margin: 0; font-size: 18px; line-height: 1.6; }
.${className} figcaption { display: flex; align-items: center; gap: 12px; }
.${className} img, .${className} .initial {
  width: 44px; height: 44px; border-radius: 50%; object-fit: cover; display: block;
}
.${className} .initial {
  display: grid; place-items: center; font-weight: 700;
  background: ${rgbaToString(props.accent) || '#eef0ff'};
}
.${className} .who { display: flex; flex-direction: column; line-height: 1.3; }
.${className} .name { font-weight: 700; font-size: 15px; }
.${className} .role { font-size: 13px; opacity: 0.65; }`);

    const face = props.avatar
      ? `<img src="${escapeAttribute(cloudinaryVariant(props.avatar, 480))}"${responsiveImageAttrs(props.avatar)} alt="" loading="lazy" decoding="async">`
      : `<span class="initial">${escapeHtmlText((props.author || '?').trim().charAt(0).toUpperCase())}</span>`;

    return `    <figure class="${className}">
      <blockquote>${escapeHtmlText(props.quote || '')}</blockquote>
      <figcaption>
        ${face}
        <span class="who">
          <span class="name">${escapeHtmlText(props.author || '')}</span>
          <span class="role">${escapeHtmlText(props.role || '')}</span>
        </span>
      </figcaption>
    </figure>\n`;
  },

  /**
   * A row of numbers worth saying out loud.
   *
   * How the block arrives is the shared animation's job. What is left here is
   * the counting, which is about the figures rather than the box they sit in.
   */
  Stats: (node) => {
    const props = node.props || {};
    const className = generateClass('stats');
    const rootId = `${className}-root`;
    const records = readStatRows(props);
    const counting = statsCountUp(props);
    const repeat = props.animationRepeat === true;

    cssRules.push(`.${className} {
  display: grid;
  grid-template-columns: repeat(${Math.max(records.length, 1)}, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
  text-align: ${props.align || 'center'};
}

.${className} .value {
  display: block;
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${rgbaToString(props.accent) || 'inherit'};
}

.${className} .label {
  display: block;
  font-size: 14px;
  opacity: 0.7;
  margin-top: 4px;
  color: ${rgbaToString(props.color) || 'inherit'};
}`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }`);

    const html = records.map((row) => `      <div>
        <span class="value" aria-label="${escapeAttribute(statDisplay(row))}" data-stat-prefix="${escapeAttribute(row.prefix)}" data-stat-value="${escapeAttribute(row.value)}" data-stat-suffix="${escapeAttribute(row.suffix)}">${escapeHtmlText(statDisplay(row))}</span>
        <span class="label">${escapeHtmlText(row.label)}</span>
      </div>`).join('\n');

    const script = counting ? `    <script>
      (function () {
        var root = document.getElementById(${JSON.stringify(rootId)});
        if (!root) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var figures = [], frame = 0;
        function format(amount, decimals) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
        }
        Array.prototype.forEach.call(root.querySelectorAll('[data-stat-value]'), function (element) {
          var raw = element.dataset.statValue || '', prefix = element.dataset.statPrefix || '', suffix = element.dataset.statSuffix || '', numeric = raw;
          var embedded = raw.match(/^([^\\d+-]*)([-+]?\\d[\\d,\\s]*?(?:\\.\\d+)?)([^\\d]*)$/);
          if (embedded && !/^-?\\d+(?:\\.\\d+)?$/.test(raw.replace(/[\\s,]/g, ''))) { prefix += embedded[1]; numeric = embedded[2]; suffix = embedded[3] + suffix; }
          var normalized = numeric.replace(/[\\s,]/g, '');
          // Text such as 24/7 stays put rather than becoming NaN.
          if (!/^-?\\d+(?:\\.\\d+)?$/.test(normalized)) return;
          var decimals = (normalized.split('.')[1] || '').length;
          figures.push({ element: element, target: Number(normalized), decimals: decimals, prefix: prefix, suffix: suffix, done: element.textContent });
        });
        if (!figures.length) return;
        // The markup carries the finished number so the page reads correctly
        // without scripting; the zeroing happens here, before the first paint,
        // so a counted figure never shows its total and then snaps back.
        function zero() {
          figures.forEach(function (figure) { figure.element.textContent = figure.prefix + format(0, figure.decimals) + figure.suffix; });
        }
        zero();
        function count() {
          cancelAnimationFrame(frame);
          var start = performance.now(), duration = 1000;
          function draw(now) {
            var linear = Math.min(1, (now - start) / duration), progress = 1 - Math.pow(1 - linear, 3);
            figures.forEach(function (figure) {
              // The last frame reads back exactly what was typed, so a value
              // written as 1200 does not finish as 1,200.
              figure.element.textContent = linear < 1
                ? figure.prefix + format(figure.target * progress, figure.decimals) + figure.suffix
                : figure.done;
            });
            if (linear < 1) frame = requestAnimationFrame(draw);
          }
          frame = requestAnimationFrame(draw);
        }
        if (!('IntersectionObserver' in window)) return count();
        var arrive = new IntersectionObserver(function (entries) {
          if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
          ${repeat ? '' : 'arrive.disconnect();'}
          count();
        }, { threshold: .12 });
        arrive.observe(root);${repeat ? `
        // Winding back only happens once the block is entirely off screen, so
        // nobody watches the numbers fall.
        var leave = new IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) return;
          cancelAnimationFrame(frame); zero();
        }, { threshold: 0 });
        leave.observe(root);` : ''}
      })();
    </script>\n` : '';

    return `    <div class="${className}" id="${rootId}">\n${html}\n    </div>\n${script}`;
  },

  /** The people behind the thing. */
  TeamGrid: (node) => {
    const props = node.props || {};
    const className = generateClass('teamgrid');
    const records = readTeamRows(props);

    cssRules.push(`.${className} {
  display: grid;
  grid-template-columns: repeat(${Number(props.columns) || 3}, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
}

.${className} figure {
  margin: 0; text-align: center; display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} img, .${className} .initial {
  width: 96px; height: 96px; border-radius: 50%; object-fit: cover; display: block;
}
.${className} .initial {
  display: grid; place-items: center; font-size: 32px; font-weight: 700;
  background: ${rgbaToString(props.accent) || '#eef0ff'};
}
.${className} .name { display: block; font-weight: 700; font-size: 16px; }
.${className} .role { display: block; font-size: 13px; opacity: 0.65; }
.${className} figure > a { display: block; line-height: 0; }`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }`);

    const html = records.map(({ name, role, photo, href }) => {
      const face = photo
        ? `<img src="${escapeAttribute(cloudinaryVariant(photo, 480))}"${responsiveImageAttrs(photo)} alt="${escapeAttribute(name || '')}" loading="lazy" decoding="async">`
        : `<span class="initial">${escapeHtmlText((name || '?').trim().charAt(0).toUpperCase())}</span>`;
      const link = safeHref(href);
      // Clicking a face is what people try, so it is worth wiring up - and a
      // link that leaves the site takes rel protection with it.
      const portrait = link
        ? `<a href="${escapeAttribute(link)}"${opensNewTab(link) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${face}</a>`
        : face;
      return `      <figure>
        ${portrait}
        <figcaption>
          <span class="name">${escapeHtmlText(name)}</span>
          <span class="role">${escapeHtmlText(role)}</span>
        </figcaption>
      </figure>`;
    }).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Steps in order, or a history. */
  Timeline: (node) => {
    const props = node.props || {};
    const className = generateClass('timeline');
    const records = readTimelineRows(props);
    const accent = rgbaToString(props.accent) || '#0040e0';

    cssRules.push(`.${className} {
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} .step { display: flex; gap: 18px; align-items: stretch; }
.${className} .rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.${className} .marker {
  width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
  background: ${accent}; color: ${readableInkCss(props.accent)}; font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.${className} .tail { flex: 1; width: 2px; background: ${accent}; opacity: 0.25; min-height: 24px; }
.${className} .title { display: block; font-weight: 700; font-size: 17px; }
.${className} .detail { display: block; font-size: 14px; opacity: 0.7; line-height: 1.6; margin-top: 4px; }
.${className} .body { padding-bottom: 28px; }
.${className} .step:last-child .body { padding-bottom: 0; }`);

    const html = records.map(({ marker, title, detail }, i) => `      <div class="step">
        <div class="rail">
          <span class="marker">${escapeHtmlText(marker)}</span>
          ${i < records.length - 1 ? '<span class="tail"></span>' : ''}
        </div>
        <div class="body">
          <span class="title">${escapeHtmlText(title)}</span>
          <span class="detail">${escapeHtmlText(detail)}</span>
        </div>
      </div>`).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** The ask, on a band of its own. */
  CTABanner: (node) => {
    const props = node.props || {};
    const className = generateClass('ctabanner');

    cssRules.push(`.${className} {
  width: 100%;
  padding: 48px 32px;
  border-radius: ${props.radius ?? 16}px;
  background: ${rgbaToString(props.background) || '#0040e0'};
  color: ${rgbaToString(props.color) || '#ffffff'};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.${className} .title { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
.${className} .sub { font-size: 16px; opacity: 0.85; max-width: 46ch; }
.${className} a {
  margin-top: 12px;
  display: inline-block;
  padding: 14px 30px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;
  background: ${rgbaToString(props.buttonBackground) || '#ffffff'};
  color: ${rgbaToString(props.buttonColor) || '#0040e0'};
}`);

    mobileRules.push(`  .${className} {\n    padding: 32px 20px;\n  }\n\n  .${className} .title {\n    font-size: 24px;\n  }`);

    const sub = props.text ? `\n      <span class="sub">${escapeHtmlText(props.text)}</span>` : '';
    return `    <div class="${className}">
      <span class="title">${escapeHtmlText(props.title || '')}</span>${sub}
      <a href="${escapeAttribute(props.href || '#')}">${escapeHtmlText(props.cta || '')}</a>
    </div>\n`;
  },

  /** A row of logos, matched on height rather than width. */
  LogoStrip: (node) => {
    const props = node.props || {};
    const className = generateClass('logostrip');
    const logos = readLogoRows(props);

    cssRules.push(`.${className} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${Number(props.gap) || 40}px;
  width: 100%;
${rgbaToString(props.color) ? `  color: ${rgbaToString(props.color)};\n` : ''}}

.${className} img {
  height: ${Number(props.height) || 32}px;
  width: auto;
  display: block;
  ${props.grayscale === 'no' ? '' : 'filter: grayscale(1);\n  opacity: 0.65;\n  transition: filter 200ms ease, opacity 200ms ease;'}
}

.${className} span {
  font-size: ${Math.round((Number(props.height) || 32) * 0.62)}px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1;
  white-space: nowrap;
  ${props.grayscale === 'no' ? '' : 'opacity: 0.75;\n  transition: opacity 200ms ease;'}
}

${props.grayscale === 'no' ? '' : `.${className} span:hover {\n  opacity: 1;\n}`}

${props.grayscale === 'no' ? '' : `.${className} img:hover {\n  filter: none;\n  opacity: 1;\n}`}

.${className} a { color: inherit; text-decoration: none; line-height: 0; }`);

    // A company with no image is set as a wordmark. See the LogoStrip component
    // for why that is the more useful reading of a customer logo you do not have
    // the file for.
    const html = logos
      .map((row) => {
        const mark = row.src
          ? `<img src="${escapeAttribute(cloudinaryVariant(row.src, 768))}"${responsiveImageAttrs(row.src)} alt="${escapeAttribute(row.label || '')}" loading="lazy" decoding="async">`
          : `<span>${escapeHtmlText(row.label)}</span>`;
        const href = safeHref(row.href);
        return `      ${href
          ? `<a href="${escapeAttribute(href)}"${opensNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${mark}</a>`
          : mark}`;
      })
      .join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Where else to find them. */
  SocialLinks: (node) => {
    const props = node.props || {};
    const className = generateClass('sociallinks');
    const records = readSocialRows(props);
    const box = Math.round((Number(props.size) || 14) * 2.3);
    const glyph = Math.round(box * 0.58);

    cssRules.push(`.${className} {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.${className} a {
  display: inline-grid;
  place-items: center;
  width: ${box}px;
  height: ${box}px;
  border-radius: 50%;
  text-decoration: none;
  background: ${rgbaToString(props.background) || 'rgba(0,0,0,0.06)'};
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} svg { width: ${glyph}px; height: ${glyph}px; fill: currentColor; display: block; }`);

    // The mark is inlined rather than fetched: a published page has no bundle
    // and no icon font, and a row of social buttons that waits on a third-party
    // request is a row of social buttons that sometimes never arrives.
    const html = records
      .map((row) => {
        const href = socialHref(row);
        if (!href) return '';
        return `      <a href="${escapeAttribute(href)}" aria-label="${escapeAttribute(row.label)}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${escapeAttribute(row.icon)}"/></svg></a>`;
      })
      .filter(Boolean)
      .join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  Text: (node) => {
    const props = node.props || {};
    const className = generateClass('text');

    // Fluid typography: headings shrink smoothly on narrow screens.
    // f/8 vw equals f px at the 800px design width; floor at 60%.
    const f = Number(props.fontSize) || 15;
    const fontSize = f > 18
      ? `clamp(${Math.round(f * 0.6)}px, ${(f / 8).toFixed(2)}vw, ${f}px)`
      : `${f}px`;

    const styles = {
      width: '100%',
      margin: spacingToCss(props.margin),
      color: rgbaToString(props.color),
      fontSize,
      fontWeight: props.fontWeight || '500',
      textAlign: props.textAlign || 'left',
      textShadow: props.shadow > 0
        ? `0px 0px 2px rgba(0,0,0,${props.shadow / 100})`
        : 'none',
    };

    cssRules.push(`.${className} {\n${stylesToCss(styles)}\n}`);

    // Process text content - handle bold/italic markdown
    let text = props.text || 'Text';
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    /**
     * A paragraph, not a heading.
     *
     * This returned <h2> for every Text element - body copy, captions, image
     * labels, all of it. A page with thirty text blocks shipped thirty
     * second-level headings and no <h1>: no subject for a search engine, and
     * every sentence announced as a heading to anyone navigating by them.
     *
     * Titles use the Heading element, which carries a level.
     */
    return `    <p class="${className}">${text}</p>\n`;
  },

  Button: (node) => {
    const props = node.props || {};
    const className = generateClass('button');

    const isOutline = props.buttonStyle === 'outline';

    const styles = {
      background: isOutline ? 'transparent' : rgbaToString(props.background),
      color: rgbaToString(props.color),
      fontWeight: '600',
      border: isOutline
        ? `2px solid ${rgbaToString(props.background)}`
        : '2px solid transparent',
      borderRadius: '8px',
      padding: '12px 24px',
      margin: spacingToCss(props.margin),
      cursor: 'pointer',
      fontSize: '16px',
      boxShadow: props.buttonStyle === 'full' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
      transition: 'all 0.2s ease',
      display: 'inline-block',
      textAlign: 'center',
    };

    cssRules.push(`.${className} {\n${stylesToCss(styles)}\n}`);

    // Hover effect
    cssRules.push(`.${className}:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 12px rgba(0,0,0,0.15);\n}\n`);

    const text = props.text || 'Button';
    const value = String(props.actionValue || '').trim();
    let href = '';
    if (props.action === 'url' && value) {
      if (/^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(value)) href = value;
      else if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) href = `https://${value}`;
    }
    // Any hosted checkout, no provider assumed - and nothing that is not an
    // ordinary web address, which is what normalizePaymentUrl is for.
    if (props.action === 'payment' && value) href = normalizePaymentUrl(value);
    if (props.action === 'section' && value) href = `#${slugifyAnchor(value.replace(/^#/, ''))}`;
    if (props.action === 'email' && value) href = `mailto:${value.replace(/^mailto:/i, '')}`;
    if (props.action === 'phone' && value) href = `tel:${value.replace(/^tel:/i, '')}`;
    if (props.action === 'page' && value) href = `/${slugifyAnchor(value)}/`;
    if (href) {
      const target = (props.action === 'payment' || (props.action === 'url' && props.newTab)) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `    <a class="${className}" href="${escapeAttribute(href)}"${target}>${escapeHtmlText(text)}</a>\n`;
    }
    return `    <button class="${className}" type="button">${escapeHtmlText(text)}</button>\n`;
  },

  /*
   * The video player, in the three shapes the element has had.
   *
   * Background heroes go to their own converter. A YouTube id - typed here
   * before the YouTube element existed - still becomes an embed. Everything
   * else is a file the owner hosts, with the optional line of text centred over
   * it. Sizes come from the props the editor resized, capped so a fixed width
   * never makes a phone scroll sideways.
   */
  Video: (node, data, depth = 0) => {
    const props = node.props || {};
    const mode = videoMode(props);

    if (mode === 'background') {
      return converters.BackgroundVideo(
        { ...node, props: { ...props, src: props.src || props.videoUrl || '' } },
        data,
        depth
      );
    }

    const className = generateClass('video');
    const width = props.width || '100%';
    const height = props.height;

    cssRules.push(`.${className} {
  position: relative;
  width: ${width};
  max-width: 100%;
  ${height ? `height: ${height};` : 'aspect-ratio: 16 / 9;'}
  overflow: hidden;
}

.${className} iframe,
.${className} video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  object-fit: cover;
}`);

    if (/^\d+(\.\d+)?px$/.test(String(width).trim())) {
      mobileRules.push(`  .${className} {\n  width: 100%;\n  }`);
    }

    if (mode === 'youtube') {
      const id = youTubeId(props.videoId || props.videoUrl);
      if (!id) return '';
      return `    <div class="${className}">
      <iframe
        src="https://www.youtube.com/embed/${escapeAttribute(id)}"
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>\n`;
    }

    if (!props.videoUrl) return '';

    const overlayClass = generateClass('video-caption');
    cssRules.push(`.${overlayClass} {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  pointer-events: none;
  z-index: 2;
}

.${overlayClass} span {
  padding: 12px 18px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}`);

    return `    <div class="${className}">
      <video
        autoplay
        muted
        playsinline
        controls${props.loop === false ? '' : '\n        loop'}${props.poster ? `\n        poster="${escapeAttribute(props.poster)}"` : ''}>
        <source src="${escapeAttribute(props.videoUrl)}">
        Your browser does not support the video tag.
      </video>
      ${props.text ? `<div class="${overlayClass}"><span>${escapeHtmlText(props.text)}</span></div>` : ''}
    </div>\n`;
  },

  /** A YouTube clip, from whatever form of link the owner pasted. */
  YouTube: (node) => {
    const props = node.props || {};
    const id = youTubeId(props.video);
    if (!id) return '';

    const className = generateClass('youtube');
    const width = props.width || '560px';
    const height = props.height;

    cssRules.push(`.${className} {
  position: relative;
  width: ${width};
  max-width: 100%;
  ${height ? `height: ${height};` : 'aspect-ratio: 16 / 9;'}
  border-radius: ${Number(props.radius) || 0}px;
  overflow: hidden;
}

.${className} iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}`);

    if (/^\d+(\.\d+)?px$/.test(String(width).trim())) {
      mobileRules.push(`  .${className} {\n  width: 100%;\n  height: auto;\n  aspect-ratio: 16 / 9;\n  }`);
    }

    return `    <div class="${className}">
      <iframe
        src="https://www.youtube.com/embed/${escapeAttribute(id)}"
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>\n`;
  },

  Image: (node) => {
    const props = node.props || {};
    const className = generateClass('image');

    const styles = {
      width: props.width || 'auto',
      height: props.height || 'auto',
      maxWidth: '100%',
      display: 'block',
      borderRadius: `${props.radius || 0}px`,
      objectFit: 'cover',
    };

    cssRules.push(`.${className} {\n${stylesToCss(styles)}\n}`);

    // Fixed-width images leave ragged edges in stacked mobile layouts
    if (/^\d+(\.\d+)?px$/.test(String(props.width || '').trim())) {
      mobileRules.push(`  .${className} {\n  width: 100%;\n  }`);
    }

    return `    <img class="${className}" src="${escapeAttribute(cloudinaryVariant(props.src, 1280))}"${responsiveImageAttrs(props.src)} alt="${escapeAttribute(imageAltText(props))}" loading="lazy" decoding="async" />\n`;
  },

  /**
   * The carousel, matching what Carousel.jsx renders.
   *
   * The editor used to run react-bootstrap's carousel and this converter used to
   * emit a bare scroll-snap strip, so arrows, dots and autoplay existed on one
   * side and not the other. Both sides are the same scroll-snap strip now, and
   * the controls below are the same behaviour written for a page with no bundle.
   *
   * A carousel with no arrows, no dots and no autoplay still exports as pure
   * CSS, exactly as it did before.
   */
  Carousel: (node) => {
    const props = node.props || {};
    const className = generateClass('carousel');
    const trackId = `${className}-track`;

    const slides = readSlides(props);
    const height = props.height || '400px';
    const { desktop: perView, tablet: perViewTablet, mobile: perViewMobile } = slidesPerView(props);

    const arrows = props.arrows !== false && slides.length > 1;
    const dots = props.dots !== false && slides.length > 1;
    // The same reading the canvas uses, so a carousel that moves in the editor
    // moves on the page. `props.autoplay === true` failed every project that
    // had the string "true" stored here.
    const autoplay = slidesAutoplay(props) && slides.length > 1;
    const loop = props.loop !== false;
    const interval = slideInterval(props);

    cssRules.push(`.${className} {
  position: relative;
  width: 100%;
  height: ${height};
}
.${className} .track {
  --per-view: ${perView};
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  border-radius: 12px;
}
.${className} .track::-webkit-scrollbar { display: none; }
.${className} .slide {
  position: relative;
  flex: 0 0 calc(100% / var(--per-view));
  height: 100%;
  scroll-snap-align: start;
  overflow: hidden;
}
.${className} .slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.${className} .slide > a { display: block; width: 100%; height: 100%; color: inherit; text-decoration: none; }
.${className} .caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px 32px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0,0,0,0.65));
}
.${className} .caption h3 { margin: 0 0 4px; }
.${className} .caption p { margin: 0; font-size: 14px; }
.${className} .badge {
  display: inline-block;
  padding: 2px 10px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  color: #fff;
  background: ${rgbaToString(props.accent) || '#0d6efd'};
}
.${className} .arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.${className} .arrow:hover { background: rgba(0,0,0,0.65); }
.${className} .arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.${className} .arrow.prev { left: 10px; }
.${className} .arrow.next { right: 10px; }
.${className} .dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.${className} .dots button {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(255,255,255,0.45);
}
.${className} .dots button[aria-current="true"] { background: #fff; }
.${className} .dots button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (max-width: 900px) {
  .${className} .track { --per-view: ${perViewTablet}; }
}
@media (max-width: 600px) {
  .${className} .track { --per-view: ${perViewMobile}; }
}`);

    let slideHtml = '';
    slides.forEach((slide, i) => {
      if (!slide.src) return;
      const caption = slide.label || slide.heading || slide.text
        ? `        <div class="caption">
          ${slide.label ? `<span class="badge">${escapeHtmlText(slide.label)}</span>` : ''}
          ${slide.heading ? `<h3>${escapeHtmlText(slide.heading)}</h3>` : ''}
          ${slide.text ? `<p>${escapeHtmlText(slide.text)}</p>` : ''}
        </div>\n`
        : '';
      const image = `<img src="${escapeAttribute(cloudinaryVariant(slide.src, 1280))}"${responsiveImageAttrs(slide.src)} alt="${escapeAttribute(slide.alt)}" loading="lazy" decoding="async">`;
      const href = safeHref(slide.href);
      const body = href
        ? `<a href="${escapeAttribute(href)}"${opensNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${image}\n${caption}</a>`
        : `${image}\n${caption}`;
      slideHtml += `      <div class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">
        ${body}      </div>\n`;
    });

    const arrowHtml = arrows
      ? `      <button class="arrow prev" type="button" aria-label="Previous slide">&lsaquo;</button>
      <button class="arrow next" type="button" aria-label="Next slide">&rsaquo;</button>\n`
      : '';

    const dotsHtml = dots
      ? `      <div class="dots">${slides
          .map(
            (_, i) =>
              `<button type="button" aria-label="Go to slide ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`
          )
          .join('')}</div>\n`
      : '';

    // Only a carousel that actually has controls pays for a script.
    const script = arrows || dots || autoplay
      ? `      <script>
      (function () {
        var root = document.getElementById('${trackId}');
        if (!root) return;
        var track = root.querySelector('.track');
        var dots = root.querySelectorAll('.dots button');
        var step = function () {
          var first = track.firstElementChild;
          return first ? first.getBoundingClientRect().width : track.clientWidth;
        };
        var go = function (direction) {
          var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
          var atStart = track.scrollLeft <= 1;
          if (direction > 0 && atEnd) { if (${loop}) track.scrollTo({ left: 0, behavior: 'smooth' }); return; }
          if (direction < 0 && atStart) { if (${loop}) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' }); return; }
          track.scrollBy({ left: direction * step(), behavior: 'smooth' });
        };
        var prev = root.querySelector('.arrow.prev');
        var next = root.querySelector('.arrow.next');
        if (prev) prev.addEventListener('click', function () { go(-1); });
        if (next) next.addEventListener('click', function () { go(1); });
        Array.prototype.forEach.call(dots, function (dot, i) {
          dot.addEventListener('click', function () { track.scrollTo({ left: i * step(), behavior: 'smooth' }); });
        });
        track.addEventListener('keydown', function (event) {
          if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
        });
        track.addEventListener('scroll', function () {
          if (!dots.length) return;
          var width = step();
          if (!width) return;
          var active = Math.round(track.scrollLeft / width);
          Array.prototype.forEach.call(dots, function (dot, i) {
            if (i === active) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
          });
        }, { passive: true });
${autoplay ? `        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced) {
          var timer = setInterval(function () { go(1); }, ${interval});
          var stop = function () { clearInterval(timer); timer = null; };
          var start = function () { if (!timer) timer = setInterval(function () { go(1); }, ${interval}); };
          root.addEventListener('mouseenter', stop);
          root.addEventListener('mouseleave', start);
          root.addEventListener('focusin', stop);
          root.addEventListener('focusout', start);
        }\n` : ''}      })();
      </script>\n`
      : '';

    return `    <div class="${className}" id="${trackId}" role="region" aria-roledescription="carousel" aria-label="${escapeAttribute(props.title || 'Gallery')}">
      <div class="track" tabindex="0">
${slideHtml}      </div>
${arrowHtml}${dotsHtml}${script}    </div>\n`;
  },

  /**
   * A hero with video behind it.
   *
   * Mirrors BackgroundVideo.jsx: three layers, same class names, same gate. The
   * <video> ships without a src on purpose — the inline script attaches one only
   * on a wide viewport and only when the visitor has not asked for less motion.
   * On a phone, under reduced motion, with JavaScript off, or when the file
   * fails, the poster is the hero and no video is fetched.
   */
  BackgroundVideo: (node, data, depth = 0) => {
    const props = node.props || {};
    const className = generateClass('backgroundvideo');

    // A video hero is a section, and a section a navigation link points at
    // needs the anchor as its id. The script finds the element by the same id,
    // so there is only ever one: the anchor when there is one, a generated
    // name when there is not.
    const anchor = slugifyAnchor(props.anchor);
    if (anchor) knownAnchors.add(anchor);
    const rootId = anchor || `${className}-root`;

    const src = props.src || '';
    const poster = props.poster ? resolveImageSrc(props.poster) : '';
    const dim = Math.min(100, Math.max(0, Number(props.overlay ?? 40))) / 100;
    const position = ['top', 'center', 'bottom'].includes(props.position) ? props.position : 'center';
    const objectPosition = position === 'top' ? 'center top' : position === 'bottom' ? 'center bottom' : 'center center';
    const minHeight = props.minHeight || '420px';

    cssRules.push(`.${className} {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  min-height: ${minHeight};
  overflow: hidden;${poster ? `
  background-image: url('${poster}');
  background-size: cover;
  background-position: ${objectPosition};` : ''}
}
.${className} > video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: ${objectPosition};
  pointer-events: none;
  z-index: 0;
}
.${className} > .dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, ${dim});
  pointer-events: none;
  z-index: 1;
}
.${className} > .content {
  position: relative;
  z-index: 2;
  width: 100%;
}`);

    let childrenHtml = '';
    for (const childNodeId of getChildIds(node)) {
      childrenHtml += convertNode(childNodeId, data, depth + 1);
    }

    const videoTag = src
      ? `      <video muted ${props.loop === false ? '' : 'loop '}playsinline preload="none"${poster ? ` poster="${escapeAttribute(poster)}"` : ''} aria-hidden="true" tabindex="-1" data-src="${escapeAttribute(src)}"></video>\n`
      : '';

    // No src, no script: a poster-only hero is static CSS.
    const script = src
      ? `      <script>
      (function () {
        var root = document.getElementById('${rootId}');
        if (!root) return;
        var video = root.querySelector('video');
        if (!video) return;
        var wide = !window.matchMedia || window.matchMedia('(min-width: 768px)').matches;
        var calm = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!wide || !calm) return;
        video.addEventListener('error', function () { video.style.display = 'none'; });
        video.src = video.getAttribute('data-src');
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
      })();
      </script>\n`
      : '';

    return `    <div class="${className}" id="${rootId}">
${videoTag}      <div class="dim"></div>
      <div class="content">
${childrenHtml}      </div>
${script}    </div>\n`;
  },

  /**
   * A real, working form on the published page.
   *
   * The editor renders an inert preview; this is what visitors actually use.
   * It posts to our API from whatever domain the site ended up on, so the
   * project id has to be baked in at export time - the page has no other way
   * to know which site it belongs to.
   */
  Tabs: (node) => {
    const props=node.props||{},className=generateClass('tabs'),rows=pairUp(props.items);
    cssRules.push(`.${className}{width:100%}.${className} details{border-bottom:1px solid #ddd;padding:10px}.${className} summary{cursor:pointer;font-weight:700;color:${rgbaToString(props.accent)}}.${className} p{margin-top:8px}`);
    return `    <div class="${className}">${rows.map(([label,content],i)=>`<details${i===0?' open':''}><summary>${escapeHtmlText(label)}</summary><p>${escapeHtmlText(content)}</p></details>`).join('')}</div>\n`;
  },

  /**
   * A live deadline, counted down in the visitor's own browser.
   *
   * The instant is baked in as milliseconds since the epoch, which is the same
   * moment everywhere - a visitor three time zones away sees the same amount of
   * time left, not the same wall clock. A node whose date could never be read
   * publishes a stopped counter rather than a row of NaNs.
   */
  Countdown: (node) => {
    const props = node.props || {}, className = generateClass('countdown'), id = `${className}-value`;
    const target = countdownTarget(props.target);
    cssRules.push(`.${className}{width:100%;text-align:center}.${className} strong{display:block;font-size:32px;color:${rgbaToString(props.accent)}}`);
    return `    <div class="${className}"><strong id="${id}">00 : 00 : 00 : 00</strong><span>${escapeHtmlText(props.label || 'Time remaining')}</span><script>(function(){var value=document.getElementById(${JSON.stringify(id)}),target=${JSON.stringify(target)},label=value.nextElementSibling,timer;function update(){if(target===null)return;var left=Math.max(0,target-Date.now()),days=Math.floor(left/86400000),hours=Math.floor(left/3600000)%24,minutes=Math.floor(left/60000)%60,seconds=Math.floor(left/1000)%60;value.textContent=[days,hours,minutes,seconds].map(function(n){return String(n).padStart(2,'0')}).join(' : ');if(!left){label.textContent=${JSON.stringify(props.expiredText || 'This offer has ended.')};clearInterval(timer)}}update();if(target!==null)timer=setInterval(update,1000)})();</script></div>\n`;
  },

  Engagement: (node, data, depth, nodeId) => {
    const props=node.props||{},mode=engagementMode(props),className=generateClass('engagement'),rootId=`${className}-root`,apiUrl=exportContext.apiUrl||'',options=readEngagementOptions(props);
    cssRules.push(`.${className}{width:100%;padding:20px;border:1px solid #ddd;border-radius:12px}. ${className} h3{margin-bottom:12px}.${className} input,.${className} textarea{display:block;width:100%;padding:10px;margin:8px 0;border:1px solid #ccc;border-radius:8px;font:inherit}.${className} button{margin:4px;padding:10px 14px;border:0;border-radius:8px;background:${rgbaToString(props.accent)};color:${readableInkCss(props.accent)};cursor:pointer}.${className} .entry{padding:12px 0;border-bottom:1px solid #eee}`.replace('. '+className,'.'+className));
    const controls=mode==='review'?`<form><input name="author" required maxlength="120" placeholder="Your name"><textarea name="content" required maxlength="3000" placeholder="Your review"></textarea><button type="submit">Submit for approval</button></form>`:`<div class="choices">${options.map(option=>`<button type="button" data-option="${escapeAttribute(option)}">${escapeHtmlText(option)} <span></span></button>`).join('')}</div>`;
    return `    <section class="${className}" id="${rootId}"><h3>${escapeHtmlText(props.heading||'Your opinion')}</h3>${controls}<p class="status" aria-live="polite"></p><div class="entries"></div><script>
(function(){var root=document.getElementById(${JSON.stringify(rootId)}),status=root.querySelector('.status'),entries=root.querySelector('.entries'),endpoint=${JSON.stringify(`${apiUrl}/api/engagement`)},projectId=${JSON.stringify(exportContext.projectId)},widgetKey=${JSON.stringify(String(nodeId||className))},mode=${JSON.stringify(mode)},visitorKey='dragcanvas-visitor';var visitor=localStorage.getItem(visitorKey);if(!visitor){visitor=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());localStorage.setItem(visitorKey,visitor)}function load(){fetch(endpoint+'/public/'+projectId+'/'+encodeURIComponent(widgetKey)).then(function(r){return r.json()}).then(function(body){var rows=body.data||body;if(mode==='review'){entries.textContent='';rows.filter(function(row){return row.Kind==='review'}).forEach(function(row){var article=document.createElement('article');article.className='entry';var strong=document.createElement('strong');strong.textContent=row.Author;var p=document.createElement('p');p.textContent=row.Content;article.append(strong,p);entries.appendChild(article)})}else{var counts={};rows.forEach(function(row){counts[row.OptionValue]=(counts[row.OptionValue]||0)+1});root.querySelectorAll('[data-option]').forEach(function(button){button.querySelector('span').textContent='('+ (counts[button.dataset.option]||0) +')'})}})}if(mode==='review'){root.querySelector('form').addEventListener('submit',function(event){event.preventDefault();var form=event.currentTarget;fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:projectId,widgetKey:widgetKey,kind:mode,author:form.author.value,content:form.content.value})}).then(function(r){if(!r.ok)throw new Error();status.textContent='Thank you. Your review will appear after approval.';form.reset()}).catch(function(){status.textContent='Could not submit the review.'})})}else root.querySelectorAll('[data-option]').forEach(function(button){button.addEventListener('click',function(){fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:projectId,widgetKey:widgetKey,kind:mode,option:button.dataset.option,visitorId:visitor})}).then(function(r){if(!r.ok)throw new Error();status.textContent='Response recorded.';load()}).catch(function(){status.textContent='You already responded.'})})});load()})();
</script></section>\n`;
  },

  ProductCatalog: (node) => {
    const props = node.props || {}; const className = generateClass('catalog'); const rows = readProductRows(props);
    cssRules.push(`.${className} { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px; } .${className} article { border:1px solid #ddd;border-radius:12px;overflow:hidden;padding:16px; } .${className} article img { width:100%;aspect-ratio:4/3;object-fit:cover; } .${className} article a { display:block;width:fit-content;margin-top:10px;background:${rgbaToString(props.accent)};color:${readableInkCss(props.accent)};border-radius:8px;padding:10px 14px;text-decoration:none; }`);
    mobileRules.push(`  .${className} { grid-template-columns: 1fr; }`);
    const cards = rows.map(({ name, description, price, image, href: link }) => {
      const href = normalizePaymentUrl(link);
      return `<article>${image ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(name || '')}" loading="lazy">` : ''}<h3>${escapeHtmlText(name)}</h3><p>${escapeHtmlText(description)}</p><strong>${escapeHtmlText(price)} ${escapeHtmlText(String(props.currency || 'USD').toUpperCase())}</strong>${href ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(props.buttonText || 'Buy now')}</a>` : ''}</article>`;
    }).join('');
    return `    <section class="${className}">${cards}</section>\n`;
  },

  Booking: (node) => {
    const props = node.props || {}; const className = generateClass('booking'); const formId = `${className}-form`; const apiUrl = exportContext.apiUrl || '';
    cssRules.push(`.${className} { width: 100%; } .${className} strong { display:block;margin-bottom:10px; } .${className} .fields { display:grid;grid-template-columns:1fr 1fr;gap:8px; } .${className} input,.${className} select,.${className} textarea { width:100%;padding:11px;border:1px solid #ccc;border-radius:8px;font:inherit; } .${className} button { margin-top:8px;padding:12px 18px;border:0;border-radius:8px;background:${rgbaToString(props.accent)};color:${readableInkCss(props.accent)};cursor:pointer; } .${className} .status { margin-top:8px; }`);
    mobileRules.push(`  .${className} .fields { grid-template-columns: 1fr; }`);
    return `    <div class="${className}"><strong>${escapeHtmlText(props.heading || 'Book an appointment')}</strong><form id="${formId}"><div class="fields"><input name="date" type="date" required><select name="startAt" required disabled><option value="">Choose a date first</option></select><input name="name" autocomplete="name" required placeholder="Name"><input name="email" type="email" autocomplete="email" required placeholder="Email"><textarea name="notes" placeholder="Notes (optional)"></textarea></div><button type="submit">${escapeHtmlText(props.buttonText || 'Confirm booking')}</button></form><p class="status" aria-live="polite"></p><script>
(function(){var form=document.getElementById(${JSON.stringify(formId)}),slots=form.startAt,status=form.nextElementSibling,date=form.date;date.min=new Date().toISOString().slice(0,10);date.addEventListener('change',function(){slots.disabled=true;slots.innerHTML='<option>Loading…</option>';fetch(${JSON.stringify(`${apiUrl}/api/bookings/availability`)}+'?projectId='+encodeURIComponent(${JSON.stringify(exportContext.projectId)})+'&date='+encodeURIComponent(date.value)).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(body){var values=body.data||body;slots.innerHTML=values.length?values.map(function(value){return '<option value="'+value+'">'+new Date(value).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</option>';}).join(''):'<option value="">No slots available</option>';slots.disabled=!values.length;}).catch(function(){slots.innerHTML='<option value="">Could not load slots</option>';});});form.addEventListener('submit',function(event){event.preventDefault();var button=form.querySelector('button');button.disabled=true;fetch(${JSON.stringify(`${apiUrl}/api/bookings`)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:${JSON.stringify(exportContext.projectId)},startAt:slots.value,name:form.name.value,email:form.email.value,notes:form.notes.value})}).then(function(r){if(!r.ok)throw new Error();status.textContent='Booking confirmed. Check your email.';form.reset();slots.disabled=true;}).catch(function(){status.textContent='That slot is unavailable. Please choose another.';}).finally(function(){button.disabled=false;});});})();
</script></div>\n`;
  },

  Newsletter: (node) => {
    const props = node.props || {};
    const className = generateClass('newsletter');
    const formId = `${className}-form`;
    const apiUrl = exportContext.apiUrl || '';
    cssRules.push(`.${className} { width: 100%; color: ${rgbaToString(props.color)}; }
.${className} strong { display: block; margin-bottom: 10px; }
.${className} form { display: flex; gap: 8px; }
.${className} input { min-width: 0; flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font: inherit; }
.${className} button { padding: 12px 18px; border: 0; border-radius: 8px; background: ${rgbaToString(props.accent)}; color: ${readableInkCss(props.accent)}; cursor: pointer; }
.${className} .status { margin-top: 8px; font-size: 14px; }`);
    mobileRules.push(`  .${className} form { flex-direction: column; }`);
    return `    <div class="${className}">
      <strong>${escapeHtmlText(props.heading || 'Get updates')}</strong>
      <form id="${formId}"><input type="email" name="email" autocomplete="email" required placeholder="${escapeAttribute(props.placeholder || 'you@example.com')}"><button type="submit">${escapeHtmlText(props.buttonText || 'Subscribe')}</button></form>
      <p class="status" aria-live="polite"></p>
      <script>
      (function () {
        var form = document.getElementById(${JSON.stringify(formId)}), status = form.nextElementSibling;
        form.addEventListener('submit', function (event) {
          event.preventDefault(); var button = form.querySelector('button'); button.disabled = true;
          fetch(${JSON.stringify(`${apiUrl}/api/subscribers/subscribe`)}, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: ${JSON.stringify(exportContext.projectId)}, email: form.email.value }) })
            .then(function (response) { if (!response.ok) throw new Error(); status.textContent = ${JSON.stringify(props.successMessage || 'Check your email to confirm.')}; form.reset(); })
            .catch(function () { status.textContent = 'Could not subscribe. Please try again.'; })
            .finally(function () { button.disabled = false; });
        });
      })();
      </script>
    </div>\n`;
  },

  Form: (node) => {
    const context = exportContext;
    const props = node.props || {};
    const className = generateClass('form');
    const fields = Array.isArray(props.fields) ? props.fields : [];
    const radius = props.radius ?? 8;
    const accent = rgbaToString(props.accent) || '#7e57c2';
    const textColor = props.textColor ? rgbaToString(props.textColor) : '#49454f';
    const inputBackground = props.inputBackground ? rgbaToString(props.inputBackground) : '#ffffff';
    const inputBorder = props.inputBorder ? rgbaToString(props.inputBorder) : '#dddddd';

    cssRules.push(`.${className} {
  background: ${rgbaToString(props.background) || '#ffffff'};
  padding: 24px;
  border-radius: ${radius}px;
  box-sizing: border-box;
  width: 100%;
}
.${className} label {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
  color: ${textColor};
}
.${className} input,
.${className} textarea {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid ${inputBorder};
  border-radius: ${radius}px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  background: ${inputBackground};
}
.${className} button {
  background: ${accent};
  color: ${readableInkCss(props.accent)};
  border: none;
  border-radius: ${radius}px;
  padding: 11px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.${className} button[disabled] { opacity: 0.6; cursor: default; }
.${className} .form-done { font-size: 15px; color: #2e7d32; }
.${className} .hp { position: absolute; left: -9999px; }`);

    const inputs = fields.map((field, index) => {
      const name = (field.label || `field_${index + 1}`).trim();
      const required = field.required ? ' required' : '';
      const placeholder = escapeAttribute(field.placeholder || '');
      const label = escapeHtmlText(name) + (field.required ? ' *' : '');

      if (field.type === 'textarea') {
        return `      <label>${label}</label>\n      <textarea name="${escapeAttribute(name)}" rows="4" placeholder="${placeholder}"${required}></textarea>`;
      }
      if (field.type === 'file') {
        return `      <label>${label}</label>\n      <input type="file" name="attachment" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"${required}>`;
      }
      const inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text';
      return `      <label>${label}</label>\n      <input type="${inputType}" name="${escapeAttribute(name)}" placeholder="${placeholder}"${required}>`;
    }).join('\n');

    const formId = `${className}-el`;
    const apiUrl = context.apiUrl || '';
    const projectId = context.projectId ?? '';
    /*
     * The success message is written into the inline script, so escaping it for
     * HTML is not enough: it also has to survive being a JavaScript string.
     * "Thanks, you're in!" used to close the literal early, which is a syntax
     * error - the whole IIFE then failed to parse, no submit handler was
     * attached, and the form on the published page did a native submit and
     * navigated away. JSON.stringify emits the quotes and the escapes.
     * escapeHtmlText still runs first, so `<` is already `&lt;` and the markup
     * below cannot grow a `</script>`.
     */
    const successHtml = JSON.stringify(
      `<p class="form-done">${escapeHtmlText(props.successMessage || 'Thank you!')}</p>`
    );

    return `    <div class="${className}">
      <form id="${formId}">
${inputs}
        <input type="text" name="_hp" class="hp" tabindex="-1" autocomplete="off">
        <button type="submit">${escapeHtmlText(props.submitText || 'Send')}</button>
        <p class="dc-form-status" role="alert" aria-live="polite"></p>
      </form>
      <script>
      (function () {
        var form = document.getElementById('${formId}');
        if (!form) return;
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var button = form.querySelector('button');
          var status = form.querySelector('.dc-form-status');
          status.textContent = '';
          button.disabled = true;
          var payload = { projectId: ${JSON.stringify(projectId)} };
          new FormData(form).forEach(function (value, key) { if (!(value instanceof File)) payload[key] = value; });
          var file = form.querySelector('input[type="file"]');
          var upload = Promise.resolve(null);
          if (file && file.files[0]) {
            var uploadBody = new FormData(); uploadBody.append('projectId', ${JSON.stringify(projectId)}); uploadBody.append('file', file.files[0]);
            upload = fetch('${apiUrl}/api/assets/form-upload', { method: 'POST', body: uploadBody }).then(function (response) { if (!response.ok) throw new Error('upload failed'); return response.json(); }).then(function (body) { return (body.data || body).token; });
          }
          upload.then(function (uploadToken) { if (uploadToken) payload.uploadToken = uploadToken; return fetch('${apiUrl}/api/forms/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }); }).then(function (response) {
            if (!response.ok) throw new Error('failed');
            form.outerHTML = ${successHtml};
          }).catch(function () {
            button.disabled = false;
            status.textContent = 'Could not send. Please try again.';
          });
        });
      })();
      </script>
    </div>\n`;
  },

  /**
   * The navigation bar. Without this converter every published page lost its
   * navbar silently, because the component keeps brand and links in props
   * rather than children, and the fallback branch only renders children.
   */
  NavbarElement: (node) => {
    const props = node.props || {};
    const className = generateClass('navbar');
    const variant = props.variant || 'dark';

    const palette = {
      dark: { background: '#212529', color: '#ffffff' },
      light: { background: '#f8f9fa', color: '#212529' },
      primary: { background: '#0d6efd', color: '#ffffff' },
    }[variant] || { background: '#212529', color: '#ffffff' };

    const textColor = rgbaToString(props.textColor) || palette.color;

    cssRules.push(`.${className} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  width: ${props.width || '100%'};
  min-height: ${props.height || '56px'};
  padding: 12px 24px;
  background: ${palette.background};
  box-sizing: border-box;
  ${props.sticky ? 'position: sticky; top: 0; z-index: 100;' : ''}
}
.${className} .brand {
  font-size: 20px;
  font-weight: 700;
  color: ${textColor};
  text-decoration: none;
}
.${className} .links { display: flex; gap: 20px; flex-wrap: wrap; }
.${className} .links a {
  color: ${textColor};
  text-decoration: none;
  font-size: 15px;
  opacity: 0.9;
}
.${className} .links a:hover { opacity: 1; text-decoration: underline; }
.${className} .links .dead { color: ${textColor}; opacity: 0.55; }`);

    mobileRules.push(`  .${className} { flex-wrap: wrap; gap: 12px; }
  .${className} .menu-toggle-label { display: grid; }
  .${className} .links { display: none; flex: 0 0 100%; flex-direction: column; gap: 0; }
  .${className} .links a, .${className} .links .dead { padding: 10px 0; }
  .${className} .menu-toggle:checked ~ .links { display: flex; }`);

    cssRules.push(`.${className} .menu-toggle { position: absolute; opacity: 0; pointer-events: none; }
.${className} .menu-toggle-label {
  display: none; width: 42px; height: 42px; place-items: center; cursor: pointer;
  border: 1px solid currentColor; border-radius: 8px; color: ${textColor}; font-size: 24px;
}`);

    /**
     * A link is only a link if it leads somewhere.
     *
     * These used to be written out whatever they pointed at, and nothing in the
     * document ever carried an id - so every one of them was dead. An anchor
     * with no matching section now renders as its label: a word that does
     * nothing is honest, a link that does nothing invites the click first.
     */
    const links = (Array.isArray(props.links) ? props.links : [])
      .map(link => {
        const label = escapeHtmlText(link.text || '');
        const href = String(link.href || '').trim();
        const anchor = href.startsWith('#') ? slugifyAnchor(href.slice(1)) : '';

        if (anchor && knownAnchors.has(anchor)) {
          return `        <a href="#${escapeAttribute(anchor)}">${label}</a>`;
        }
        // An external link still points somewhere real
        if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
          return `        <a href="${escapeAttribute(href)}">${label}</a>`;
        }
        // "/" is the site's own front page, and the pattern below wanted at
        // least one character after the slash — so the Home link of every
        // multi-page site published from here rendered as an inert word.
        if (href === '/') return `        <a href="/">${label}</a>`;
        if (/^\/[a-z0-9][a-z0-9-]*\/?$/.test(href)) return `        <a href="${escapeAttribute(href.endsWith('/') ? href : `${href}/`)}">${label}</a>`;
        return `        <span class="dead">${label}</span>`;
      })
      .join('\n');

    const toggleId = `${className}-toggle`;
    return `    <nav class="${className}">
      <a class="brand" href="#">${escapeHtmlText(props.brand || '')}</a>
      <input class="menu-toggle" id="${toggleId}" type="checkbox" aria-label="Toggle navigation">
      <label class="menu-toggle-label" for="${toggleId}" aria-hidden="true">☰</label>
      <div class="links">
${links}
      </div>
    </nav>\n`;
  },

  Link: (node) => {
    const props = node.props || {};
    const className = generateClass('link');

    const styles = {
      fontSize: `${props.fontSize || 16}px`,
      fontWeight: props.fontWeight || 'inherit',
      textDecoration: 'none',
      color: '#0066cc',
      transition: 'color 0.2s ease',
    };

    cssRules.push(`.${className} {\n${stylesToCss(styles)}\n}`);
    cssRules.push(`.${className}:hover {\n  color: #0052a3;\n  text-decoration: underline;\n}\n`);

    return `    <a class="${className}" href="${props.href || '#'}">${props.text || 'Link'}</a>\n`;
  },
};

// Convert a single node to HTML
// `data` is the flat node map from Craft.js query.serialize(): { ROOT: {...}, nodeId: {...}, ... }
const convertNode = (nodeId, data, depth = 0) => {
  const node = data[nodeId];
  if (!node) return '';

  const typeName = node.type?.resolvedName || node.type;
  const converter = converters[typeName];

  if (converter) {
    const html = withAnimation(converter(node, data, depth, nodeId), node, typeName, nodeId === 'ROOT');
    return wrapResponsive(html, node, depth);
  }

  // Fallback for custom/unknown components (Custom1-3, Carousel, Map, ...):
  // render their children so content is not silently dropped
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
};

// Main export function
export const exportToHtml = (serializedData, title = 'My Website', options = {}) => {
  // Reset state
  ruleCounter = 0;
  cssRules.length = 0;
  mobileRules.length = 0;
  tabletRules.length = 0;
  timingRules = new Map();
  usesAnimation = false;

  // A published page has no way of knowing which project it came from, so the
  // id is baked in here; the API address is the one this build points at.
  // localhost is useful only while Vite itself is running locally. A missing
  // Netlify build variable must never make a public site call the visitor's
  // own computer.
  const defaultApiUrl = import.meta.env?.PROD
    ? 'https://dragcanvas.onrender.com'
    : 'http://localhost:3001';
  exportContext = {
    projectId: options.projectId ?? null,
    apiUrl: options.apiUrl || import.meta.env?.VITE_API_URL || defaultApiUrl,
  };

  // Which anchors exist has to be known before the first link is written, and
  // the navigation bar is usually the very first section converted. So the
  // anchors are collected in their own pass rather than as we go.
  knownAnchors = new Set();
  for (const node of Object.values(serializedData || {})) {
    const anchor = slugifyAnchor(node?.props?.anchor);
    if (anchor) knownAnchors.add(anchor);
  }

  // Add base CSS
  cssRules.push(`* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  /* Navigation links land on their section instead of teleporting to it */
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: ${rgbaToString(serializedData.ROOT?.props?.background)};
}

img {
  max-width: 100%;
  height: auto;
}

a {
  text-decoration: none;
}

button {
  font-family: inherit;
}

.dc-scroll-progress { position: fixed; inset: 0 0 auto; height: 3px; z-index: 10000; transform-origin: left; transform: scaleX(0); background: #0060ac; }
.dc-back-top { position: fixed; right: 18px; bottom: 18px; z-index: 9999; width: 44px; height: 44px; border: 0; border-radius: 50%; background: #0060ac; color: #fff; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .2s; }
.dc-back-top.visible { opacity: 1; pointer-events: auto; }
dialog.dc-lightbox { border: 0; padding: 0; max-width: min(92vw, 1200px); max-height: 92vh; background: transparent; }
dialog.dc-lightbox::backdrop { background: rgba(0,0,0,.82); }
dialog.dc-lightbox img { display: block; max-width: 92vw; max-height: 88vh; object-fit: contain; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}`);

  // serializedData is the flat node map from query.serialize(): ROOT is a top-level key
  let htmlContent = '';

  const rootNode = serializedData.ROOT;
  if (rootNode) {
    // ROOT itself is the canvas Container — convert it so its background/layout is kept
    htmlContent = convertNode('ROOT', serializedData);
  }

  // Only pages that actually animate pay for the stylesheet, and the timing
  // rules can only be known once every node has been through the converter.
  if (usesAnimation) {
    cssRules.push(animationStyleSheet());
    if (timingRules.size) cssRules.push([...timingRules.values()].join('\n'));
  }

  // Combine everything; mobile overrides go last so they win the cascade
  let css = cssRules.join('\n\n');
  if (tabletRules.length > 0) {
    css += `\n\n@media (max-width: 1024px) {\n${tabletRules.join('\n\n')}\n}`;
  }
  if (mobileRules.length > 0) {
    css += `\n\n@media (max-width: 768px) {\n${mobileRules.join('\n\n')}\n}`;
  }

  const pageTitle = escapeHtmlText(title || 'My Website');
  const description = escapeAttribute(options.description || '');
  const canonicalUrl = escapeAttribute(options.canonicalUrl || '{{DRAGCANVAS_SITE_URL}}');
  const language = /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(options.lang || '') ? options.lang : 'en';
  const firstImage = Object.values(serializedData || {}).map((node) => {
    const props = node?.props || {};
    return props.src || props.image || props.backgroundImage || props.slides?.[0]?.src || props.src1;
  }).find(Boolean);
  const socialImage = escapeAttribute(resolveImageSrc(options.socialImage || firstImage || ''));
  const favicon = escapeAttribute(resolveImageSrc(options.favicon || ''));
  const descriptionTags = description ? `
  <meta name="description" content="${description}">
  <meta property="og:description" content="${description}">
  <meta name="twitter:description" content="${description}">` : '';
  const imageTags = socialImage ? `
  <meta property="og:image" content="${socialImage}">
  <meta name="twitter:image" content="${socialImage}">` : '';
  const faviconTag = favicon ? `
  <link rel="icon" href="${favicon}">` : '';
  const graph = [];
  for (const node of Object.values(serializedData || {})) {
    const type = node?.type?.resolvedName || node?.type;
    const props = node?.props || {};
    if (type === 'Accordion') {
      const mainEntity = readAccordionRows(props).filter((row) => row.question && row.answer)
        .map((row) => ({
          '@type': 'Question',
          name: row.question,
          acceptedAnswer: { '@type': 'Answer', text: row.answer },
        }));
      if (mainEntity.length) graph.push({ '@type': 'FAQPage', mainEntity });
    }
    if (type === 'Map') {
      graph.push({
        '@type': 'LocalBusiness',
        name: props.label || title || 'Business',
        ...(props.address ? { address: { '@type': 'PostalAddress', streetAddress: String(props.address) } } : {}),
        url: options.canonicalUrl || '{{DRAGCANVAS_SITE_URL}}',
        geo: { '@type': 'GeoCoordinates', latitude: Number(props.lat), longitude: Number(props.lng) },
      });
    }
    if (type === 'Pricing') {
      const offers = readPricingRows(props).map((tier) => ({
        '@type': 'Offer',
        name: tier.name,
        price: tier.price.replace(/[^0-9.,]/g, '').replace(',', '.') || '0',
      }));
      if (offers.length) graph.push({ '@type': 'Product', name: title || 'Services', offers });
    }
    if (type === 'TeamGrid') {
      const employee = readTeamRows(props).filter((person) => person.name)
        .map((person) => ({ '@type': 'Person', name: person.name, jobTitle: person.role }));
      if (employee.length) graph.push({ '@type': 'Organization', name: title || 'Organization', employee });
    }
  }
  const structuredData = graph.length
    ? `\n  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`
    : '';

  /**
   * Hiding is switched on from inside the document, before the first paint.
   *
   * The stylesheet only hides what it is told to hide once <html> carries the
   * ready class, so a visitor with no JavaScript — or a crawler that does not
   * run it — gets the whole page rather than a stack of invisible sections.
   */
  const animationGuard = usesAnimation
    ? `\n  <script>document.documentElement.classList.add(${JSON.stringify(READY_CLASS)});</script>`
    : '';
  const animationBlock = usesAnimation ? `  ${animationRuntime()}` : '';

  const bodyContent = options.comingSoon
    ? `<main style="min-height:100vh;display:grid;place-items:center;padding:32px;text-align:center"><div><h1>${pageTitle}</h1><p>${description || 'We are getting ready. Please check back soon.'}</p></div></main>`
    : htmlContent;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${options.noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
  <title>${pageTitle}</title>${descriptionTags}
  <link rel="canonical" href="${canonicalUrl}">${faviconTag}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeAttribute(title || 'My Website')}">
  <meta property="og:url" content="${canonicalUrl}">${imageTags}
  <meta name="twitter:card" content="${socialImage ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${escapeAttribute(title || 'My Website')}">${structuredData}${animationGuard}
  <style>
${css}
  </style>
</head>
<body>
<div class="dc-scroll-progress" aria-hidden="true"></div>
${bodyContent}
<button class="dc-back-top" type="button" aria-label="Back to top">↑</button>
<dialog class="dc-lightbox" aria-label="Image preview"><img alt=""><form method="dialog"><button aria-label="Close preview">×</button></form></dialog>
<script>
(function () {
  var progress = document.querySelector('.dc-scroll-progress');
  var backTop = document.querySelector('.dc-back-top');
  var update = function () {
    var max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    backTop.classList.toggle('visible', scrollY > 500);
  };
  addEventListener('scroll', update, { passive: true }); update();
  backTop.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
${animationBlock}

  var lightbox = document.querySelector('.dc-lightbox');
  var preview = lightbox.querySelector('img');
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('click', function () { preview.src = img.currentSrc || img.src; preview.alt = img.alt; lightbox.showModal(); });
  });
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) lightbox.close(); });
  var analyticsUrl = ${JSON.stringify(`${exportContext.apiUrl}/api/analytics/hit`)};
  var projectId = ${JSON.stringify(exportContext.projectId)};
  if (projectId) {
    var analyticsBody = JSON.stringify({ projectId: projectId, referrer: document.referrer, screenWidth: screen.width });
    if (navigator.sendBeacon) navigator.sendBeacon(analyticsUrl, new Blob([analyticsBody], { type: 'application/json' }));
    else fetch(analyticsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: analyticsBody, keepalive: true }).catch(function () {});
  }
})();
</script>
</body>
</html>`;
};

// Download HTML file
export const downloadHtml = (serializedData, filename = 'website.html') => {
  const html = exportToHtml(serializedData, filename.replace('.html', ''));

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
