import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/**
 * Creative Portfolio — Mara Kim (replaces template 13)
 *
 * The work is the content, so the page stays near-black with one accent. What
 * copy there is explains how the work gets made — proofs, press, handover.
 */
export default function portfolio() {
  const b = createBuilder();
  const INK = rgba(13, 13, 15);
  const PANEL = rgba(22, 22, 25);
  const BONE = rgba(242, 240, 238);
  const GOLD = rgba(228, 200, 138);
  const MUTED = rgba(139, 138, 144);

  const root = b.root({ background: INK, width: '100%' });

  b.navbar(root, 'MARA KIM', [
    { text: 'Work', href: '#work' },
    { text: 'About', href: '#about' },
    { text: 'Contact', href: '#contact' },
  ], { variant: 'dark' });

  const hero = b.container(root, { background: INK, padding: ['96', '48', '48', '48'], width: '100%', backgroundImage: P.agency.suite(1600), overlay: rgba(13, 13, 15, 0.62) }, 'Hero');
  b.badge(hero, 'Booking for spring', { background: PANEL, color: GOLD });
  b.heading(hero, 'Art direction, mostly', { level: '1', fontSize: '58', fontWeight: '700', color: BONE, margin: ['16', '0', '12', '0'] });
  b.text(hero, 'Identity, packaging and editorial design for people who make things.', {
    fontSize: '18', color: rgba(255, 255, 255, 0.82), margin: ['0', '0', '20', '0'],
  });
  b.logoStrip(hero, ['Kettle', 'Fathom', 'Sable', 'Monday', 'Northwind'], { height: '24', color: rgba(255, 255, 255, 0.55) });

  // ── the practice in three numbers ───────────────────────────────
  const num = b.container(root, { background: INK, padding: ['32', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['10', 'years, mostly on press', '60+', 'marks out in the world', '24h', 'to a first printed proof'], {
    accent: GOLD, color: MUTED,
  });

  const work = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%', anchor: 'work' }, 'Work');
  const grid = b.columns(work, { count: '2', gap: '20' });
  for (const shot of [P.agency.sketches, P.agency.facade, P.agency.studio, P.photography.editorial]) {
    b.image(grid, shot(900), { radius: 0, width: '100%', height: '340px' });
  }

  // ── how the work gets made ──────────────────────────────────────
  const how = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%' }, 'How');
  b.heading(how, 'How the work gets made', { fontSize: '30', color: BONE });
  b.spacer(how, '24');
  const howCols = b.columns(how, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Proofs before slides', 'print', 'The first presentation is printed at final size, on the real stock. Slides flatten everything.'],
    ['Press-checked in person', 'visibility', 'If it runs on a press, I stand at the press. Colour is decided there, not on a screen.'],
    ['Everything handed over', 'inventory_2', 'Files, fonts and the rules, in a folder your next designer can open without calling me.'],
  ]) {
    const card = b.container(howCols, { background: PANEL, padding: ['24', '22', '24', '22'], radius: 0 }, name);
    b.icon(card, symbol, { color: INK, background: GOLD });
    b.heading(card, name, { level: '3', fontSize: '18', color: BONE, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  const process = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'Process');
  b.heading(process, 'How a project runs', { fontSize: '30', color: BONE });
  b.spacer(process, '24');
  b.timeline(process, [
    'Day 1', 'The shelf', 'We walk the aisle your product will sit in. The brief comes from that walk, not a document.',
    'Week 2', 'Printed directions', 'Two directions, printed at size on the real stock. Picked with hands, not clicks.',
    'Week 5', 'At the press', 'A press check with the printer, and the colour signed off on the sheet itself.',
  ], { accent: GOLD, color: BONE });

  const said = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%' }, 'Said');
  b.quote(said, 'She gave us a mark we could print at ten millimetres and still recognise across a room.',
    { attribution: 'Kettle, on the rebrand', fontSize: '24', color: BONE, accent: GOLD });

  const about = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'about' }, 'About');
  const split = b.columns(about, { count: '2', gap: '40' });
  const left = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Bio');
  b.heading(left, 'Ten years, mostly on press', { fontSize: '30', color: BONE });
  b.text(left, 'Trained as a printer, which is why the proofs come before the presentation. Based in Tel Aviv, works wherever the files are.', {
    fontSize: '16', color: MUTED, margin: ['14', '0', '0', '0'],
  });
  const right = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Services');
  b.heading(right, 'What I take on', { fontSize: '30', color: BONE });
  b.list(right, ['Identity — mark, type and the rules for both', 'Packaging — artwork through to press', 'Editorial — layout and art direction'], {
    color: MUTED, fontSize: '16', gap: '12',
  });

  // ── the smallest unit is a day ──────────────────────────────────
  const rates = b.container(root, { background: INK, padding: ['48', '48', '48', '48'], width: '100%', alignItems: 'center' }, 'Rates');
  b.heading(rates, 'Rates', { fontSize: '30', textAlign: 'center', color: BONE });
  b.text(rates, 'A day is the smallest unit — enough for a poster, a label, or rescuing a mark that shrinks badly.', {
    fontSize: '15', textAlign: 'center', color: MUTED, margin: ['10', '0', '24', '0'],
  });
  b.pricing(rates, [
    'A day', '₪1,800', 'per day', 'Book a day', 'One problem; On site or remote; Files the same week',
    'A mark', 'from ₪24k', 'four weeks', 'Start a mark', 'The full identity; Print rules; The handover folder',
    'Days kept', '₪6,500', 'four a month', 'Hold days', 'Priority; Proof speed kept; Pause any month',
  ], { featured: 1, accent: GOLD, background: PANEL, color: BONE });

  // ── the questions that arrive by email ──────────────────────────
  const ask = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Asked by email, mostly', { fontSize: '30', color: BONE });
  b.text(askIntro, 'The three questions in every first approach.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'Do you take on small jobs?',
    'A day is the smallest unit, and it is genuinely enough for some things. Write and we will both find out.',
    'Who owns the work when it is done?',
    'You do, on final payment — files, fonts and rules. I keep only the right to photograph the printed thing.',
    'Do you travel for press checks?',
    'Within the country, always, included. Abroad, happily, at cost — the press is where colour is decided.',
  ], { background: INK, color: BONE, radius: 0 });

  const contact = b.container(root, { background: INK, padding: ['48', '48', '32', '48'], width: '100%', anchor: 'contact' }, 'Contact');
  const contactSplit = b.columns(contact, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const contactCopy = b.container(contactSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Contact copy');
  b.heading(contactCopy, 'Get in touch', { fontSize: '30', color: BONE });
  b.text(contactCopy, 'A sentence about the thing is enough to start. Replies go out the same day.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(contactCopy, [
    'A sentence about the thing',
    'A date, if there is one',
    'Where it will be printed — this changes the answer',
  ], { color: MUTED, fontSize: '15' });
  b.form(contactSplit, { submitText: 'Send', accent: GOLD, background: PANEL, color: BONE });
  b.spacer(contact, '24');
  b.socialLinks(contact, ['Instagram', 'https://instagram.com/', 'Behance', 'https://behance.net/'], {
    background: rgba(255, 255, 255, 0.08), color: BONE,
  });

  const close = b.container(root, { background: INK, padding: ['0', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Booking for spring',
    text: 'One proof, at size, on the real stock, before either of us commits to anything.',
    cta: 'Get in touch', href: '#contact',
    background: GOLD, color: INK, buttonBackground: INK, buttonColor: GOLD,
  });

  b.footer(root, {
    brand: 'Mara Kim',
    note: 'Art direction and design. Currently booking for spring.',
    socials: ['Instagram', 'https://instagram.com/', 'Behance', 'https://behance.net/'],
    background: PANEL, ink: BONE, muted: MUTED,
  });

  return { id: 13, name: 'Creative Portfolio — Mara Kim', category: 'Portfolio', thumb: P.agency.desk(600), map: b.map };
}
