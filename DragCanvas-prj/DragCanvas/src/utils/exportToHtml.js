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
    .filter(([_, value]) => value !== undefined && value !== null)
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

// Component types considered "large" for the row-stacking heuristic
const LARGE_CHILD_TYPES = new Set(['Container', 'Image', 'Video', 'Carousel', 'Custom1', 'Custom2', 'Custom3', 'Map']);

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

// Component converters
const converters = {
  Container: (node, data, depth = 0, nodeId) => {
    const props = node.props || {};
    const isRoot = nodeId === 'ROOT';
    const className = generateClass('container');

    const styles = {
      display: 'flex',
      flexDirection: props.flexDirection || 'column',
      alignItems: props.alignItems || 'flex-start',
      justifyContent: props.justifyContent || 'flex-start',
      width: isRoot ? '100%' : (props.width || '100%'),
      height: props.height || 'auto',
      padding: spacingToCss(props.padding),
      margin: isRoot ? '0 auto' : spacingToCss(props.margin),
      background: rgbaToString(props.background),
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
      const largeChildren = childIds.filter((id) => {
        const child = data[id];
        const typeName = child?.type?.resolvedName || child?.type;
        return !converters[typeName] || LARGE_CHILD_TYPES.has(typeName);
      });
      if (largeChildren.length >= 2) {
        // "column + column" sections stack vertically on phones
        mobile.flexDirection = 'column';
        mobile.alignItems = 'stretch';
      } else {
        // small inline groups (links, buttons) just wrap
        mobile.flexWrap = 'wrap';
      }
    }

    // Fixed px widths overflow a 375px screen
    if (!isRoot && /^\d+(\.\d+)?px$/.test(String(props.width || '').trim())) {
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

    return `  <div class="${className}">\n${childrenHtml}  </div>\n`;
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

    return `    <h2 class="${className}">${text}</h2>\n`;
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
  background: #0d6efd;
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
export const exportToHtml = (serializedData, title = 'My Website') => {
  // Reset state
  ruleCounter = 0;
  cssRules.length = 0;
  mobileRules.length = 0;

  // Add base CSS
  cssRules.push(`* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
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
