import { createBuilder, rgba, WHITE } from './_builder.mjs';
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
  b.video(hero, {
    sourceType: 'url',
    videoUrl: 'https://videos.pexels.com/video-files/7206150/7206150-hd_1920_1080_25fps.mp4',
  });

  const intro = b.container(root, { background: INK, padding: ['48', '48', '32', '48'], width: '100%' }, 'Intro');
  b.heading(intro, 'Light, and what it does to a face', { level: '1', fontSize: '48', color: BONE });
  b.text(intro, 'A studio in Florentin. Portraits, product, and the occasional wedding for people we like.', {
    fontSize: '17', color: MUTED, margin: ['12', '0', '0', '0'],
  });

  const work = b.container(root, { background: INK, padding: ['16', '48', '48', '48'], width: '100%', anchor: 'work' }, 'Work');
  const grid = b.columns(work, { count: '3', gap: '14' });
  for (const shot of [P.photography.lit, P.photography.portrait, P.photography.beauty,
                      P.photography.mono, P.photography.couple, P.photography.standing]) {
    // A fixed height, because a grid of photographs at their own aspect ratios
    // is a ragged grid. `object-fit: cover` does the rest.
    b.image(grid, shot(700), { radius: 2, width: '100%', height: '300px' });
  }

  const rates = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'rates', alignItems: 'center' }, 'Rates');
  b.heading(rates, 'Rates', { fontSize: '32', textAlign: 'center', color: BONE });
  b.spacer(rates, '24');
  b.pricing(rates, [
    'Portrait', '₪600', 'one hour', 'Book an hour', 'Twenty edited frames; Studio or location',
    'Half day', '₪1,900', 'four hours', 'Book a half day', 'Sixty frames; Two setups; Same-week delivery',
    'Campaign', 'From ₪6,000', 'per project', 'Get a quote', 'Full crew; Art direction; Usage included',
  ], { featured: 2, accent: AMBER, background: INK, color: BONE });

  const book = b.container(root, { background: INK, padding: ['56', '48', '72', '48'], width: '100%', anchor: 'book' }, 'Book');
  b.heading(book, 'Tell us what you need', { fontSize: '30', color: BONE });
  b.spacer(book, '20');
  b.form(book, { submitText: 'Send enquiry', accent: AMBER, background: PANEL });
  b.spacer(book, '20');
  b.link(book, 'Or just email us', 'mailto:hello@still.studio', { fontSize: '15' });

  b.footer(root, {
    brand: 'STILL',
    note: 'A studio in Florentin. Bookings two weeks out.',
    socials: ['Instagram', 'https://instagram.com/', 'Email', 'mailto:book@still.photo'],
    background: PANEL, ink: BONE, muted: MUTED,
  });

  return { name: 'Photography Studio — STILL', category: 'Portfolio', thumb: P.photography.portrait(600), map: b.map };
}
