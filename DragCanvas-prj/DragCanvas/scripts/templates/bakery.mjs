import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

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

  const hero = b.container(root, { background: CREAM, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: P.bakery.shelves(1600), overlay: rgba(42, 29, 19, 0.55) }, 'Hero');
  // Words get the room, the photograph gets the rest. Two equal halves was
  // never a decision, it was the only thing Columns could do.
  const top = b.columns(hero, { count: '2', gap: '40', align: 'center', ratio: '3:2' });
  const words = b.container(top, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Words');
  b.heading(words, 'Out of the oven at six', { level: '1', fontSize: '48', color: CREAM });
  b.text(words, 'Sourdough, challah and rye, baked overnight and sold until they are gone.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82), margin: ['12', '0', '20', '0'],
  });
  b.button(words, 'Order for tomorrow', { background: TERRA, color: WHITE, buttonStyle: 'full' });
  b.image(top, P.bakery.loaves(900), { radius: 6, width: '100%', height: '420px' });

  const night = b.container(root, { background: INK, padding: ['36', '48', '36', '48'], width: '100%' }, 'Overnight');
  b.stats(night, ['340', 'loaves before six', '3', 'bakers on the night shift', '2 days', 'for a sourdough'], {
    accent: rgba(232, 176, 116), color: rgba(255, 255, 255, 0.72),
  });

  const bread = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'bread' }, 'Bread');
  b.heading(bread, 'What we bake', { fontSize: '32', color: INK });
  b.spacer(bread, '24');
  const cols = b.columns(bread, { count: '3', gap: '20' });
  for (const [name, note, img] of [
    ['Sourdough', 'Two days of fermentation, baked dark.', P.bakery.assorted(600)],
    ['Croissants', 'Laminated over three days. Out at seven, gone by nine.', P.bakery.croissant(600)],
    ['Baguettes', 'Baked through the morning, so there is always a warm one.', P.bakery.trays(600)],
  ]) {
    const card = b.container(cols, { background: CREAM, padding: ['0', '0', '20', '0'], radius: 8 }, name);
    b.image(card, img, { radius: 8, width: '100%', height: '240px' });
    b.heading(card, name, { level: '3', fontSize: '19', color: INK, margin: ['16', '18', '6', '18'] });
    b.text(card, note, { fontSize: '15', color: MUTED, margin: ['0', '18', '0', '18'] });
  }

  const order = b.container(root, { background: CREAM, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'order' }, 'Ordering');
  const ordering = b.columns(order, { count: '2', gap: '48', ratio: '2:3' });

  const how = b.container(ordering, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'How it works');
  b.heading(how, 'Ordering ahead', { fontSize: '28', color: INK });
  b.spacer(how, '18');
  for (const [symbol, title, detail] of [
    ['schedule', 'By Thursday noon', 'Anything for the weekend is mixed on Thursday night.'],
    ['local_shipping', 'Collection only', 'We do not deliver. The bread is better if it does not travel.'],
    ['payments', 'Pay when you collect', 'No deposit, but tell us if plans change.'],
  ]) {
    const row = b.container(how, { background: TRANSPARENT, padding: ['0', '0', '18', '0'], flexDirection: 'row', alignItems: 'flex-start' }, title);
    b.icon(row, symbol, { size: '22', color: TERRA, background: PANEL });
    const words2 = b.container(row, { background: TRANSPARENT, padding: ['0', '0', '0', '14'] }, title + ' text');
    b.heading(words2, title, { level: '3', fontSize: '17', color: INK });
    b.text(words2, detail, { fontSize: '15', color: MUTED, margin: ['4', '0', '0', '0'] });
  }

  const asked = b.container(ordering, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Questions');
  b.heading(asked, 'What people ask', { fontSize: '28', color: INK });
  b.spacer(asked, '18');
  b.accordion(asked, [
    'Do you bake gluten free?', 'No. One oven, one bench, too much flour in the air to promise it.',
    'Can I order a whole batch?', 'Yes, for collection. Tell us two days ahead and we will put it aside.',
    'Do you supply restaurants?', 'Three, and we are not looking for a fourth this year.',
  ], { background: PANEL, color: INK });

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

  b.ctaBanner(root, {
    title: 'Bread for Saturday?',
    text: 'Tell us by Thursday and it will be waiting, warm, at six.',
    cta: 'Order for tomorrow', href: '#order',
    background: TERRA, color: WHITE, buttonBackground: CREAM, buttonColor: INK, radius: 0,
  });

  b.footer(root, {
    brand: 'Lehem',
    note: 'Yehuda Halevi 21, Tel Aviv. Baked daily except Sunday.',
    socials: ['Instagram', 'https://instagram.com/', 'Phone', 'tel:+97236000000'],
    background: INK, ink: CREAM, muted: PANEL,
  });

  return { name: 'Bakery — Lehem', category: 'Business', thumb: P.bakery.counter(600), map: b.map };
}
