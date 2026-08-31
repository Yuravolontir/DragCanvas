/**
 * One reading of the elements that repeat a small record.
 *
 * Accordion questions, pricing tiers, statistics, team members, timeline steps,
 * logos, products and social links all store a list. They used to store it as
 * alternating lines of flat text — question, then answer, then the next
 * question — because a textarea is less machinery than a repeater. That made
 * every one of them a puzzle: nothing on screen said which line was which, a
 * blank line silently shifted every record after it, and a field that was not a
 * line of prose (a link, a platform, a suffix) had nowhere to live at all.
 *
 * Each list is a list of objects now, and each reader below still understands
 * the flat shape, so every saved project, every built template and everything
 * the generator has ever written keeps rendering. Nothing is rewritten on read:
 * a legacy node stays legacy until somebody edits it, and the first edit in the
 * panel writes the object form.
 *
 * The editor and the exporter both read through here, which is what stops the
 * canvas and the published page from disagreeing.
 */

/** Trim anything to a string, including numbers and null. */
const text = (value) => (value === undefined || value === null ? '' : String(value)).trim();

/** Is this a list entry the reader should treat as a record object? */
const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

/** Only arrays are lists. A string that was meant to be a list is not one. */
const asArray = (value) => (Array.isArray(value) ? value : []);

/**
 * Records stored as flat lines, `size` lines per record.
 *
 * Kept here rather than imported so the legacy path lives beside the shape it
 * is converting from. Unlike the old `groupLines`, a record whose first field
 * is empty is kept when any other field has content: dropping it is how a
 * half-typed row used to vanish while somebody was still typing it.
 */
const chunk = (items, size) => {
  const lines = asArray(items).filter((line) => !isRecord(line));
  const out = [];
  for (let i = 0; i < lines.length; i += size) {
    const record = lines.slice(i, i + size).map(text);
    if (record.some(Boolean)) out.push(record);
  }
  return out;
};

/**
 * A web address safe to put in an href.
 *
 * `javascript:` and friends are refused outright; a bare domain gains https.
 * `mailto:` and `tel:` pass through, because a social row and a team member's
 * card both legitimately hold one.
 */
export function safeHref(value) {
  const clean = text(value);
  if (!clean) return '';
  if (/^mailto:/i.test(clean)) return clean;
  if (/^tel:/i.test(clean)) return clean;
  // An email address typed without its scheme is still an email address.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return `mailto:${clean}`;
  if (/^#/.test(clean)) return clean;
  if (/^\//.test(clean)) return clean;
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean) && !/^https?:\/\//i.test(clean)) return '';
  const candidate = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.href : '';
  } catch {
    return '';
  }
}

/** Should a link to here open in a new tab? Only somewhere off this page. */
export const opensNewTab = (href) => /^https?:\/\//i.test(String(href || ''));

/* ------------------------------------------------------------------ *
 * Accordion — a question and the answer to it
 * ------------------------------------------------------------------ */

export function readAccordionRows(props = {}) {
  const items = asArray(props.items);
  if (items.some(isRecord)) {
    return items.filter(isRecord).map((row) => ({
      question: text(row.question ?? row.title ?? row.label),
      answer: text(row.answer ?? row.text ?? row.body),
    }));
  }
  return chunk(items, 2).map(([question, answer]) => ({ question, answer: answer || '' }));
}

export const emptyAccordionRow = () => ({ question: '', answer: '' });

/* ------------------------------------------------------------------ *
 * Pricing — a plan card
 * ------------------------------------------------------------------ */

