import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

/** Bakery — a neighbourhood shop. Warm, short, and mostly about when to come. */
export default function bakery() {
  const b = createBuilder();
  const CREAM = rgba(251, 243, 233);
  const PANEL = rgba(246, 226, 211);
  const INK = rgba(42, 29, 19);
  const TERRA = rgba(164, 74, 34);
  const MUTED = rgba(109, 90, 69);

  const root = b.root({ background: CREAM, width: '100%' });
  b.navbar(root, 'Lehem', [
    { text: 'Bread', href: '#bread' },
    { text: 'Hours', href: '#hours' },
    { text: 'Visit', href: '#visit' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: CREAM, padding: ['64', '48', '40', '48'], width: '100%' }, 'Hero');
  const top = b.columns(hero, { count: '2', gap: '40', align: 'center' });
  const words = b.container(top, { background: CREAM, padding: ['0', '0', '0', '0'] }, 'Words');
  b.heading(words, 'Out of the oven at six', { level: '1', fontSize: '48', color: INK });
  b.text(words, 'Sourdough, challah and rye, baked overnight and sold until they are gone.', {
    fontSize: '17', color: MUTED, margin: ['12', '0', '20', '0'],
  });
  b.button(words, 'Order for tomorrow', { background: TERRA, color: WHITE, buttonStyle: 'full' });
  b.image(top, { src: px(8633662, 900), radius: 6, width: '100%' });

  const bread = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'bread' }, 'Bread');
  b.heading(bread, 'What we bake', { fontSize: '32', color: INK });
  b.spacer(bread, '24');
  const cols = b.columns(bread, { count: '3', gap: '20' });
  for (const [name, note, img] of [
    ['Sourdough', 'Two days of fermentation, baked dark.', px(35993723, 600)],
    ['Challah', 'Fridays only, ordered by Thursday noon.', px(10202985, 600)],
    ['Rye', 'Dense, sour, keeps all week.', px(8633662, 600)],
  ]) {
    const card = b.container(cols, { background: CREAM, padding: ['0', '0', '20', '0'], radius: 8 }, name);
    b.image(card, { src: img, radius: 8, width: '100%' });
    b.heading(card, name, { level: '3', fontSize: '19', color: INK, margin: ['16', '18', '6', '18'] });
    b.text(card, note, { fontSize: '15', color: MUTED, margin: ['0', '18', '0', '18'] });
  }

  const hours = b.container(root, { background: CREAM, padding: ['48', '48', '24', '48'], width: '100%', anchor: 'hours' }, 'Hours');
  const split = b.columns(hours, { count: '2', gap: '40' });
  const when = b.container(split, { background: CREAM, padding: ['0', '0', '0', '0'] }, 'When');
  b.heading(when, 'When to come', { fontSize: '28', color: INK });
  b.list(when, ['Tuesday to Friday, 06:00 to sold out', 'Saturday, 06:00 to 13:00', 'Closed Sunday and Monday'], {
    color: MUTED, fontSize: '16',
  });
  b.divider(when, { color: rgba(42, 29, 19, 0.15), spacing: '20' });
  b.text(when, 'The queue is longest at eight. It moves quickly.', { fontSize: '15', color: MUTED });
  const said = b.container(split, { background: CREAM, padding: ['0', '0', '0', '0'] }, 'Said');
  b.testimonial(said, {
    quote: 'I have moved twice and still come back on Fridays.',
    author: 'Tal Amir', role: 'Regular since 2019',
    background: PANEL, color: INK, accent: WHITE,
  });

  const visit = b.container(root, { background: CREAM, padding: ['24', '48', '64', '48'], width: '100%', anchor: 'visit' }, 'Visit');
  b.heading(visit, 'Yehuda Halevi 21, Tel Aviv', { fontSize: '26', color: INK });
  b.spacer(visit, '16');
  b.map_(visit, { lat: 32.0629, lng: 34.7745, zoom: 15, label: 'Lehem' });

  return { name: 'Bakery — Lehem', category: 'Business', thumb: px(8633662), map: b.map };
}
