import { createBuilder, rgba, WHITE, TRANSPARENT, RADIUS, PAD, SHADOW } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/** Photography studio — image-led, dark, one accent, a booking form at the end. */
export default function photography() {
  const b = createBuilder();
  const INK = rgba(12, 12, 14);
  const PANEL = rgba(24, 24, 28);
  const BONE = rgba(240, 238, 235);
  const AMBER = rgba(224, 168, 92);
  const MUTED = rgba(136, 134, 140);

  const root = b.root({ background: INK, width: '100%' });
  b.navbar(root, 'STILL', [
    { text: 'Work', href: '#work' },
    { text: 'Rates', href: '#rates' },
    { text: 'Book', href: '#book' },
  ], { variant: 'dark' });

  const hero = b.container(root, { background: INK, padding: ['0', '0', '0', '0'], width: '100%' }, 'Hero');
  // A studio portrait session, which is what the studio sells. The caption is
  // left empty on purpose: the page's one h1 is directly below, and printing
  // the same line twice made the hero read as a duplicate rather than a lead.
  b.backgroundVideo(hero, {
    src: 'https://videos.pexels.com/video-files/7206150/7206150-hd_1920_1080_25fps.mp4',
    // The poster is the hero on a phone, under reduced motion, and if the clip
    // fails - so it has to be a frame that stands on its own.
    poster: P.photography.portrait(1600),
    overlay: 0,
    minHeight: '520px',
  });

  const intro = b.container(root, { background: INK, padding: ['48', '48', '32', '48'], width: '100%' }, 'Intro');
  b.heading(intro, 'Light, and what it does to a face', { level: '1', fontSize: '48', color: BONE });
  b.text(intro, 'A studio in Florentin. Portraits, product, and the occasional wedding for people we like.', {
    fontSize: '17', color: MUTED, margin: ['12', '0', '0', '0'],
  });

  // ── the studio in three numbers ─────────────────────────────────
  const num = b.container(root, { background: INK, padding: ['16', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['200+', 'portraits a year', '48h', 'until the gallery lands', '12', 'years in Florentin'], {
    accent: AMBER, color: MUTED,
  });

  const work = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%', anchor: 'work' }, 'Work');
  const grid = b.columns(work, { count: '3', gap: '14' });
  for (const shot of [P.photography.lit, P.photography.portrait, P.photography.beauty,
                      P.photography.mono, P.photography.couple, P.photography.standing]) {
    // A fixed height, because a grid of photographs at their own aspect ratios
    // is a ragged grid. `object-fit: cover` does the rest.
    b.image(grid, shot(700), { alt: 'Editorial portrait from the studio portfolio', radius: RADIUS.chip, width: '100%', height: '300px' });
  }

  // ── what every booking means here ───────────────────────────────
  const means = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%' }, 'Included');
  b.heading(means, 'What an hour here includes', { fontSize: '30', color: BONE });
  b.spacer(means, '24');
  const meansCols = b.columns(means, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['The frames are yours', 'download', 'Every edited frame, full resolution, yours to print. No watermarks, ever.'],
    ['Retouched by hand', 'auto_fix_high', 'Skin kept as skin. We remove the pimple, not the texture.'],
    ['Back within 48 hours', 'schedule', 'Galleries land two days after the shoot, usually the same evening.'],
  ]) {
    const card = b.container(meansCols, { background: PANEL, padding: ['24', '22', '24', '22'], shadow: SHADOW.lifted, radius: RADIUS.card }, name);
    b.icon(card, symbol, { color: INK, background: AMBER });
    b.heading(card, name, { level: '3', fontSize: '18', color: BONE, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  // ── how a shoot actually goes ───────────────────────────────────
  const how = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%' }, 'How');
  b.heading(how, 'How the hour goes', { fontSize: '30', color: BONE });
  b.spacer(how, '24');
  b.timeline(how, [
    'First 10', 'Coffee and clothes', 'Bring options. The first outfit is never the one, and that is fine.',
    'The hour', 'Shoot and look', 'We review frames together as we go, so nothing at the end is a surprise.',
    '+48h', 'The gallery', 'A private link. You pick, we retouch, you print wherever you like.',
  ], { accent: AMBER, color: BONE });

  const rates = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'rates', alignItems: 'center' }, 'Rates');
  b.heading(rates, 'Rates', { fontSize: '32', textAlign: 'center', color: BONE });
  b.spacer(rates, '24');
  b.pricing(rates, [
    'Portrait', '₪600', 'one hour', 'Book an hour', 'Twenty edited frames; Studio or location',
    'Half day', '₪1,900', 'four hours', 'Book a half day', 'Sixty frames; Two setups; Same-week delivery',
    'Campaign', 'From ₪6,000', 'per project', 'Get a quote', 'Full crew; Art direction; Usage included',
  ], { featured: 2, accent: AMBER, background: INK, color: BONE });

  const said = b.container(root, { background: INK, padding: ['16', '48', '48', '48'], width: '100%' }, 'Said');
  b.testimonial(said, {
    quote: 'I came in for a headshot and left with the first photograph of myself I have ever liked.',
    author: 'Noa Kirsh', role: 'Portrait, March',
    background: PANEL, color: BONE, accent: AMBER,
  });

  // ── what people write before their first shoot ──────────────────
  const ask = b.container(root, { background: PANEL, padding: PAD.regular, width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Before you book', { fontSize: '30', color: BONE });
  b.text(askIntro, 'The three lines every first email contains.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'I am awkward in front of a camera.',
    'Everyone says that, and an hour in nobody is. The first ten minutes are quietly deleted and we both know it.',
    'Film or digital?',
    'Digital for the hour; film on request. Film adds a week and ₪300, and is worth it exactly twice a year.',
    'Can we shoot at our flat instead?',
    'Yes. Anywhere in the city costs the same — we bring the same lights and the same backdrop.',
  ], { background: INK, color: BONE, radius: RADIUS.chip });

  const book = b.container(root, { background: INK, padding: ['48', '48', '32', '48'], width: '100%', anchor: 'book' }, 'Book');
  const bookSplit = b.columns(book, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const bookCopy = b.container(bookSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Book copy');
  b.heading(bookCopy, 'Tell us what you need', { fontSize: '30', color: BONE });
  b.text(bookCopy, 'A date and an idea is enough. We reply the same day with two slots.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(bookCopy, [
    'Two weeks out, usually sooner',
    'Evenings and Sundays included',
    'The deposit holds a slot and moves once, free',
  ], { color: MUTED, fontSize: '15' });
  b.form(bookSplit, { submitText: 'Send enquiry', accent: AMBER, background: PANEL, textColor: BONE });
  b.spacer(book, '20');
  b.link(book, 'Or just email us', 'mailto:hello@still.studio', { fontSize: '15' });

  const close = b.container(root, { background: INK, padding: ['0', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'The awkward ones make the best frames',
    text: 'The people who arrive apologising are the people the photographs are for. Two weeks out, usually sooner.',
    cta: 'Book an hour', href: '#book',
    background: AMBER, color: INK, buttonBackground: INK, buttonColor: AMBER,
  });

  b.modernSuite(root, { mode: 'service', background: INK, panel: PANEL, ink: BONE, accent: AMBER });
  b.footer(root, {
    brand: 'STILL',
    note: 'A studio in Florentin. Bookings two weeks out.',
    socials: ['Instagram', 'https://instagram.com/', 'Email', 'mailto:book@still.photo'],
    background: PANEL, ink: BONE, muted: MUTED,
  });

  return { name: 'Photography Studio — STILL', category: 'Portfolio', thumb: P.photography.portrait(600), map: b.map };
}
