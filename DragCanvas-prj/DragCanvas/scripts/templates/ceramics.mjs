import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

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

  const hero = b.container(root, { background: SAND, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: P.ceramics.studio(1600), overlay: rgba(58, 53, 44, 0.5) }, 'Hero');
  b.badge(hero, 'Batch 34 out of the kiln', { background: PANEL, color: MOSS });
  b.heading(hero, 'Made slowly, by two people', { level: '1', fontSize: '46', color: SAND, margin: ['14', '0', '10', '0'] });
  b.text(hero, 'Tableware thrown and glazed in a small studio. Every batch is a little different, which is rather the point.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82), margin: ['0', '0', '24', '0'],
  });
  b.button(hero, 'Shop the batch', { background: MOSS, color: WHITE, buttonStyle: 'full' });

  // ── the studio in three numbers ─────────────────────────────────
  const num = b.container(root, { background: SAND, padding: ['32', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['2', 'potters, one kiln', '1,240°', 'twice-fired stoneware', '9', 'pieces in a batch'], {
    accent: MOSS, color: MUTED,
  });

  const shop = b.container(root, { background: SAND, padding: ['32', '48', '48', '48'], width: '100%', anchor: 'shop' }, 'Shop');
  const grid = b.columns(shop, { count: '3', gap: '20' });
  for (const [name, price, img] of [
    ['Bowls', 'From ₪90', P.ceramics.stacks(700)],
    ['Mugs', 'From ₪70', P.ceramics.bowls(700)],
    ['Plates', 'From ₪110', P.ceramics.tools(700)],
  ]) {
    const card = b.container(grid, { background: PANEL, padding: ['0', '0', '18', '0'], radius: 18 }, name);
    b.image(card, img, { alt: `Handmade ceramic ${name.toLowerCase()}`, radius: 18, width: '100%', height: '280px' });
    b.heading(card, name, { level: '3', fontSize: '18', color: INK, margin: ['14', '18', '4', '18'] });
    b.text(card, price, { fontSize: '15', color: MOSS, margin: ['0', '18', '0', '18'] });
  }

  // ── why the pots survive daily use ──────────────────────────────
  const why = b.container(root, { background: SAND, padding: ['32', '48', '48', '48'], width: '100%' }, 'Why');
  b.heading(why, 'Made to be used, not admired', { fontSize: '30', color: INK });
  b.spacer(why, '24');
  const whyCols = b.columns(why, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Twice-fired', 'local_fire_department', 'Stoneware fired to 1,240°C. It survives daily use and the occasional knock.'],
    ['Glazes mixed here', 'science', 'Every colour weighed and mixed in the studio. Batches differ slightly, on purpose.'],
    ['Posted carefully', 'local_shipping', 'Double-boxed in shredded paper. Broken in the post means we make another.'],
  ]) {
    const card = b.container(whyCols, { background: PANEL, padding: ['24', '22', '24', '22'], radius: 14 }, name);
    b.icon(card, symbol, { color: PANEL, background: MOSS });
    b.heading(card, name, { level: '3', fontSize: '18', color: INK, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  const shops = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'workshops' }, 'Workshops');
  b.heading(shops, 'Saturdays at the wheel', { fontSize: '30', color: INK });
  b.spacer(shops, '20');
  b.timeline(shops, [
    '10:00', 'Centring', 'The hard part, and the only one that cannot be rushed.',
    '11:30', 'Throwing', 'Two hours, three attempts, one bowl worth keeping.',
    '14:00', 'Glazing', 'Pick a colour. We fire it and post it to you.',
  ], { accent: MOSS, color: INK });

  const about = b.container(root, { background: SAND, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'about' }, 'About');
  const split = b.columns(about, { count: '2', gap: '40' });
  const who = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Who');
  b.heading(who, 'The studio', { fontSize: '26', color: INK });
  b.text(who, 'Two potters, one kiln, and a shop open two days a week. We do not do wholesale and we do not do rush jobs.', {
    fontSize: '16', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.divider(who, { color: rgba(58, 53, 44, 0.15), spacing: '20' });
  b.socialLinks(who, ['Instagram', 'https://instagram.com/', 'Email', 'mailto:hello@clay.co'], { color: INK });
  const q = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Quote');
  b.quote(q, 'The mug I bought four years ago is the one I still reach for.', {
    attribution: 'A customer', fontSize: '20', color: INK, accent: MOSS,
  });

  // ── what a Saturday costs ───────────────────────────────────────
  const prices = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', alignItems: 'center' }, 'Prices');
  b.heading(prices, 'The wheels, priced', { fontSize: '30', textAlign: 'center', color: INK });
  b.text(prices, 'Clay, firing and the posted bowl are in every price.', {
    fontSize: '15', textAlign: 'center', color: MUTED, margin: ['10', '0', '24', '0'],
  });
  b.pricing(prices, [
    'Taster', '₪180', 'one Saturday', 'Book a wheel', 'Three hours; All clay included; Your bowl posted',
    'Bring a friend', '₪320', 'two wheels', 'Book two', 'Side by side; Same three hours; Two bowls posted',
    'Six weeks', '₪900', 'the course', 'Book the course', 'One morning a week; Mix your own glaze; A set you designed',
  ], { featured: 2, accent: MOSS, background: SAND, color: INK });

  // ── the questions the shop counter gets ─────────────────────────
  const ask = b.container(root, { background: SAND, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Asked at the counter', { fontSize: '30', color: INK });
  b.text(askIntro, 'The three things everyone asks before their first Saturday.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'I have never touched clay. Can I still come?',
    'The taster is built for exactly that. Most people centre nothing on the first try and leave happy anyway.',
    'Is it safe in the oven and the dishwasher?',
    'Dishwasher, yes. For the oven, warm the pot with the food — stoneware forgives thermal shock no more than once.',
    'Do you ship abroad?',
    'Nationwide, double-boxed, always. Abroad, write to us — the kiln makes no promises to customs.',
  ], { background: PANEL, color: INK, radius: 14 });

  // ── book a wheel ────────────────────────────────────────────────
  const book = b.container(root, { background: SAND, padding: ['48', '48', '48', '48'], width: '100%' }, 'Book');
  const bookSplit = b.columns(book, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const bookCopy = b.container(bookSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Book copy');
  b.heading(bookCopy, 'Book a wheel', { fontSize: '30', color: INK });
  b.text(bookCopy, 'Six wheels, so six people, so it is worth writing ahead.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(bookCopy, [
    'Saturdays, 10:00 to 14:00',
    'Wear nothing you love',
    'Your bowl is posted about three weeks later',
  ], { color: MUTED, fontSize: '15' });
  b.form(bookSplit, {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
      { label: 'Which Saturday', type: 'text', placeholder: 'e.g. the 14th' },
    ],
    submitText: 'Hold a wheel', successMessage: 'Held. We will confirm the Saturday by email.',
    background: PANEL, accent: MOSS, color: INK,
  });

  const close = b.container(root, { background: SAND, padding: ['24', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'A batch is nine pieces',
    text: 'When it is gone, it is gone — the next one comes out of the kiln slightly different, on purpose.',
    cta: 'Shop the batch', href: '#shop',
    background: MOSS, color: WHITE, buttonBackground: SAND, buttonColor: INK,
  });

  b.modernSuite(root, { mode: 'commerce', background: SAND, panel: PANEL, ink: INK, accent: MOSS, currency: 'ILS' });
  b.footer(root, {
    brand: 'Clay & Co',
    note: 'A small studio. Everything is thrown by hand.',
    socials: ['Instagram', 'https://instagram.com/', 'Email', 'mailto:hello@clay.co'],
    background: INK, ink: SAND, muted: PANEL,
  });

  return { name: 'Ceramics — Clay & Co', category: 'Business', thumb: P.ceramics.wheel(600), map: b.map };
}
