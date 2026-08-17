import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

/** Ceramics shop — a small studio selling what two people make by hand. */
export default function ceramics() {
  const b = createBuilder();
  const SAND = rgba(246, 242, 234);
  const PANEL = rgba(234, 226, 212);
  const INK = rgba(58, 53, 44);
  const MOSS = rgba(111, 127, 92);
  const MUTED = rgba(107, 99, 85);

  const root = b.root({ background: SAND, width: '100%' });
  b.navbar(root, 'Clay & Co', [
    { text: 'Shop', href: '#shop' },
    { text: 'Workshops', href: '#workshops' },
    { text: 'About', href: '#about' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: SAND, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: px(34004100, 1600), overlay: rgba(58, 53, 44, 0.5) }, 'Hero');
  b.heading(hero, 'Made slowly, by two people', { level: '1', fontSize: '46', color: INK });
  b.text(hero, 'Tableware thrown and glazed in a small studio. Every batch is a little different, which is rather the point.', {
    fontSize: '17', color: MUTED, margin: ['12', '0', '0', '0'],
  });

  const shop = b.container(root, { background: SAND, padding: ['24', '48', '48', '48'], width: '100%', anchor: 'shop' }, 'Shop');
  const grid = b.columns(shop, { count: '3', gap: '20' });
  for (const [name, price, img] of [
    ['Bowls', 'From ₪90', px(34004100, 700)],
    ['Mugs', 'From ₪70', px(8063833, 700)],
    ['Plates', 'From ₪110', px(6693557, 700)],
  ]) {
    const card = b.container(grid, { background: PANEL, padding: ['0', '0', '18', '0'], radius: 18 }, name);
    b.image(card, img, { radius: 18, width: '100%' });
    b.heading(card, name, { level: '3', fontSize: '18', color: INK, margin: ['14', '18', '4', '18'] });
    b.text(card, price, { fontSize: '15', color: MOSS, margin: ['0', '18', '0', '18'] });
  }

  const shops = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'workshops' }, 'Workshops');
  b.heading(shops, 'Saturdays at the wheel', { fontSize: '30', color: INK });
  b.spacer(shops, '20');
  b.timeline(shops, [
    '10:00', 'Centring', 'The hard part, and the only one that cannot be rushed.',
    '11:30', 'Throwing', 'Two hours, three attempts, one bowl worth keeping.',
    '14:00', 'Glazing', 'Pick a colour. We fire it and post it to you.',
  ], { accent: MOSS, color: INK });

  const about = b.container(root, { background: SAND, padding: ['48', '48', '64', '48'], width: '100%', anchor: 'about' }, 'About');
  const split = b.columns(about, { count: '2', gap: '40' });
  const who = b.container(split, { background: SAND, padding: ['0', '0', '0', '0'] }, 'Who');
  b.heading(who, 'The studio', { fontSize: '26', color: INK });
  b.text(who, 'Two potters, one kiln, and a shop open two days a week. We do not do wholesale and we do not do rush jobs.', {
    fontSize: '16', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.divider(who, { color: rgba(58, 53, 44, 0.15), spacing: '20' });
  b.socialLinks(who, ['Instagram', 'https://instagram.com/', 'Email', 'mailto:hello@clay.co'], { color: INK });
  const q = b.container(split, { background: SAND, padding: ['0', '0', '0', '0'] }, 'Quote');
  b.quote(q, 'The mug I bought four years ago is the one I still reach for.', {
    attribution: 'A customer', fontSize: '20', color: INK, accent: MOSS,
  });

  return { name: 'Ceramics — Clay & Co', category: 'Business', thumb: px(34004100), map: b.map };
}
