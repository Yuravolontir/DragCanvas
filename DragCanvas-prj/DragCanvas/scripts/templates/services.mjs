import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/**
 * Local services — a trade that lives on trust and a quick quote.
 *
 * The whole page leads to one form. Everything above it exists to make sending
 * that form feel safe: the work shown, the process named, the price honest.
 */
export default function services() {
  const b = createBuilder();
  const PAPER = rgba(250, 250, 249);
  const PANEL = rgba(240, 240, 238);
  const INK = rgba(28, 30, 30);
  const AMBER = rgba(214, 138, 30);
  // Amber is a fill, not an ink: dark type reads on it, white type does not,
  // and the colour itself is far too pale to write with on paper.
  const AMBER_INK = rgba(146, 94, 20);
  const MUTED = rgba(104, 108, 108);

  const root = b.root({ background: PAPER, width: '100%' });
  b.navbar(root, 'Northside Joinery', [
    { text: 'Work', href: '#work' },
    { text: 'Prices', href: '#prices' },
    { text: 'Quote', href: '#quote' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: PAPER, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: P.joinery.shop(1600), overlay: rgba(28, 30, 30, 0.66) }, 'Hero');
  const top = b.columns(hero, { count: '2', gap: '40', align: 'center' });
  const words = b.container(top, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Words');
  b.badge(words, 'Booking three weeks ahead', { background: PANEL, color: AMBER_INK });
  b.heading(words, 'Fitted properly, first time', { level: '1', fontSize: '44', color: PAPER, margin: ['12', '0', '10', '0'] });
  b.text(words, 'Kitchens, wardrobes and stairs. One joiner, no subcontractors, and a written quote before anything is cut.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82),
  });
  b.button(words, 'Get a quote', { background: AMBER, color: INK, buttonStyle: 'full' });
  b.image(top, P.joinery.bench(900), { alt: 'Joiner shaping timber at a workshop bench', radius: 10, width: '100%', height: '400px' });

  // ── the joinery in three numbers ────────────────────────────────
  const num = b.container(root, { background: PAPER, padding: ['32', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['18', 'years at the bench', '6 wks', 'a kitchen, start to finish', '10 yr', 'guarantee, in writing'], {
    accent: AMBER_INK, color: MUTED,
  });

  const work = b.container(root, { background: PAPER, padding: ['32', '48', '40', '48'], width: '100%', anchor: 'work' }, 'Work');
  b.heading(work, 'From the bench to the wall', { fontSize: '30', color: INK });
  b.spacer(work, '20');
  const ba = b.columns(work, { count: '2', gap: '20' });
  for (const [label, img] of [['In the workshop', P.joinery.saw(800)], ['In your house', P.interiors.kitchen(800)]]) {
    const card = b.container(ba, { background: PANEL, padding: ['0', '0', '16', '0'], radius: 10 }, label);
    b.image(card, img, { alt: label, radius: 10, width: '100%', height: '300px' });
    b.badge(card, label, { background: WHITE, color: INK });
  }

  // ── what the quote is worth ─────────────────────────────────────
  const hold = b.container(root, { background: PAPER, padding: ['32', '48', '40', '48'], width: '100%' }, 'Hold');
  b.heading(hold, 'What you can hold me to', { fontSize: '30', color: INK });
  b.spacer(hold, '24');
  const holdCols = b.columns(hold, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Measured, not estimated', 'straighten', 'The tape decides the price. If a wall surprises us, the quote holds anyway.'],
    ['Built in our shop', 'carpenter', 'Cut and finished twenty minutes away, not flat-packed three seas away.'],
    ['Fixed for ten years', 'handshake', 'Hinges, runners and drawer bottoms, in writing. A squeak is my problem.'],
  ]) {
    const card = b.container(holdCols, { background: PANEL, padding: ['24', '22', '24', '22'], radius: 10 }, name);
    b.icon(card, symbol, { color: INK, background: AMBER });
    b.heading(card, name, { level: '3', fontSize: '18', color: INK, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  // ── how a job actually runs ─────────────────────────────────────
  const how = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'Process');
  b.heading(how, 'How a job runs', { fontSize: '30', color: INK });
  b.spacer(how, '24');
  b.timeline(how, [
    'Day 1', 'The measure', 'An hour at yours with a tape and a coffee. The written quote follows within two days.',
    'Week 2', 'The build', 'Cut and finished in the shop. Clients visit mid-build to see their kitchen in the raw.',
    'Week 6', 'The fit', 'Two or three days in the house. We vacuum every evening and take the old units away.',
  ], { accent: AMBER_INK, color: INK });

  const prices = b.container(root, { background: PAPER, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'prices' }, 'Prices');
  b.heading(prices, 'What things cost', { fontSize: '30', color: INK });
  b.text(prices, 'Rough guides. The quote is fixed once I have seen the room.', {
    fontSize: '15', color: MUTED, margin: ['8', '0', '20', '0'],
  });
  b.list(prices, [
    'Fitted wardrobe — from ₪6,000',
    'Kitchen refit — from ₪22,000',
    'Staircase repair — from ₪3,500',
    'Call-out and measure — free',
  ], { color: INK, fontSize: '16' });
  b.divider(prices, { color: rgba(28, 30, 30, 0.15), spacing: '24' });
  b.testimonial(prices, {
    quote: 'Turned up when he said, finished when he said, and cleaned up after himself. Twice now.',
    author: 'Miri Golan', role: 'Ramat Gan',
    background: PANEL, color: INK, accent: rgba(255, 255, 255, 0.8),
  });

  // ── the questions every kitchen conversation reaches ────────────
  const ask = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Before you ask', { fontSize: '30', color: INK });
  b.text(askIntro, 'The three things every kitchen conversation reaches, usually in the first ten minutes.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'Can we stay in the house while it happens?',
    'For wardrobes and stairs, yes — a day or two of dust sheets. For kitchens we work in halves, so the sink is only out for a day.',
    'How fixed is the fixed quote?',
    'Fixed. If the wall behind the units is worse than it looked, that is between me and the wall.',
    'Do you do the whole kitchen — plumbing, stone?',
    'The wood is mine. The stonemason and the electrician I have worked beside for a decade bill through the same quote.',
  ], { background: PAPER, color: INK, radius: 10 });

  // ── the form everything above was for ───────────────────────────
  const quote = b.container(root, { background: PAPER, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'quote' }, 'Quote');
  const quoteSplit = b.columns(quote, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const quoteCopy = b.container(quoteSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Quote copy');
  b.heading(quoteCopy, 'Tell me about the job', { fontSize: '30', color: INK });
  b.text(quoteCopy, 'A sentence is enough to start. The measure turns it into a number.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(quoteCopy, [
    'One sentence about the room is enough',
    'A photo helps, but the measure settles it',
    'Rough ideas welcome — that is what the visit is for',
  ], { color: MUTED, fontSize: '15' });
  b.form(quoteSplit, {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Phone', type: 'phone', placeholder: '05x', required: true },
      { label: 'What needs doing', type: 'textarea', placeholder: 'A sentence is enough' },
    ],
    submitText: 'Send', successMessage: 'Got it — I will call within a day.',
    accent: AMBER, background: PANEL,
  });

  const close = b.container(root, { background: PAPER, padding: ['24', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'The awkward rooms are the best ones',
    text: 'Odd corners, wonky walls, a staircase that has been wrong since 1962 — send one sentence about it.',
    cta: 'Get a quote', href: '#quote',
    background: AMBER, color: INK, buttonBackground: PAPER, buttonColor: INK,
  });

  b.modernSuite(root, { mode: 'service', background: PAPER, panel: PANEL, ink: INK, accent: AMBER_INK });
  b.footer(root, {
    brand: 'Northside Joinery',
    note: 'Kitchens, wardrobes and one-off pieces. Free quotes.',
    socials: ['Phone', 'tel:+97245000000', 'Email', 'mailto:work@northside.co'],
    background: INK, ink: PAPER, muted: PANEL,
  });

  return { name: 'Local Services — Northside Joinery', category: 'Business', thumb: P.joinery.fitting(600), map: b.map };
}
