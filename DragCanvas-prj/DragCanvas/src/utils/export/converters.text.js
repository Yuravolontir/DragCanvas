import { cssRules, generateClass, mobileRules } from './sheet.js';
import {
  escapeAttribute,
  escapeHtmlText,
  rgbaToString,
  slugifyAnchor,
  spacingToCss,
  stylesToCss,
} from './values.js';
import { normalizePaymentUrl } from '../elementData.js';

/**
 * Words on the page, and the things you press or follow.
 *
 * Each entry turns one saved node into the markup a published page needs.
 * They are gathered up in converters.js next door.
 */
export const textConverters = {
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
