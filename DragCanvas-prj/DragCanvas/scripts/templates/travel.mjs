import { createBuilder, rgba, WHITE } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/**
 * Travel Blog — Wanderlog (replaces template 16)
 *
 * A blog is a list of things to read plus a reason to come back, so the shape is
 * a carousel of recent trips, a short about, and somewhere to subscribe.
 */
export default function travel() {
  const b = createBuilder();
  const PAPER = rgba(253, 250, 245);
  const PANEL = rgba(240, 233, 222);
  const INK = rgba(38, 34, 30);
  const SEA = rgba(24, 108, 122);
  const MUTED = rgba(120, 110, 98);

  const root = b.root({ background: PAPER, width: '100%' });
  b.navbar(root, 'Wanderlog', [
    { text: 'Recent', href: '#recent' },
    { text: 'About', href: '#about' },
    { text: 'Subscribe', href: '#subscribe' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: PAPER, padding: ['72', '48', '40', '48'], width: '100%', backgroundImage: P.travel.ridge(1600), overlay: rgba(38, 34, 30, 0.55) }, 'Hero');
  b.heading(hero, 'Slow routes, written down', { level: '1', fontSize: '50', color: PAPER });
  b.text(hero, 'Trains, ferries and long walks. Notes from the places in between the places people go.', {
    fontSize: '18', color: rgba(255, 255, 255, 0.82), margin: ['14', '0', '0', '0'],
  });

  const recent = b.container(root, { background: PAPER, padding: ['24', '48', '48', '48'], width: '100%', anchor: 'recent' }, 'Recent');
  b.carousel(recent, {
    width: '100%', height: '420px', accent: SEA,
    src1: P.travel.window(1000), heading1: 'The long way to Lisbon', label1: 'Portugal', p1: 'Four days by rail when the flight was two hours.',
    src2: P.travel.mountains(1000), heading2: 'Winter in the Dolomites', label2: 'Italy', p2: 'Empty huts, cold mornings, better coffee than expected.',
    src3: P.travel.volcano(1000), heading3: 'Down the Danube', label3: 'Hungary', p3: 'A ferry, a bicycle, and a week without a plan.',
  });

  const about = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'about' }, 'About');
  const split = b.columns(about, { count: '2', gap: '40' });
  const bio = b.container(split, { background: PANEL, padding: ['0', '0', '0', '0'] }, 'Bio');
  b.heading(bio, 'Who is writing', { fontSize: '28', color: INK });
  b.text(bio, 'Ten years of taking the slower option and writing about what happened. No sponsored posts, no affiliate links.', {
    fontSize: '16', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  const said = b.container(split, { background: PANEL, padding: ['0', '0', '0', '0'] }, 'Said');
  b.quote(said, 'The only travel writing I read that makes the journey sound better than the destination.', {
    attribution: 'A reader', fontSize: '19', color: INK, accent: SEA,
  });

  const sub = b.container(root, { background: PAPER, padding: ['48', '48', '72', '48'], width: '100%', anchor: 'subscribe' }, 'Subscribe');
  b.heading(sub, 'One letter a month', { fontSize: '28', color: INK });
  b.spacer(sub, '16');
  b.form(sub, {
    fields: [{ label: 'Email', type: 'email', placeholder: 'you@example.com', required: true }],
    submitText: 'Subscribe', successMessage: 'Thanks — first letter arrives next month.',
    accent: SEA, background: PANEL,
  });
  b.spacer(sub, '20');
  b.socialLinks(sub, ['Instagram', 'https://instagram.com/', 'RSS', 'https://example.com/feed'], { color: INK });

  b.footer(root, {
    brand: 'Wanderlog',
    note: 'One long trip a month, written up slowly.',
    socials: ['Instagram', 'https://instagram.com/', 'RSS', 'https://example.com/feed'],
    background: INK, ink: PAPER, muted: PANEL,
  });

  return { id: 16, name: 'Travel Blog — Wanderlog', category: 'Landing Page', thumb: P.travel.alpine(600), map: b.map };
}
