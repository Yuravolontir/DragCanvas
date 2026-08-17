import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

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

  const hero = b.container(root, { background: NAVY, padding: ['72', '48', '48', '48'], width: '100%', alignItems: 'center' }, 'Hero');
  b.badge(hero, 'Haifa · 12–13 November', { background: GOLD, color: NAVY });
  b.heading(hero, 'Two days on how software feels', {
    level: '1', fontSize: '50', textAlign: 'center', color: BONE, margin: ['16', '0', '12', '0'],
  });
  b.text(hero, 'Fourteen talks on interface, craft, and the people who ship it.', {
    fontSize: '18', textAlign: 'center', color: MUTED, margin: ['0', '0', '24', '0'],
  });
  b.button(hero, 'Get a ticket', { background: GOLD, color: NAVY, buttonStyle: 'full' });

  const prog = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'programme' }, 'Programme');
  b.heading(prog, 'Day one', { fontSize: '32', color: BONE });
  b.spacer(prog, '24');
  b.timeline(prog, [
    '09:30', 'What we mean by craft', 'Opening, and an argument worth having.',
    '11:00', 'Designing for the second glance', 'The interface people use after the demo.',
    '14:00', 'Shipping without a design team', 'How small teams keep it coherent anyway.',
    '16:30', 'The long tail of a decision', 'What a default costs three years later.',
  ], { accent: GOLD, color: BONE });

  const speak = b.container(root, { background: NAVY, padding: ['56', '48', '48', '48'], width: '100%', anchor: 'speakers' }, 'Speakers');
  b.heading(speak, 'Who is talking', { fontSize: '32', color: BONE });
  b.spacer(speak, '24');
  b.teamGrid(speak, [
    'Noa Bar', 'Interface, Monday', px(29057425, 400),
    'Ilan Weiss', 'Systems, Kettle', px(37233404, 400),
    'Dana Levi', 'Craft, independent', px(16666883, 400),
    'Omer Katz', 'Research, Fathom', px(9275222, 400),
  ], { columns: '4', accent: PANEL, color: BONE });

  b.spacer(root, '8');
  const num = b.container(root, { background: NAVY, padding: ['0', '48', '48', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['14', 'talks', '2', 'days', '300', 'seats'], { accent: GOLD, color: MUTED });

  const tick = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'tickets', alignItems: 'center' }, 'Tickets');
  b.heading(tick, 'Tickets', { fontSize: '32', textAlign: 'center', color: BONE });
  b.spacer(tick, '24');
  b.pricing(tick, [
    'Early', '₪240', 'until August', 'Buy early', 'Both days; Lunch; Recordings',
    'Standard', '₪380', 'from September', 'Buy standard', 'Both days; Lunch; Recordings',
    'Student', '₪90', 'with an ID', 'Buy student', 'Both days; Bring the ID on the door',
  ], { featured: 1, accent: GOLD, background: NAVY, color: BONE });

  const find = b.container(root, { background: NAVY, padding: ['48', '48', '64', '48'], width: '100%' }, 'Venue');
  b.heading(find, 'The venue', { fontSize: '26', color: BONE });
  b.spacer(find, '16');
  b.map_(find, { lat: 32.7940, lng: 34.9896, zoom: 14, label: 'Haifa' });

  return { name: 'Conference — Interface 26', category: 'Event', thumb: px(9275222), map: b.map };
}
