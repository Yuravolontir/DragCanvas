/**
 * The networks a Social links row can point at, and how each one is drawn.
 *
 * The element used to render the word "Instagram" in a pill, on the reasoning
 * that a name is understood by everybody who can read. That is true, and it is
 * also not what anybody expects a social row to look like — every site on the
 * web draws these as glyphs, so a row of words reads as a mistake.
 *
 * The glyphs are single 24x24 paths kept here as data rather than as
 * components, because the same drawing has to appear twice: once in React on
 * the canvas, and once as inline SVG in the published page, which has no
 * bundle to import an icon set from. One list, two renderers, no drift.
 *
 * Paths are Material Design Icons (Apache-2.0), except TikTok, which that set
 * predates and which is drawn here.
 */

export const SOCIAL_PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/yourname',
    match: /instagram\.com/i,
    path: 'M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2C22,19.4 19.4,22 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8C2,4.6 4.6,2 7.8,2M7.6,4C5.61,4 4,5.61 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4C18.39,20 20,18.39 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5C17.94,5.5 18.5,6.06 18.5,6.75C18.5,7.44 17.94,8 17.25,8C16.56,8 16,7.44 16,6.75C16,6.06 16.56,5.5 17.25,5.5M12,7C14.76,7 17,9.24 17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7M12,9C10.34,9 9,10.34 9,12C9,13.66 10.34,15 12,15C13.66,15 15,13.66 15,12C15,10.34 13.66,9 12,9Z',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourpage',
    match: /facebook\.com|fb\.me/i,
    path: 'M17,2V2H17V6H15C14.31,6 14,6.81 14,7.5V10H14L17,10V14H14V22H10V14H7V10H10V6C10,3.79 11.79,2 14,2H17Z',
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/yourname',
    match: /twitter\.com|(^|\/\/)(www\.)?x\.com/i,
    path: 'M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/yourcompany',
    match: /linkedin\.com/i,
    path: 'M21,21H17V14.25C17,13.19 15.81,12.31 14.75,12.31C13.69,12.31 13,13.19 13,14.25V21H9V9H13V11C13.66,9.93 15.36,9.24 16.5,9.24C19,9.24 21,11.28 21,13.75V21M7,21H3V9H7V21M5,3C6.1,3 7,3.9 7,5C7,6.1 6.1,7 5,7C3.9,7 3,6.1 3,5C3,3.9 3.9,3 5,3Z',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@yourchannel',
    match: /youtube\.com|youtu\.be/i,
    path: 'M10,16.5V7.5L16,12M20,4.4C19.4,4.2 15.7,4 12,4C8.3,4 4.6,4.19 4,4.38C2.44,4.9 2,8.4 2,12C2,15.59 2.44,19.1 4,19.61C4.6,19.81 8.3,20 12,20C15.7,20 19.4,19.81 20,19.61C21.56,19.1 22,15.59 22,12C22,8.4 21.56,4.91 20,4.4Z',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@yourname',
    match: /tiktok\.com/i,
    path: 'M16.5,3H13.4V15.1A2.6,2.6 0 1,1 10.8,12.5C11,12.5 11.2,12.53 11.4,12.58V9.44A5.74,5.74 0 1,0 16.5,15.15V8.93A6.9,6.9 0 0,0 20.5,10.2V7.09A3.87,3.87 0 0,1 16.5,3Z',
  },
  {
    id: 'github',
    label: 'GitHub',
    placeholder: 'https://github.com/yourname',
    match: /github\.com/i,
    path: 'M12,2C6.48,2 2,6.48 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12C22,6.48 17.52,2 12,2Z',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    placeholder: 'https://wa.me/15550100',
    match: /wa\.me|whatsapp\.com/i,
    path: 'M16.75,13.96C17,14.09 17.16,14.16 17.21,14.26C17.27,14.37 17.25,14.87 17,15.44C16.8,16 15.76,16.54 15.3,16.56C14.84,16.58 14.83,16.92 12.34,15.83C9.85,14.74 8.35,12.08 8.23,11.91C8.11,11.74 7.27,10.53 7.31,9.3C7.36,8.08 8,7.5 8.26,7.26C8.5,7 8.77,6.97 8.94,7H9.41C9.56,7 9.77,6.94 9.96,7.45L10.65,9.32C10.71,9.45 10.75,9.6 10.66,9.76L10.39,10.17L10,10.59C9.88,10.71 9.74,10.84 9.88,11.09C10,11.35 10.5,12.18 11.2,12.87C12.11,13.75 12.91,14.04 13.15,14.17C13.39,14.31 13.54,14.29 13.69,14.13L14.5,13.19C14.69,12.94 14.85,13 15.08,13.08L16.75,13.96M12,2C17.52,2 22,6.48 22,12C22,17.52 17.52,22 12,22C10.03,22 8.2,21.43 6.65,20.45L2,22L3.55,17.35C2.57,15.8 2,13.97 2,12C2,6.48 6.48,2 12,2M12,4C7.58,4 4,7.58 4,12C4,13.72 4.54,15.31 5.46,16.61L4.5,19.5L7.39,18.54C8.69,19.46 10.28,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4Z',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    placeholder: 'https://t.me/yourname',
    match: /t\.me|telegram\./i,
    path: 'M9.78,18.65L10.06,14.42L17.74,7.5C18.08,7.19 17.67,7.04 17.22,7.31L7.74,13.3L3.64,12C2.76,11.75 2.75,11.14 3.84,10.7L19.81,4.54C20.54,4.21 21.24,4.72 20.96,5.84L18.24,18.65C18.05,19.56 17.5,19.78 16.74,19.36L12.6,16.3L10.61,18.23C10.38,18.46 10.19,18.65 9.78,18.65Z',
  },
  {
    id: 'email',
    label: 'Email',
    placeholder: 'hello@example.com',
    match: /^mailto:/i,
    path: 'M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18C2,19.1 2.9,20 4,20H20C21.1,20 22,19.1 22,18V6C22,4.89 21.1,4 20,4Z',
  },
  {
    id: 'website',
    label: 'Website',
    placeholder: 'https://example.com',
    match: /./,
    path: 'M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2Z',
  },
];

