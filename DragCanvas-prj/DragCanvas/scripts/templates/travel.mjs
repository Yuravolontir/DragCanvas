import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/**
 * Travel Blog — Wanderlog (replaces template 16)
 *
 * A blog is a list of things to read plus a reason to come back. The shape is a
 * carousel of recent trips, the rules the writing follows, and one letter a month.
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
  b.badge(hero, 'One letter a month', { background: PANEL, color: SEA });
  b.heading(hero, 'Slow routes, written down', { level: '1', fontSize: '48', color: PAPER, margin: ['14', '0', '10', '0'] });
  b.text(hero, 'Trains, ferries and long walks. Notes from the places in between the places people go.', {
    fontSize: '18', color: rgba(255, 255, 255, 0.82), margin: ['0', '0', '24', '0'],
  });
  b.button(hero, 'Read the latest', { background: SEA, color: WHITE, buttonStyle: 'full' });

  const recent = b.container(root, { background: PAPER, padding: ['24', '48', '48', '48'], width: '100%', anchor: 'recent' }, 'Recent');
  b.carousel(recent, {
    width: '100%', height: '420px', accent: SEA,
    src1: P.travel.window(1000), heading1: 'The long way to Lisbon', label1: 'Portugal', p1: 'Four days by rail when the flight was two hours.',
    src2: P.travel.mountains(1000), heading2: 'Winter in the Dolomites', label2: 'Italy', p2: 'Empty huts, cold mornings, better coffee than expected.',
    src3: P.travel.volcano(1000), heading3: 'Down the Danube', label3: 'Hungary', p3: 'A ferry, a bicycle, and a week without a plan.',
  });

  // ── the site in three numbers ───────────────────────────────────
  const num = b.container(root, { background: PAPER, padding: ['32', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['64', 'routes, written up', '11', 'years of the slow option', '0', 'sponsored posts, ever'], {
    accent: SEA, color: MUTED,
  });

  // ── the rules the writing follows ───────────────────────────────
  const rules = b.container(root, { background: PAPER, padding: ['32', '48', '40', '48'], width: '100%' }, 'Rules');
  b.heading(rules, 'What every letter holds to', { fontSize: '30', color: INK });
  b.spacer(rules, '24');
  const rulesCols = b.columns(rules, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Slow by default', 'train', 'Rail, ferry, foot. A flight is a last resort, not a starting point.'],
    ['Practical, not dreamy', 'route', 'Times, prices, and where the last bus actually leaves from.'],
    ['Nothing sponsored', 'verified', 'No press trips, no affiliate links. If a bed was free, the letter says so.'],
  ]) {
    const card = b.container(rulesCols, { background: PANEL, padding: ['24', '22', '24', '22'], radius: 10 }, name);
    b.icon(card, symbol, { color: PANEL, background: SEA });
    b.heading(card, name, { level: '3', fontSize: '18', color: INK, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  // ── how a trip becomes a letter ─────────────────────────────────
  const how = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'How');
  b.heading(how, 'How a trip becomes a letter', { fontSize: '30', color: INK });
  b.spacer(how, '24');
  b.timeline(how, [
    'Days 1–5', 'The trip itself', 'Notebook in the pocket, phone in the bag, nothing posted until it is over.',
    'Week 2', 'The writing', 'Typed up while the details still smell of the train — prices, times, mistakes.',
    'Month end', 'The letter', 'One route, a handful of photographs, and what we would do differently.',
  ], { accent: SEA, color: INK });

  const about = b.container(root, { background: PAPER, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'about' }, 'About');
  const split = b.columns(about, { count: '2', gap: '40' });
  const bio = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Bio');
  b.heading(bio, 'Who is writing', { fontSize: '28', color: INK });
  b.text(bio, 'Ten years of taking the slower option and writing about what happened. No sponsored posts, no affiliate links, no photographs that are not mine.', {
    fontSize: '16', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  const said = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Said');
  b.quote(said, 'The only travel writing I read that makes the journey sound better than the destination.', {
    attribution: 'A reader, three years in', fontSize: '19', color: INK, accent: SEA,
  });

  // ── the questions readers actually send ─────────────────────────
  const ask = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Asked, answered', { fontSize: '30', color: INK });
  b.text(askIntro, 'The three questions that arrive by email every single week.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'Can I follow the routes with children?',
    'Most of them, yes. Where a route breaks with a pram or a bored nine-year-old, the letter says so plainly.',
    'Do you ever fly?',
    'Sometimes, and it is marked. Crossing an ocean by ship is a week I do not always have.',
    'May I use your itineraries?',
    'Take them. A credit is welcome if you are publishing, but they are written to be used.',
  ], { background: PAPER, color: INK, radius: 10 });

  // ── the letter itself ───────────────────────────────────────────
  const sub = b.container(root, { background: PAPER, padding: ['48', '48', '32', '48'], width: '100%', anchor: 'subscribe' }, 'Subscribe');
  const subSplit = b.columns(sub, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const subCopy = b.container(subSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Subscribe copy');
  b.heading(subCopy, 'One letter a month', { fontSize: '30', color: INK });
  b.text(subCopy, 'Sent on the last Friday. Unsubscribing is one click and no guilt trip.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(subCopy, [
    'The route, day by day',
    'What it cost, honestly',
    'One photograph worth keeping',
  ], { color: MUTED, fontSize: '15' });
  b.form(subSplit, {
    fields: [{ label: 'Email', type: 'email', placeholder: 'you@example.com', required: true }],
    submitText: 'Subscribe', successMessage: 'Thanks — first letter arrives next month.',
    accent: SEA, background: PANEL,
  });

  const close = b.container(root, { background: PAPER, padding: ['24', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Take the slow way somewhere',
    text: 'The Lisbon letter is the best introduction — four days by rail for the price of patience.',
    cta: 'Read the Lisbon letter', href: '#recent',
    background: SEA, color: WHITE, buttonBackground: PAPER, buttonColor: INK,
  });

  b.footer(root, {
    brand: 'Wanderlog',
    note: 'One long trip a month, written up slowly.',
    socials: ['Instagram', 'https://instagram.com/', 'RSS', 'https://example.com/feed'],
    background: INK, ink: PAPER, muted: PANEL,
  });

  return { id: 16, name: 'Travel Blog — Wanderlog', category: 'Landing Page', thumb: P.travel.alpine(600), map: b.map };
}