/** Features arrive as a list, or as one string separated by semicolons. */
const readFeatures = (value) => {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return text(value)
    .split(/[;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
};

export function readPricingRows(props = {}) {
  const tiers = asArray(props.tiers);
  // Legacy stored which card stands out as a 1-based index in its own prop.
  const highlight = Number(props.featured);

  if (tiers.some(isRecord)) {
    return tiers.filter(isRecord).map((row, index) => ({
      name: text(row.name),
      price: text(row.price),
      period: text(row.period ?? row.suffix),
      cta: text(row.cta ?? row.buttonText),
      href: text(row.href ?? row.link),
      features: readFeatures(row.features),
      featured: row.featured === undefined ? index + 1 === highlight : !!row.featured,
    }));
  }

  return chunk(tiers, 5).map(([name, price, period, cta, features], index) => ({
    name,
    price,
    period,
    cta,
    href: '',
    features: readFeatures(features),
    featured: index + 1 === highlight,
  }));
}

export const emptyPricingRow = () => ({
  name: '',
  price: '',
  period: '',
  cta: '',
  href: '',
  features: [],
  featured: false,
});

/* ------------------------------------------------------------------ *
 * Stats — a number worth saying out loud
 * ------------------------------------------------------------------ */

export function readStatRows(props = {}) {
  const items = asArray(props.items);
  if (items.some(isRecord)) {
    return items.filter(isRecord).map((row) => ({
      prefix: text(row.prefix),
      value: text(row.value),
      suffix: text(row.suffix),
      label: text(row.label ?? row.caption),
    }));
  }
  return chunk(items, 2).map(([value, label]) => ({ prefix: '', value, suffix: '', label }));
}

export const emptyStatRow = () => ({ prefix: '', value: '', suffix: '', label: '' });

/** What the big line actually reads as, once its prefix and suffix are on. */
export const statDisplay = (row) => `${row.prefix || ''}${row.value || ''}${row.suffix || ''}`;

/**
 * Whether this row of numbers counts up to itself.
 *
 * Counting is about the figures, not about how the block arrives, so it is its
 * own property rather than one entry in the animation menu every element
 * shares. The old value is still read: a project saved while counting lived in
 * `animation` keeps counting.
 */
export function statsCountUp(props = {}) {
  if (typeof props?.countUp === 'boolean') return props.countUp;
  // Nothing stored means yes: counting is the reason a figure is set at 42px
  // rather than written into a sentence, and a template or a generated page
  // that never mentions it should still count.
  return true;
}

/** The visible value at one point in a count-up animation. */
export function statDisplayAtProgress(row, progress = 1) {
  const ratio = Math.max(0, Math.min(1, Number(progress) || 0));
  // The last frame reads back exactly what was typed, so a value written as
  // "1200" does not finish as "1,200" once the counting stops.
  if (ratio >= 1) return statDisplay(row || {});
  const raw = text(row?.value);
  let prefix = row?.prefix || '';
  let suffix = row?.suffix || '';
  let numeric = raw;
  const embedded = raw.match(/^([^\d+-]*)([-+]?\d[\d,\s]*?(?:\.\d+)?)([^\d]*)$/);
  if (embedded && !/^-?\d+(?:\.\d+)?$/.test(raw.replace(/[\s,]/g, ''))) {
    prefix += embedded[1];
    numeric = embedded[2];
    suffix = embedded[3] + suffix;
  }
  const normalized = numeric.replace(/[\s,]/g, '');
  // Text such as "24/7" remains readable instead of becoming NaN.
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return statDisplay(row || {});
  const target = Number(normalized);
  if (!Number.isFinite(target)) return statDisplay(row || {});
  const decimals = (normalized.split('.')[1] || '').length;
  const amount = target * ratio;
  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${prefix}${value}${suffix}`;
}

/* ------------------------------------------------------------------ *
 * TeamGrid — a person
 * ------------------------------------------------------------------ */

export function readTeamRows(props = {}) {
  const people = asArray(props.people);
  if (people.some(isRecord)) {
    return people.filter(isRecord).map((row) => ({
      name: text(row.name),
      role: text(row.role ?? row.title),
      photo: text(row.photo ?? row.image ?? row.src),
      href: text(row.href ?? row.link),
    }));
  }
  return chunk(people, 3).map(([name, role, photo]) => ({ name, role, photo, href: '' }));
}

export const emptyTeamRow = () => ({ name: '', role: '', photo: '', href: '' });

/* ------------------------------------------------------------------ *
 * Timeline — a step
 * ------------------------------------------------------------------ */

export function readTimelineRows(props = {}) {
  const steps = asArray(props.steps);
  if (steps.some(isRecord)) {
    return steps.filter(isRecord).map((row) => ({
      marker: text(row.marker ?? row.date),
      title: text(row.title),
      detail: text(row.detail ?? row.text ?? row.description),
    }));
  }
  return chunk(steps, 3).map(([marker, title, detail]) => ({ marker, title, detail }));
}

export const emptyTimelineRow = () => ({ marker: '', title: '', detail: '' });

/* ------------------------------------------------------------------ *
 * LogoStrip — one company in the row
 * ------------------------------------------------------------------ */

/** A URL, a data URI or a site-root path. Anything else is a name. */
export const isImageSource = (value) => /^(https?:\/\/|data:|\/)/i.test(text(value));

export function readLogoRows(props = {}) {
  const logos = asArray(props.logos);
  if (logos.some(isRecord)) {
    return logos.filter(isRecord).map((row) => {
      const src = text(row.src ?? row.image);
      const label = text(row.label ?? row.alt ?? row.name);
      return { src: isImageSource(src) ? src : '', label: label || (isImageSource(src) ? '' : src), href: text(row.href ?? row.link) };
    });
  }
  // Legacy: one line per logo, holding either an image address or a name. A
  // name is set as a wordmark, which is what a customer logo mostly is when
  // you do not have anybody's logo file.
  return logos
    .filter((entry) => text(entry))
    .map((entry) => (isImageSource(entry) ? { src: text(entry), label: '', href: '' } : { src: '', label: text(entry), href: '' }));
}

export const emptyLogoRow = () => ({ src: '', label: '', href: '' });

/* ------------------------------------------------------------------ *
 * ProductCatalog — a product card
 * ------------------------------------------------------------------ */

export function readProductRows(props = {}) {
  const products = asArray(props.products);
  const links = asArray(props.paymentLinks);
  if (products.some(isRecord)) {
    return products.filter(isRecord).map((row, index) => ({
      name: text(row.name ?? row.title),
      description: text(row.description ?? row.text),
      price: text(row.price),
      image: text(row.image ?? row.src),
      href: text(row.href ?? row.link ?? links[index]),
    }));
  }
  return chunk(products, 4).map(([name, description, price, image], index) => ({
    name,
    description,
    price,
    image,
    href: text(links[index]),
  }));
}

export const emptyProductRow = () => ({ name: '', description: '', price: '', image: '', href: '' });

/* ------------------------------------------------------------------ *
 * Engagement — the buttons a visitor can press
 * ------------------------------------------------------------------ */

/** The three things this element can be. Anything else is a review board. */
export const engagementMode = (props = {}) =>
  (['review', 'reaction', 'poll'].includes(props.mode) ? props.mode : 'review');

/**
 * Reaction and poll choices.
 *
 * Saved data has held a string, an array of objects and `null` here, and the
 * element used to call `.map` on whatever it found. Anything that is not a
 * list of usable labels reads as an empty list, which renders as nothing
 * rather than as a broken page.
 */
export function readEngagementOptions(props = {}) {
  const options = asArray(props.options);
  return options
    .map((option) => (isRecord(option) ? text(option.label ?? option.value ?? option.text) : text(option)))
    .filter(Boolean)
    .slice(0, 20);
}

/* ------------------------------------------------------------------ *
 * Countdown — the moment it is counting to
 * ------------------------------------------------------------------ */

/**
 * When the countdown ends, in milliseconds, or null when it has no valid date.
 *
 * The field used to ask for an "ISO date" and did nothing at all with anything
 * else, so an empty box or a typed "next friday" produced `NaN` and a row of
 * NaNs on the page. Null here means "no date set", which every caller renders
 * as zeros rather than as nonsense.
 */
export function countdownTarget(value) {
  const clean = text(value);
  if (!clean) return null;
  const parsed = Date.parse(clean);
  if (Number.isFinite(parsed)) return parsed;
  // `2030-01-01 09:00` — a space instead of the T, which people type and
  // Safari refuses.
  const patched = Date.parse(clean.replace(' ', 'T'));
  return Number.isFinite(patched) ? patched : null;
}

/** Days, hours, minutes, seconds left, never negative. */
export function countdownParts(target, now = Date.now()) {
  const left = target === null ? 0 : Math.max(0, target - now);
  return {
    expired: target !== null && left === 0,
    days: Math.floor(left / 86400000),
    hours: Math.floor(left / 3600000) % 24,
    minutes: Math.floor(left / 60000) % 60,
    seconds: Math.floor(left / 1000) % 60,
  };
}

/**
 * The value a `<input type="datetime-local">` wants, from whatever is stored.
 *
 * The control speaks in the visitor's own clock and has no timezone at all, so
 * the stored instant is rendered in the browser's zone. Empty when nothing
 * usable is stored, which leaves the field blank rather than showing 1970.
 */
export function toLocalInput(value) {
  const target = countdownTarget(value);
  if (target === null) return '';
  const at = new Date(target);
  const pad = (n) => String(n).padStart(2, '0');
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** The reverse: what the control gives back, stored as a precise instant. */
export function fromLocalInput(value) {
  const clean = text(value);
  if (!clean) return '';
  const at = new Date(clean);
  return Number.isFinite(at.getTime()) ? at.toISOString() : '';
}