const BY_ID = new Map(SOCIAL_PLATFORMS.map((platform) => [platform.id, platform]));

/** Website is the honest answer when nothing else fits, never a blank icon. */
export const FALLBACK_PLATFORM = BY_ID.get('website');

/**
 * Which network a row is for.
 *
 * A row saved before the selector existed has only a label and an address, so
 * the stored id wins, then the label read as a platform name, then the address.
 * That order matters: somebody who labelled their X account "Twitter" gets the
 * X glyph either way, and somebody who wrote "Our shop" over a Facebook link
 * still gets Facebook.
 */
export function socialPlatform(row = {}) {
  const id = String(row.platform || '').trim().toLowerCase();
  if (BY_ID.has(id)) return BY_ID.get(id);

  const label = String(row.label || '').trim().toLowerCase();
  if (label) {
    if (label === 'twitter') return BY_ID.get('x');
    const named = SOCIAL_PLATFORMS.find(
      (platform) => platform.id === label || platform.label.toLowerCase() === label
    );
    if (named) return named;
  }

  const href = String(row.href || '').trim();
  if (href) {
    const matched = SOCIAL_PLATFORMS.find(
      (platform) => platform.id !== 'website' && platform.match.test(href)
    );
    if (matched) return matched;
  }

  return FALLBACK_PLATFORM;
}

/**
 * The rows of a Social links element.
 *
 * Legacy stored alternating lines — a label, then an address — with no platform
 * anywhere, so the platform is worked out from what is there. Nothing is
 * rewritten on read.
 */
export function readSocialRows(props = {}) {
  const items = Array.isArray(props.items) ? props.items : [];
  const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const clean = (value) => (value === undefined || value === null ? '' : String(value)).trim();

  const rows = items.some(isRecord)
    ? items
        .filter(isRecord)
        .map((row) => ({ platform: clean(row.platform), label: clean(row.label), href: clean(row.href ?? row.url) }))
    : (() => {
        const flat = items.filter((entry) => !isRecord(entry)).map(clean);
        const out = [];
        for (let i = 0; i < flat.length; i += 2) {
          if (flat[i] || flat[i + 1]) out.push({ platform: '', label: flat[i] || '', href: flat[i + 1] || '' });
        }
        return out;
      })();

  return rows.map((row) => {
    const platform = socialPlatform(row);
    return { ...row, platform: platform.id, label: row.label || platform.label, icon: platform.path };
  });
}

export const emptySocialRow = () => ({ platform: 'instagram', label: 'Instagram', href: '' });

/**
 * The address a row actually links to.
 *
 * Email is the one platform whose value is not a URL, so a bare address gains
 * its `mailto:`. Everything else goes through the same refusal of anything that
 * is not an ordinary web address.
 */
export function socialHref(row = {}) {
  const value = String(row.href || '').trim();
  if (!value) return '';
  if (row.platform === 'email') {
    const bare = value.replace(/^mailto:/i, '');
    return bare ? `mailto:${bare}` : '';
  }
  if (/^mailto:/i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return '';
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.href : '';
  } catch {
    return '';
  }
}
