import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

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

  const hero = b.container(root, { background: MIST, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: px(3184291, 1600), overlay: rgba(23, 42, 48, 0.62) }, 'Hero');
  const top = b.columns(hero, { count: '2', gap: '40', align: 'center' });
  const words = b.container(top, { background: MIST, padding: ['0', '0', '0', '0'] }, 'Words');
  b.badge(words, 'Taking new patients', { background: PANEL, color: TEAL });
  b.heading(words, 'Dentistry without the dread', { level: '1', fontSize: '44', color: INK, margin: ['12', '0', '10', '0'] });
  b.text(words, 'Same dentist every visit, prices agreed before anything starts, and no upselling.', {
    fontSize: '17', color: MUTED,
  });
  b.button(words, 'Book a check-up', { background: TEAL, color: WHITE, buttonStyle: 'full' });
  b.image(top, px(3184291, 900), { radius: 12, width: '100%' });

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
    'Dr Yael Shani', 'Dentist, 14 years', px(29057425, 400),
    'Dr Amit Peled', 'Dentist, 9 years', px(37233404, 400),
    'Liat Rom', 'Hygienist', px(16666883, 400),
  ], { columns: '3', accent: PANEL, color: INK });

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

  const find = b.container(root, { background: MIST, padding: ['40', '48', '64', '48'], width: '100%' }, 'Find');
  b.heading(find, 'Where we are', { fontSize: '26', color: INK });
  b.spacer(find, '16');
  b.map_(find, { lat: 32.0853, lng: 34.7818, zoom: 15, label: 'Meridian Dental' });

  return { name: 'Dental Clinic — Meridian', category: 'Business', thumb: px(3184465), map: b.map };
}
