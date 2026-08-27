/**
 * Shared readings of element props.
 *
 * The editor component and the HTML exporter both have to interpret the same
 * stored data, and interpreting it twice is how the two drift apart - the canvas
 * showing one thing and the published page another. Anything both sides need to
 * agree on lives here.
 */

/**
 * An accordion's flat list of lines, read as question/answer pairs.
 *
 * Odd lines are questions, the line after each is its answer. A trailing
 * question with no answer keeps an empty one rather than being dropped: somebody
 * mid-edit should see their half-written entry, not have it disappear.
 */
export function pairUp(items) {
  const lines = Array.isArray(items) ? items : [];
  const out = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (lines[i]) out.push([lines[i], lines[i + 1] || '']);
  }
  return out;
}

/**
 * A list of records stored as lines, one field per line.
 *
 * Used by the elements that repeat a small record - pricing tiers, statistics,
 * team members. `size` is how many lines make one record.
 */
export function groupLines(items, size) {
  const lines = Array.isArray(items) ? items : [];
  const out = [];
  for (let i = 0; i < lines.length; i += size) {
    const record = lines.slice(i, i + size);
    if (record[0]) out.push(record);
  }
  return out;
}

/** Accept only browser-safe payment destinations. Bare domains gain HTTPS. */
export function normalizePaymentUrl(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean) && !/^https?:\/\//i.test(clean)) return '';
  const candidate = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.href : '';
  } catch {
    return '';
  }
}
