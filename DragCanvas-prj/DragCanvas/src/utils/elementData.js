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

/**
 * The video id inside anything a person might paste for a YouTube clip.
 *
 * People paste the address bar, the Share button's short link, an embed URL, or
 * just the id. Asking which one they have is a question the software can answer
 * itself, so all four are accepted and reduced to the id the embed needs.
 */
export function youTubeId(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';
  if (/^[\w-]{11}$/.test(clean)) return clean;
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/i,
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/embed\/([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
    /youtube\.com\/live\/([\w-]{11})/i,
  ];
  for (const pattern of patterns) {
    const found = clean.match(pattern);
    if (found) return found[1];
  }
  return '';
}

/**
 * What a screen reader should say about a picture.
 *
 * The alt field is gone from Properties: asking somebody to describe every
 * image is how you get "image1" typed into thirty boxes. Anything already
 * stored still wins, and where nothing is stored the file name is read - a
 * photo saved as `sourdough-loaves.jpg` describes itself better than an empty
 * string does, and an empty string is what an unanswered field produces.
 */
export function imageAltText(props = {}) {
  const stored = String(props.alt || '').trim();
  if (stored) return stored;
  const src = String(props.src || '').trim();
  if (!src) return '';
  const file = src.split(/[?#]/)[0].split('/').filter(Boolean).pop() || '';
  const words = file
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // A hash, an id or a Cloudinary blob describes nothing; silence is better
  // than reading twenty characters of base64 aloud.
  if (!words || words.length > 60 || !/[a-z]{3}/i.test(words) || /^[a-f0-9]{8,}$/i.test(words)) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Which of the three things a Video node is.
 *
 * The element grew a YouTube mode, a file mode and a background-hero mode, and
 * projects exist that were saved under each of them - some before `sourceType`
 * existed at all, when the filled-in field was the only clue. The editor and
 * the exporter both have to reach the same verdict, so they ask here.
 */
export function videoMode(props = {}) {
  if (props.sourceType === 'background') return 'background';
  if (props.sourceType === 'youtube') return 'youtube';
  if (props.sourceType === 'file') return 'file';
  // Saved before the mode was recorded: whichever field was filled in decides.
  return props.videoId ? 'youtube' : 'file';
}
