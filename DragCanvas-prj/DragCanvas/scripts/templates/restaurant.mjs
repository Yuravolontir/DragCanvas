import { createBuilder, createCompanionPage, rgba, WHITE, TRANSPARENT, RADIUS, PAD, SHADOW } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';
import { clipFor } from '../../src/utils/stockVideo.js';

/**
 * Restaurant — Casa Oliva (replaces template 14)
 *
 * People come to a restaurant site for three facts: what is on, when it is open,
 * and where it is. The old version buried all three in prose. Here they are the
 * page: a menu in columns, hours as a list, and a map.
 */
export default function restaurant() {
  const b = createBuilder();
  const CREAM = rgba(251, 243, 233);
  const PANEL = rgba(243, 230, 211);
  const INK = rgba(42, 29, 19);
  const TERRA = rgba(164, 74, 34);
  const MUTED = rgba(109, 90, 69);

  const root = b.root({ background: CREAM, width: '100%' });

  const nav = [
    { text: 'Home', href: '/' },
    { text: 'Menu', href: '/menu/' },
  ];
  b.navbar(root, 'Casa Oliva', nav, { variant: 'light', textColor: INK });

  // A kitchen at service is the argument for the restaurant. The plated dish
  // stays on the right: the footage is the room, the photograph is the food,
  // and neither one says what the other does.
  const hero = b.backgroundVideo(root, {
    src: clipFor('food').url,
    poster: P.restaurant.room(1600),
    overlay: 60,
    minHeight: '560px',
  }, 'Hero');
  const heroInner = b.container(hero, { background: TRANSPARENT, padding: ['64', '48', '48', '48'], width: '100%' }, 'Hero content');
  const top = b.columns(heroInner, { count: '2', gap: '40', align: 'center' });
  const words = b.container(top, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Words');
  b.badge(words, 'Open for dinner', { background: PANEL, color: TERRA });
  b.heading(words, 'Slow food, small room', { level: '1', fontSize: '46', color: CREAM, margin: ['12', '0', '10', '0'] });
  b.text(words, 'Twenty-four covers, one sitting a night, and whatever the market had that morning.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82),
  });
  b.button(words, 'Book a table', { background: TERRA, color: WHITE, buttonStyle: 'full' });
  b.image(top, P.restaurant.tasting(900), { alt: 'Seasonal tasting menu plated in the restaurant kitchen', radius: RADIUS.chip, width: '100%', height: '420px' });

  // ── the room in three numbers ──────────────────────────────────
  const num = b.container(root, { background: CREAM, padding: ['40', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['24', 'covers, no more', '1', 'sitting, at seven', '5pm', 'the market closes, we start'], {
    accent: TERRA, color: MUTED,
  });

  // ── what the kitchen holds to ──────────────────────────────────
  const hold = b.container(root, { background: CREAM, padding: ['32', '48', '40', '48'], width: '100%' }, 'Hold');
  const holdCols = b.columns(hold, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Bought that morning', 'storefront', 'The menu is written after the market, not before it.'],
    ['Cooked over wood', 'local_fire_department', 'One oven, one fire, and nothing that needs a timer.'],
    ['Served when ready', 'schedule', 'Plates arrive when they should, in the order the kitchen can do them best.'],
  ]) {
    const card = b.container(holdCols, { background: PANEL, padding: ['22', '20', '22', '20'], shadow: SHADOW.lifted, radius: RADIUS.card }, name);
    b.icon(card, symbol, { color: PANEL, background: TERRA });
    b.heading(card, name, { level: '3', fontSize: '17', color: INK, margin: ['12', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '14', color: MUTED });
  }

  const menu = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'menu' }, 'Menu');
  b.heading(menu, 'This week', { fontSize: '32', color: INK });
  b.spacer(menu, '24');
  const dishes = b.columns(menu, { count: '3', gap: '24' });
  for (const [course, items] of [
    ['To start', ['Bread, oil, salt', 'Anchovy and butter', 'Tomato, done simply']],
    ['Mains', ['Lamb, slowly', 'Sea bream, whole', 'Aubergine, smoked']],
    ['After', ['Olive oil cake', 'Figs and cream', 'Coffee and something']],
  ]) {
    const col = b.container(dishes, { background: CREAM, padding: ['24', '22', '24', '22'], radius: RADIUS.chip }, course);
    b.heading(col, course, { level: '3', fontSize: '18', color: TERRA });
    b.list(col, items, { color: MUTED, fontSize: '15', gap: '10' });
  }

  const hours = b.container(root, { background: CREAM, padding: ['56', '48', '32', '48'], width: '100%', anchor: 'hours' }, 'Hours');
  const hcols = b.columns(hours, { count: '2', gap: '40' });
  const hleft = b.container(hcols, { background: CREAM, padding: ['0', '0', '0', '0'] }, 'When');
  b.heading(hleft, 'When we are open', { fontSize: '28', color: INK });
  b.list(hleft, ['Tuesday to Saturday, 18:00', 'One sitting, seven o’clock', 'Closed Sunday and Monday'], {
    color: MUTED, fontSize: '16',
  });
  const hright = b.container(hcols, { background: CREAM, padding: ['0', '0', '0', '0'] }, 'Said');
  b.testimonial(hright, {
    quote: 'The menu is short because everything on it is worth eating.',
    author: 'Ronit Adler', role: 'Time Out Tel Aviv',
    background: PANEL, color: INK, accent: rgba(255, 255, 255, 0.6),
  });

  // ── how a night runs, then the booking questions ───────────────
  const night = b.container(root, { background: PANEL, padding: ['32', '48', '32', '48'], width: '100%' }, 'A night');
  b.heading(night, 'How a night runs', { fontSize: '28', color: INK });
  b.spacer(night, '20');
  b.timeline(night, [
    '18:00', 'The door opens', 'Aperitivo at the counter while the oven settles.',
    '19:00', 'Everyone sits', 'One sitting, nine dishes, explained before they start.',
    '21:30', 'The long end', 'Kitchen closes, the room decides when the night ends.',
  ], { accent: TERRA, color: INK });

  const ask = b.container(root, { background: PANEL, padding: ['24', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Before you book', { fontSize: '28', color: INK });
  b.text(askIntro, 'A small room raises small questions. Here are the ones we get on the phone.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'Can you cook around an allergy?',
    'Yes, if you tell us two days ahead. The menu is short enough to bend around one table.',
    'We are six. Is that possible?',
    'The room does it once a night. Book early and take the long table by the window.',
    'How long does the evening take?',
    'About three hours. This is not a place to eat before somewhere else.',
  ], { background: CREAM, color: INK, radius: RADIUS.chip });

  const find = b.container(root, { background: CREAM, padding: PAD.regular, width: '100%', anchor: 'find-us' }, 'Find us');
  const findSplit = b.columns(find, { count: '2', gap: '36', ratio: '2:3', stack: 'yes' });
  const findCopy = b.container(findSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Find copy');
  b.heading(findCopy, 'Yehuda Halevi 21', { fontSize: '28', color: INK });
  b.text(findCopy, 'Between the tailor and the bicycle shop. Look for the olive tree in the yard - the door is under it.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  const findMap = b.container(findSplit, { background: TRANSPARENT, width: '100%' }, 'Find map');
  b.map_(findMap, { lat: 32.0629, lng: 34.7745, zoom: 15, label: 'Casa Oliva' });

  const close = b.container(root, { background: CREAM, padding: ['24', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'The table is small on purpose',
    text: 'Twenty-four covers, one sitting, booked about a week out. Ring, or walk past and look at the tree.',
    cta: 'Book a table', href: 'tel:+97235000000',
    background: TERRA, color: WHITE, buttonBackground: CREAM, buttonColor: INK,
  });

  b.modernSuite(root, { mode: 'service', background: CREAM, panel: PANEL, ink: INK, accent: TERRA });
  b.footer(root, {
    brand: 'Casa Oliva',
    note: 'Dinner Tuesday to Saturday. Booking advised.',
    socials: ['Instagram', 'https://instagram.com/', 'Phone', 'tel:+97235000000'],
    background: INK, ink: CREAM, muted: PANEL,
  });

  const menuPage = createCompanionPage({
    brand: 'Casa Oliva', nav, background: CREAM, panel: PANEL, ink: INK, accent: TERRA, muted: MUTED,
    video: clipFor('food').url, poster: P.restaurant.tasting(1600),
    eyebrow: 'THIS WEEK', title: 'The menu follows the market',
    intro: 'Five courses, one sitting and a few decisions made only after the morning delivery.',
    cards: [
      ['From the market', 'local_florist', 'Vegetables and herbs bought that morning, while they still decide the menu.'],
      ['From the fire', 'outdoor_grill', 'One course cooked over olive wood and served as soon as it is ready.'],
      ['From the cellar', 'wine_bar', 'Small regional bottles chosen to sit quietly beside the food.'],
    ],
    listTitle: 'A typical evening',
    listItems: ['Warm bread, cultured butter and bitter leaves', 'Charred courgette with almond and lemon', 'Market fish, white beans and fennel', 'Stone fruit with olive oil cake'],
    quote: 'The kind of dinner that feels generous without ever feeling busy.', author: 'Leah Stern, The Table',
    faq: ['Can you accommodate allergies?', 'Yes, with forty-eight hours’ notice. The room is too small to improvise safely during service.', 'Is there a vegetarian menu?', 'Always. It follows the same five-course shape.'],
    ctaTitle: 'One table is still a table', ctaText: 'Tell us the date and how many are coming.', ctaLabel: 'Call to reserve', ctaHref: '/',
    footerNote: 'Dinner Tuesday to Saturday. One sitting at seven.',
  });
  return {
    id: 14, name: 'Restaurant — Casa Oliva', category: 'Business', thumb: P.restaurant.pasta(600),
    pages: [
      { name: 'Home', slug: 'home', map: b.map },
      { name: 'Menu', slug: 'menu', map: menuPage },
    ],
  };
}
