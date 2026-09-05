/**
 * Turning what the editor stored into what CSS and HTML accept.
 *
 * Every function here is pure: same input, same output, no page state. They are
 * the smallest pieces of the exporter and the easiest place to start reading.
 */

/** The editor stores colours as {r,g,b,a}; CSS wants a string. */
export const rgbaToString = (color) => {
  if (!color) return 'rgba(0, 0, 0, 1)';
  if (typeof color === 'string') return color;
  return `rgba(${color.r || 0}, ${color.g || 0}, ${color.b || 0}, ${color.a !== undefined ? color.a : 1})`;
};

/**
 * A padding/margin array as a CSS string.
 *
 * The editor writes `${p[0]}px ${p[1]}px ...` - if the array is malformed (an
 * AI-generated [20202020], say), that CSS is invalid and the browser ignores
 * it. This mirrors that: all four values must be numbers, otherwise 0.
 */
export const spacingToCss = (spacing) => {
  if (!Array.isArray(spacing) || spacing.length !== 4) return '0';
  if (spacing.some((v) => v === undefined || v === null || v === '' || isNaN(Number(v)))) return '0';
  return `${spacing[0]}px ${spacing[1]}px ${spacing[2]}px ${spacing[3]}px`;
};

/** { flexDirection: 'row' } → "  flex-direction: row;" - real CSS, not React camelCase. */
export const stylesToCss = (styles) => Object.entries(styles)
  .filter(([, value]) => value !== undefined && value !== null)
  .map(([key, value]) => `  ${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
  .join('\n');

/** Cap a px value; null means "no override is needed". */
export const capPx = (value, cap) => {
  const number = Number(value);
  if (isNaN(number) || number <= cap) return null;
  return cap;
};

/** Values that came from user input must not be able to break out of the HTML. */
export const escapeHtmlText = (text) => String(text ?? '')
  .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export const escapeAttribute = (text) => String(text ?? '')
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** A section's anchor, reduced to something legal in a URL fragment. */
export const slugifyAnchor = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);
