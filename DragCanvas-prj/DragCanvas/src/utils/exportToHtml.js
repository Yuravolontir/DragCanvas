import { columnTracks } from './columnTracks.js';
import { pairUp, groupLines } from './elementData.js';

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
    const entries = pairUp(props.items);

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

    const html = entries.map(([q, a]) => `      <details>
        <summary>${escapeHtmlText(q)}</summary>
        <div class="answer">${escapeHtmlText(a)}</div>
      </details>`).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Tiers in a grid, so the columns line up and the buttons share a baseline. */
  Pricing: (node) => {
    const props = node.props || {};
    const className = generateClass('pricing');
    const records = groupLines(props.tiers, 5);
    const accent = rgbaToString(props.accent) || '#0040e0';
    const highlight = Number(props.featured);

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
.${className} .tier.featured .cta span { background: ${accent}; color: #fff; }`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: minmax(0, 1fr);\n  }`);

    const tiers = records.map(([name, price, period, cta, features], i) => {
      const items = String(features || '').split(';').filter(Boolean)
        .map(f => `          <li>${escapeHtmlText(f.trim())}</li>`).join('\n');
      return `      <div class="tier${i + 1 === highlight ? ' featured' : ''}">
        <span class="name">${escapeHtmlText(name)}</span>
        <span class="price">${escapeHtmlText(price)}</span>
        <span class="period">${escapeHtmlText(period)}</span>
        <ul>
${items}
        </ul>
        <span class="cta"><span>${escapeHtmlText(cta)}</span></span>
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
      ? `<img src="${escapeAttribute(resolveImageSrc(props.avatar))}" alt="">`
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

  /** A row of numbers worth saying out loud. */
  Stats: (node) => {
    const props = node.props || {};
    const className = generateClass('stats');
    const records = groupLines(props.items, 2);

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

    const html = records.map(([value, label]) => `      <div>
        <span class="value">${escapeHtmlText(value)}</span>
        <span class="label">${escapeHtmlText(label)}</span>
      </div>`).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** The people behind the thing. */
  TeamGrid: (node) => {
    const props = node.props || {};
    const className = generateClass('teamgrid');
    const records = groupLines(props.people, 3);

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
.${className} .role { display: block; font-size: 13px; opacity: 0.65; }`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }`);

    const html = records.map(([name, role, photo]) => {
      const face = photo
        ? `<img src="${escapeAttribute(resolveImageSrc(photo))}" alt="">`
        : `<span class="initial">${escapeHtmlText((name || '?').trim().charAt(0).toUpperCase())}</span>`;
      return `      <figure>
        ${face}
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
    const records = groupLines(props.steps, 3);
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
  background: ${accent}; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.${className} .tail { flex: 1; width: 2px; background: ${accent}; opacity: 0.25; min-height: 24px; }
.${className} .title { display: block; font-weight: 700; font-size: 17px; }
.${className} .detail { display: block; font-size: 14px; opacity: 0.7; line-height: 1.6; margin-top: 4px; }
.${className} .body { padding-bottom: 28px; }
.${className} .step:last-child .body { padding-bottom: 0; }`);

    const html = records.map(([marker, title, detail], i) => `      <div class="step">
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
    const logos = Array.isArray(props.logos) ? props.logos : [];

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

${props.grayscale === 'no' ? '' : `.${className} img:hover {\n  filter: none;\n  opacity: 1;\n}`}`);

    // A line that is not a URL is a name, and is set as a wordmark. See the
    // LogoStrip component for why that is the more useful reading.
    const html = logos
      .map(entry => (/^(https?:\/\/|data:|\/)/i.test(String(entry).trim())
        ? `      <img src="${escapeAttribute(resolveImageSrc(entry))}" alt="">`
        : `      <span>${escapeHtmlText(String(entry))}</span>`))
      .join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Where else to find them. */
  SocialLinks: (node) => {
    const props = node.props || {};
    const className = generateClass('sociallinks');
    const records = groupLines(props.items, 2);

    cssRules.push(`.${className} {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.${className} a {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: ${Number(props.size) || 14}px;
  font-weight: 600;
  text-decoration: none;
  background: ${rgbaToString(props.background) || 'rgba(0,0,0,0.06)'};
  color: ${rgbaToString(props.color) || 'inherit'};
}`);

    const html = records
      .map(([label, href]) => `      <a href="${escapeAttribute(href || '#')}" rel="noopener">${escapeHtmlText(label)}</a>`)
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
    return `    <button class="${className}">${text}</button>\n`;
  },

  Video: (node) => {
    const props = node.props || {};
    const wrapperClass = generateClass('video-wrapper');

    const wrapperStyles = {
      width: '100%',
      height: '100%',
      position: 'relative',
    };

    cssRules.push(`.${wrapperClass} {\n${stylesToCss(wrapperStyles)}\n}`);

    if (props.videoId) {
      // YouTube embed
      return `    <div class="${wrapperClass}">
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/${props.videoId}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>\n`;
    } else if (props.videoUrl) {
      // HTML5 video
      const overlayClass = generateClass('video-overlay');
      cssRules.push(`.${overlayClass} {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: white;\n  text-align: center;\n  font-size: 2rem;\n  font-weight: bold;\n  z-index: 2;\n  background: rgba(0, 0, 0, 0.1);\n  padding: 1rem;\n  border-radius: 8px;\n}\n`);

      return `    <div class="${wrapperClass}" style="padding-top: 56.25%; overflow: hidden;">
      <video
        autoplay
        loop
        muted
        playsinline
        controls
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
        <source src="${props.videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      ${props.text ? `<div class="${overlayClass}"><h1 style="color: white; margin: 0;">${props.text}</h1></div>` : ''}
    </div>\n`;
    }

    return '';
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

    return `    <img class="${className}" src="${resolveImageSrc(props.src)}" alt="" />\n`;
  },

  Carousel: (node) => {
    const props = node.props || {};
    const className = generateClass('carousel');

    const height = props.height || '400px';

    // CSS-only carousel: horizontal scroll-snap strip (swipeable on mobile)
    cssRules.push(`.${className} {
  display: flex;
  width: 100%;
  height: ${height};
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  border-radius: 12px;
}
.${className}::-webkit-scrollbar { display: none; }
.${className} .slide {
  position: relative;
  flex: 0 0 100%;
  scroll-snap-align: start;
  background-size: cover;
  background-position: center;
}
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
  background: ${rgbaToString(props.accent) || '#0d6efd'};
}`);

    let slides = '';
    for (const i of [1, 2, 3]) {
      const src = props[`src${i}`];
      if (!src) continue;
      const label = props[`label${i}`];
      slides += `      <div class="slide" style="background-image: url('${resolveImageSrc(src)}')">
        <div class="caption">
          ${label ? `<span class="badge">${label}</span>` : ''}
          <h3>${props[`heading${i}`] || ''}</h3>
          <p>${props[`p${i}`] || ''}</p>
        </div>
      </div>\n`;
    }

    return `    <div class="${className}">\n${slides}    </div>\n`;
  },

  /**
   * A real, working form on the published page.
   *
   * The editor renders an inert preview; this is what visitors actually use.
   * It posts to our API from whatever domain the site ended up on, so the
   * project id has to be baked in at export time - the page has no other way
   * to know which site it belongs to.
   */
  Form: (node) => {
    const context = exportContext;
    const props = node.props || {};
    const className = generateClass('form');
    const fields = Array.isArray(props.fields) ? props.fields : [];
    const radius = props.radius ?? 8;
    const accent = rgbaToString(props.accent) || '#7e57c2';

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
  color: #49454f;
}
.${className} input,
.${className} textarea {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: ${radius}px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}
.${className} button {
  background: ${accent};
  color: #fff;
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
      const inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text';
      return `      <label>${label}</label>\n      <input type="${inputType}" name="${escapeAttribute(name)}" placeholder="${placeholder}"${required}>`;
    }).join('\n');

    const formId = `${className}-el`;
    const apiUrl = context.apiUrl || '';
    const projectId = context.projectId ?? '';
    const successMessage = escapeHtmlText(props.successMessage || 'Thank you!');

    return `    <div class="${className}">
      <form id="${formId}">
${inputs}
        <input type="text" name="_hp" class="hp" tabindex="-1" autocomplete="off">
        <button type="submit">${escapeHtmlText(props.submitText || 'Send')}</button>
      </form>
      <script>
      (function () {
        var form = document.getElementById('${formId}');
        if (!form) return;
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var button = form.querySelector('button');
          button.disabled = true;
          var payload = { projectId: ${JSON.stringify(projectId)} };
          new FormData(form).forEach(function (value, key) { payload[key] = value; });
          fetch('${apiUrl}/api/forms/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(function (response) {
            if (!response.ok) throw new Error('failed');
            form.outerHTML = '<p class="form-done">${successMessage}</p>';
          }).catch(function () {
            button.disabled = false;
            alert('Could not send. Please try again.');
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
        return `        <span class="dead">${label}</span>`;
      })
      .join('\n');

    return `    <nav class="${className}">
      <a class="brand" href="#">${escapeHtmlText(props.brand || '')}</a>
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
    return converter(node, data, depth, nodeId);
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

  // A published page has no way of knowing which project it came from, so the
  // id is baked in here; the API address is the one this build points at.
  exportContext = {
    projectId: options.projectId ?? null,
    apiUrl: options.apiUrl || import.meta.env?.VITE_API_URL || 'http://localhost:3001',
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
}`);

  // serializedData is the flat node map from query.serialize(): ROOT is a top-level key
  let htmlContent = '';

  const rootNode = serializedData.ROOT;
  if (rootNode) {
    // ROOT itself is the canvas Container — convert it so its background/layout is kept
    htmlContent = convertNode('ROOT', serializedData);
  }

  // Combine everything; mobile overrides go last so they win the cascade
  let css = cssRules.join('\n\n');
  if (mobileRules.length > 0) {
    css += `\n\n@media (max-width: 768px) {\n${mobileRules.join('\n\n')}\n}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body>
${htmlContent}
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
