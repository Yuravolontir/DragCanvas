/**
 * Convert Craft.js serialized data to clean HTML with inline CSS
 */

// Helper: Convert rgba object to CSS color string
const rgbaToString = (color) => {
  if (!color) return 'rgba(0, 0, 0, 1)';
  if (typeof color === 'string') return color;
  return `rgba(${color.r || 0}, ${color.g || 0}, ${color.b || 0}, ${color.a !== undefined ? color.a : 1})`;
};

// Helper: Convert padding/margin array to CSS string
const spacingToCss = (spacing) => {
  if (!spacing || !Array.isArray(spacing)) return '0';
  return `${spacing[0] || 0}px ${spacing[1] || 0}px ${spacing[2] || 0}px ${spacing[3] || 0}px`;
};

// Helper: Generate unique ID for CSS rules
let ruleCounter = 0;
const generateClass = (prefix) => {
  return `${prefix}-${++ruleCounter}`;
};

// Store all CSS rules
const cssRules = [];

// Component converters
const converters = {
  Container: (node, depth = 0) => {
    const props = node.props || {};
    const className = generateClass('container');

    const styles = {
      display: 'flex',
      flexDirection: props.flexDirection || 'column',
      alignItems: props.alignItems || 'flex-start',
      justifyContent: props.justifyContent || 'flex-start',
      width: props.width || '100%',
      height: props.height || 'auto',
      padding: spacingToCss(props.padding),
      margin: spacingToCss(props.margin),
      background: rgbaToString(props.background),
      color: rgbaToString(props.color),
      borderRadius: `${props.radius || 0}px`,
      boxShadow: props.shadow > 0
        ? `0px 3px 100px ${props.shadow}px rgba(0, 0, 0, 0.13)`
        : 'none',
      flex: props.fillSpace === 'yes' ? '1' : 'unset',
      boxSizing: 'border-box',
    };

    // Filter out undefined/null values
    const cssString = Object.entries(styles)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    cssRules.push(`.${className} {\n${cssString}\n}`);

    let childrenHtml = '';
    if (node.nodes && Array.isArray(node.nodes)) {
      for (const childNodeId of node.nodes) {
        childrenHtml += convertNode(childNodeId, depth + 1);
      }
    }

    return `  <div class="${className}">\n${childrenHtml}  </div>\n`;
  },

  Text: (node) => {
    const props = node.props || {};
    const className = generateClass('text');

    const styles = {
      width: '100%',
      margin: spacingToCss(props.margin),
      color: rgbaToString(props.color),
      fontSize: `${props.fontSize || 15}px`,
      fontWeight: props.fontWeight || '500',
      textAlign: props.textAlign || 'left',
      textShadow: props.shadow > 0
        ? `0px 0px 2px rgba(0,0,0,${props.shadow / 100})`
        : 'none',
    };

    const cssString = Object.entries(styles)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    cssRules.push(`.${className} {\n${cssString}\n}`);

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

    const cssString = Object.entries(styles)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    cssRules.push(`.${className} {\n${cssString}\n}`);

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

    cssRules.push(`.${wrapperClass} {\n${Object.entries(wrapperStyles).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`);

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

    const cssString = Object.entries(styles)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    cssRules.push(`.${className} {\n${cssString}\n}`);

    return `    <img class="${className}" src="${props.src || ''}" alt="" />\n`;
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

    const cssString = Object.entries(styles)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    cssRules.push(`.${className} {\n${cssString}\n}`);
    cssRules.push(`.${className}:hover {\n  color: #0052a3;\n  text-decoration: underline;\n}\n`);

    return `    <a class="${className}" href="${props.href || '#'}">${props.text || 'Link'}</a>\n`;
  },
};

// Convert a single node to HTML
const convertNode = (nodeId, data, depth = 0) => {
  const node = data.nodes[nodeId];
  if (!node) return '';

  const typeName = node.type?.resolvedName || node.type;
  const converter = converters[typeName];

  if (!converter) {
    console.warn(`No converter for type: ${typeName}`);
    return '';
  }

  return converter(node, depth);
};

// Main export function
export const exportToHtml = (serializedData, title = 'My Website') => {
  // Reset state
  ruleCounter = 0;
  cssRules.length = 0;

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

  // Find ROOT node and convert children
  let htmlContent = '';

  if (serializedData.nodes) {
    const rootNode = serializedData.nodes.ROOT;
    if (rootNode && rootNode.nodes) {
      for (const childNodeId of rootNode.nodes) {
        htmlContent += convertNode(childNodeId, serializedData);
      }
    }
  }

  // Combine everything
  const css = cssRules.join('\n\n');

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
