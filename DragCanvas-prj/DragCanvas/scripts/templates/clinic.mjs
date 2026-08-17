import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/** Dental clinic — reassurance, then the practical facts, then the questions people are afraid to ask. */
export default function clinic() {
  const b = createBuilder();
  const MIST = rgba(247, 250, 251);
  const PANEL = rgba(232, 242, 245);
  const INK = rgba(23, 42, 48);
  const TEAL = rgba(20, 128, 138);
  const MUTED = rgba(94, 114, 120);

  const root = b.root({ background: MIST, width: '100%' });
  b.navbar(root, 'Meridian Dental', [
    { text: 'Treatments', href: '#treatments' },
    { text: 'The team', href: '#team' },
    { text: 'Questions', href: '#questions' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: MIST, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: P.clinic.surgery(1600), overlay: rgba(23, 42, 48, 0.62) }, 'Hero');
  const top = b.columns(hero, { count: '2', gap: '40', align: 'center' });
  const words = b.container(top, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Words');
  b.badge(words, 'Taking new patients', { background: PANEL, color: TEAL });
  b.heading(words, 'Dentistry without the dread', { level: '1', fontSize: '44', color: MIST, margin: ['12', '0', '10', '0'] });
  b.text(words, 'Same dentist every visit, prices agreed before anything starts, and no upselling.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82),
  });
  b.button(words, 'Book a check-up', { background: TEAL, color: WHITE, buttonStyle: 'full' });
  b.image(top, P.clinic.hygienist(900), { radius: 12, width: '100%', height: '400px' });

  // ── the practice in three numbers ──────────────────────────────
  const num = b.container(root, { background: MIST, padding: ['32', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['14', 'years on this street', '2,300', 'patients who come back', '₪250', 'a check-up, no surprises'], {
    accent: TEAL, color: MUTED,
  });

  const treat = b.container(root, { background: MIST, padding: ['40', '48', '48', '48'], width: '100%', anchor: 'treatments' }, 'Treatments');
  b.heading(treat, 'What we do', { fontSize: '32', color: INK });
  b.spacer(treat, '24');
  const cols = b.columns(treat, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Check-ups', 'health_and_safety', 'Twenty minutes, twice a year, and usually nothing to do.'],
    ['Hygiene', 'cleaning_services', 'A proper clean, and honest advice about the brushing.'],
    ['Repairs', 'build', 'Fillings, crowns and the rest, quoted before we start.'],
  ]) {
    const card = b.container(cols, { background: PANEL, padding: ['26', '24', '26', '24'], radius: 12 }, name);
    b.icon(card, symbol, { color: WHITE, background: TEAL });
    b.heading(card, name, { level: '3', fontSize: '19', color: INK, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  const team = b.container(root, { background: MIST, padding: ['32', '48', '48', '48'], width: '100%', anchor: 'team' }, 'Team');
  b.heading(team, 'Who you will see', { fontSize: '30', color: INK });
  b.spacer(team, '20');
  b.teamGrid(team, [
    'Dr Yael Shani', 'Dentist, 14 years', P.faces.grey(400),
    'Dr Amit Peled', 'Dentist, 9 years', P.faces.turtleneck(400),
    'Liat Rom', 'Hygienist', P.faces.white(400),
  ], { columns: '3', accent: PANEL, color: INK });

  // ── what it costs, in writing ──────────────────────────────────
  const cost = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', alignItems: 'center' }, 'Prices');
  b.heading(cost, 'The prices, on the website', { fontSize: '30', textAlign: 'center', color: INK });
  b.text(cost, 'Nobody should have to ask. Anything beyond these is quoted in writing before it starts.', {
    fontSize: '15', textAlign: 'center', color: MUTED, margin: ['10', '0', '24', '0'],
  });
  b.pricing(cost, [
    'Check-up', '₪250', 'twenty minutes', 'Book it', 'Examination; X-rays if needed; A written plan',
    'Hygiene', '₪180', 'per visit', 'Book it', 'Full clean; Brushing advice; Twice a year is enough',
    'Whitening', '₪900', 'one course', 'Ask us', 'Assessment first; Not for everyone; Results in writing',
  ], { featured: 1, accent: TEAL, background: MIST, color: INK });

  const said = b.container(root, { background: MIST, padding: ['48', '48', '48', '48'], width: '100%' }, 'Said');
  b.testimonial(said, {
    quote: 'I had not been to a dentist in six years. They did not lecture me once, and the plan was on paper before anything hurt.',
    author: 'Michal Arad', role: 'Patient since 2024',
    background: PANEL, color: INK, accent: TEAL,
  });

  const q = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'questions' }, 'Questions');
  b.heading(q, 'The things people do not like asking', { fontSize: '30', color: INK });
  b.spacer(q, '20');
  b.accordion(q, [
    'Will it hurt?',
    'A check-up will not. For anything else we numb it properly and wait until it has worked.',
    'What does it cost?',
    'A check-up is ₪250. Anything else is quoted in writing before we begin.',
    'I have not been in years.',
    'Most of our new patients say that. Come in for a look and we will make a plan.',
  ], { background: MIST, color: INK, radius: 12 });

  // ── booking, then the door ─────────────────────────────────────
  const book = b.container(root, { background: MIST, padding: ['48', '48', '48', '48'], width: '100%' }, 'Book');
  const bookSplit = b.columns(book, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const bookCopy = b.container(bookSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Book copy');
  b.heading(bookCopy, 'Book the first look', { fontSize: '30', color: INK });
  b.text(bookCopy, 'A first visit is a check-up and a conversation. Nothing happens in it that you did not agree to first.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(bookCopy, [
    'Bring your insurance card if you have one',
    'Mornings suit most people - say so and we will find one',
    'Nervous patients: tell us at booking, not in the chair',
  ], { color: MUTED, fontSize: '15' });
  b.form(bookSplit, {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Phone', type: 'tel', placeholder: 'Where to reach you', required: true },
      { label: 'When suits you', type: 'text', placeholder: 'e.g. weekday mornings' },
    ],
    submitText: 'Request a time', successMessage: 'Asked. We will ring you today with two slots.',
    background: PANEL, accent: TEAL, color: INK,
  });

  const find = b.container(root, { background: MIST, padding: ['16', '48', '64', '48'], width: '100%' }, 'Find');
  const findSplit = b.columns(find, { count: '2', gap: '36', ratio: '2:3', stack: 'yes' });
  const findCopy = b.container(findSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Find copy');
  b.heading(findCopy, 'Where we are', { fontSize: '26', color: INK });
  b.text(findCopy, 'Two floors above the pharmacy on Meridian Street. There is parking in the back, and the lift is on the right of the entrance.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  const findMap = b.container(findSplit, { background: TRANSPARENT, width: '100%' }, 'Find map');
  b.map_(findMap, { lat: 32.0853, lng: 34.7818, zoom: 15, label: 'Meridian Dental' });

  b.footer(root, {
    brand: 'Meridian Dental',
    note: 'Emergencies seen the same day. Most insurers accepted.',
    socials: ['Phone', 'tel:+97239000000', 'Email', 'mailto:clinic@meridian.co'],
    background: INK, ink: MIST, muted: PANEL,
  });

  return { name: 'Dental Clinic — Meridian', category: 'Business', thumb: P.clinic.chair(600), map: b.map };
}
