import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/** Conference — the date, the programme, and how to get a ticket. */
export default function conference() {
  const b = createBuilder();
  const NAVY = rgba(15, 27, 52);
  const PANEL = rgba(22, 38, 74);
  const BONE = rgba(238, 243, 251);
  const GOLD = rgba(255, 194, 71);
  const MUTED = rgba(147, 167, 200);

  const root = b.root({ background: NAVY, width: '100%' });
  b.navbar(root, 'Interface 26', [
    { text: 'Programme', href: '#programme' },
    { text: 'Speakers', href: '#speakers' },
    { text: 'Tickets', href: '#tickets' },
  ], { variant: 'dark', sticky: true });

  const hero = b.container(root, { background: NAVY, padding: ['72', '48', '48', '48'], width: '100%', alignItems: 'center', backgroundImage: P.conference.stage(1600), overlay: rgba(15, 27, 52, 0.72) }, 'Hero');
  b.badge(hero, 'Haifa · 12–13 November', { background: GOLD, color: NAVY });
  b.heading(hero, 'Two days on how software feels', {
    level: '1', fontSize: '50', textAlign: 'center', color: BONE, margin: ['16', '0', '12', '0'],
  });
  b.text(hero, 'Fourteen talks on interface, craft, and the people who ship it.', {
    fontSize: '18', textAlign: 'center', color: rgba(255, 255, 255, 0.82), margin: ['0', '0', '24', '0'],
  });
  b.button(hero, 'Get a ticket', { background: GOLD, color: NAVY, buttonStyle: 'full' });

  // ── three ways to spend the two days ───────────────────────────
  const ways = b.container(root, { background: NAVY, padding: ['56', '48', '48', '48'], width: '100%' }, 'Formats');
  b.heading(ways, 'Three rooms, three speeds', { fontSize: '32', color: BONE });
  b.spacer(ways, '24');
  const waysCols = b.columns(ways, { count: '3', gap: '20' });
  for (const [room, symbol, copy] of [
    ['Talks', 'campaign', 'Forty minutes and real questions after. No product pitches from the stage.'],
    ['Workshops', 'handyman', 'Ninety minutes, twenty seats, one concrete thing to take home.'],
    ['The hallway', 'forum', 'Coffee runs all day on purpose. Most collaborations here started in it.'],
  ]) {
    const card = b.container(waysCols, { background: PANEL, padding: ['24', '22', '24', '22'], radius: 12 }, room);
    b.icon(card, symbol, { color: NAVY, background: GOLD });
    b.heading(card, room, { level: '3', fontSize: '18', color: BONE, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  const prog = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'programme' }, 'Programme');
  b.heading(prog, 'Day one', { fontSize: '32', color: BONE });
  b.spacer(prog, '24');
  b.timeline(prog, [
    '09:30', 'What we mean by craft', 'Opening, and an argument worth having.',
    '11:00', 'Designing for the second glance', 'The interface people use after the demo.',
    '14:00', 'Shipping without a design team', 'How small teams keep it coherent anyway.',
    '16:30', 'The long tail of a decision', 'What a default costs three years later.',
  ], { accent: GOLD, color: BONE });
  b.spacer(prog, '28');
  b.carousel(prog, {
    width: '704px', height: '400px', accent: GOLD,
    src1: P.conference.panel(1200), heading1: 'Useful disagreement', label1: 'Panel', p1: 'Four practitioners compare what held up after launch.',
    src2: P.conference.crowd(1200), heading2: 'A room that participates', label2: 'Audience', p2: 'Questions are part of every session, not an afterthought.',
    src3: P.conference.talk(1200), heading3: 'Small-room sessions', label3: 'Workshop', p3: 'Concrete critique with enough time to finish the thought.',
  }, 'Conference moments');

  const speak = b.container(root, { background: NAVY, padding: ['56', '48', '48', '48'], width: '100%', anchor: 'speakers' }, 'Speakers');
  b.heading(speak, 'Who is talking', { fontSize: '32', color: BONE });
  b.spacer(speak, '24');
  b.teamGrid(speak, [
    'Noa Bar', 'Interface, Monday', P.faces.dark(400),
    'Ilan Weiss', 'Systems, Kettle', P.faces.beard(400),
    'Dana Levi', 'Craft, independent', P.faces.short(400),
    'Omer Katz', 'Research, Fathom', P.faces.navy(400),
  ], { columns: '4', accent: PANEL, color: BONE });

  b.spacer(root, '8');
  const num = b.container(root, { background: NAVY, padding: ['0', '48', '48', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['14', 'talks', '2', 'days', '300', 'seats'], { accent: GOLD, color: MUTED });

  const remember = b.container(root, { background: NAVY, padding: ['0', '48', '48', '48'], width: '100%' }, 'Last year');
  b.testimonial(remember, {
    quote: 'I came for one talk and left with two people I still review work with.',
    author: 'Talia Gross', role: 'Attendee, Interface 25',
    background: PANEL, color: BONE, accent: GOLD,
  });

  const tick = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'tickets', alignItems: 'center' }, 'Tickets');
  b.heading(tick, 'Tickets', { fontSize: '32', textAlign: 'center', color: BONE });
  b.spacer(tick, '24');
  b.pricing(tick, [
    'Early', '₪240', 'until August', 'Buy early', 'Both days; Lunch; Recordings',
    'Standard', '₪380', 'from September', 'Buy standard', 'Both days; Lunch; Recordings',
    'Student', '₪90', 'with an ID', 'Buy student', 'Both days; Bring the ID on the door',
  ], { featured: 1, accent: GOLD, background: NAVY, color: BONE });

  // ── practical questions, then how to find the room ─────────────
  const ask = b.container(root, { background: NAVY, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Before you book', { fontSize: '30', color: BONE });
  b.text(askIntro, 'What people email us about in October, answered here so you do not have to.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'Are the talks recorded?',
    'Yes. Every ticket holder gets the recordings by email within a week, workshops included.',
    'Can I get an invoice for my employer?',
    'Yes - tick the box at checkout and it arrives the same day, VAT broken out.',
    'What if I cannot come after all?',
    'Pass the ticket to a colleague any time, or ask for a refund up to two weeks before.',
  ], { background: PANEL, color: BONE, radius: 12 });

  const find = b.container(root, { background: NAVY, padding: ['16', '48', '64', '48'], width: '100%', anchor: 'venue' }, 'Venue');
  const venueSplit = b.columns(find, { count: '2', gap: '36', ratio: '2:3', stack: 'yes' });
  const venueCopy = b.container(venueSplit, {
    background: TRANSPARENT, width: '100%', justifyContent: 'center',
  }, 'Venue copy');
  b.heading(venueCopy, 'The venue', { fontSize: '26', color: BONE });
  b.text(venueCopy, 'The old customs house in the port. Twelve minutes on foot from the train, and the coffee is better than any conference deserves.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.link(venueCopy, 'View venue details', '#venue', { color: GOLD, fontSize: '15' });
  const venueMap = b.container(venueSplit, { background: TRANSPARENT, width: '100%' }, 'Venue map');
  b.map_(venueMap, { lat: 32.7940, lng: 34.9896, zoom: 14, label: 'Haifa' });

  b.footer(root, {
    brand: 'Interface 26',
    note: '12–13 November, Haifa Port. Tickets include both days.',
    socials: ['Twitter', 'https://twitter.com/', 'Email', 'mailto:hello@interface.events'],
    background: PANEL, ink: BONE, muted: MUTED,
  });

  return { name: 'Conference — Interface 26', category: 'Event', thumb: P.conference.hall(600), map: b.map };
}
