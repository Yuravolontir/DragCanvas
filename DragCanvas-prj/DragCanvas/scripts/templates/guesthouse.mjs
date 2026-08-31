import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';
import { clipFor } from '../../src/utils/stockVideo.js';

/**
 * Guesthouse — Fold House, the gallery's first template of more than one page.
 *
 * Everything else here is one long scroll, which is the right shape for a
 * landing page and the wrong shape for a business with four things to say. A
 * guesthouse has rooms to compare, a valley to describe and a booking to take,
 * and pushing all three down a single column is how the rooms end up below the
 * fold of the fold.
 *
 * The four pages are the point, so the parts that must not change between them
 * are built once and called on each: `chrome` puts the same navigation bar at
 * the top and the same footer at the bottom, in that order, which is also what
 * the editor's own page machinery looks for when it keeps pages in step.
 *
 * Links between pages are absolute — "/rooms/" — because a fragment only ever
 * reaches the page it is already on.
 */

const PAPER = rgba(250, 247, 242);
const PANEL = rgba(237, 231, 221);
const INK = rgba(38, 35, 31);
const PINE = rgba(47, 92, 78);
const MUTED = rgba(108, 100, 90);

const NAV = [
  { text: 'Home', href: '/' },
  { text: 'Rooms', href: '/rooms/' },
  { text: 'The valley', href: '/valley/' },
  { text: 'Stay', href: '/stay/' },
];

/** The bar at the top and the bar at the bottom, identical on every page. */
const chrome = (b, root) => {
  b.navbar(root, 'Fold House', NAV, { variant: 'light', textColor: INK, sticky: true });
  return () => b.footer(root, {
    brand: 'Fold House',
    note: 'Six rooms above the valley. Open March to November.',
    socials: ['Instagram', 'https://instagram.com/', 'Email', 'mailto:stay@foldhouse.example'],
    background: INK,
    ink: PAPER,
    muted: rgba(178, 170, 160),
  });
};

/* ------------------------------------------------------------------ *
 * Home — what the place is, in one screen and a little more
 * ------------------------------------------------------------------ */

function home() {
  const b = createBuilder();
  const root = b.root({ background: PAPER, width: '100%' });
  const footer = chrome(b, root);

  const hero = b.backgroundVideo(root, {
    src: clipFor('travel').url,
    poster: P.travel.alpine(1600),
    overlay: 52,
    minHeight: '560px',
  }, 'Hero');
  const heroText = b.container(hero, { background: TRANSPARENT, padding: ['84', '48', '64', '48'], width: '100%' }, 'Hero text');
  b.badge(heroText, 'Six rooms · open March to November', { background: PANEL, color: INK });
  b.heading(heroText, 'A house at the top of the valley', {
    level: '1', fontSize: '50', color: PAPER, margin: ['16', '0', '12', '0'],
  });
  b.text(heroText, 'Breakfast at eight, the last bus at six, and nothing to do about either.', {
    fontSize: '19', color: rgba(255, 255, 255, 0.86), margin: ['0', '0', '26', '0'],
  });
  b.button(heroText, 'See the rooms', {
    background: PINE, color: WHITE, buttonStyle: 'full', action: 'page', actionValue: 'rooms',
  });

  const num = b.container(root, { background: PAPER, padding: ['40', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['6', 'rooms, no more', '1926', 'the year it was built', '20 min', 'to the ridge path'], {
    accent: PINE, color: MUTED,
  });

  // ── what staying here is actually like ──────────────────────────
  const what = b.container(root, { background: PAPER, padding: ['32', '48', '40', '48'], width: '100%', anchor: 'what' }, 'What');
  b.heading(what, 'What the house is like', { fontSize: '30', color: INK });
  b.spacer(what, '24');
  const whatCols = b.columns(what, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Breakfast at eight', 'coffee', 'One long table, bread from the village, and eggs from the farm below.'],
    ['No reception desk', 'key', 'You are handed a key on arrival and left alone until you want company.'],
    ['Boots by the door', 'hiking', 'Six paths start at the gate. We will tell you which one is muddy today.'],
  ]) {
    const card = b.container(whatCols, { background: PANEL, padding: ['24', '22', '24', '22'], radius: 10 }, name);
    b.icon(card, symbol, { color: PANEL, background: PINE });
    b.heading(card, name, { level: '3', fontSize: '18', color: INK, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  // ── the room, and what somebody said about it ───────────────────
  const room = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'A room');
  const roomSplit = b.columns(room, { count: '2', gap: '40', ratio: '3:2', align: 'center' });
  const roomCopy = b.container(roomSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Room copy');
  b.heading(roomCopy, 'Rooms that face the morning', { fontSize: '28', color: INK });
  b.text(roomCopy, 'Every room looks east across the valley, which means the light arrives before you do. Three have a bath; all six have a window seat worth the climb.', {
    fontSize: '16', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.button(roomCopy, 'Compare the six', {
    background: TRANSPARENT, color: INK, buttonStyle: 'outline', action: 'page', actionValue: 'rooms',
  });
  b.image(roomSplit, P.interiors.living(900), {
    alt: 'A pale guest room with the stairs behind it', radius: 10, width: '100%', height: '380px',
  });

  const said = b.container(root, { background: PAPER, padding: ['48', '48', '24', '48'], width: '100%' }, 'Said');
  b.testimonial(said, {
    quote: 'We came for two nights and rebooked from the breakfast table on the second morning.',
    author: 'Noa and Yuval', role: 'Stayed in the Ridge room, April',
    background: PANEL, color: INK, accent: PINE, align: 'center',
  });

  const close = b.container(root, { background: PAPER, padding: ['24', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'March is already filling',
    text: 'Two rooms left over the spring weekends. The valley is at its best before the coaches arrive.',
    cta: 'Ask about a date', href: '/stay/',
    background: PINE, color: WHITE, buttonBackground: PAPER, buttonColor: INK,
  });

  footer();
  return b.map;
}

/* ------------------------------------------------------------------ *
 * Rooms — the six of them, and what they cost
 * ------------------------------------------------------------------ */

function rooms() {
  const b = createBuilder();
  const root = b.root({ background: PAPER, width: '100%' });
  const footer = chrome(b, root);

  const head = b.container(root, {
    background: PANEL, padding: ['64', '48', '48', '48'], width: '100%',
    backgroundImage: P.interiors.lounge(1600), overlay: rgba(38, 35, 31, 0.62),
  }, 'Rooms header');
  b.heading(head, 'Six rooms, all facing east', { level: '1', fontSize: '44', color: PAPER });
  b.text(head, 'Named after what you can see from them. Prices are per night for two, breakfast included, and do not move with the season.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.84), margin: ['12', '0', '0', '0'],
  });

  const pick = b.container(root, { background: PAPER, padding: ['48', '48', '32', '48'], width: '100%', anchor: 'rooms' }, 'Rooms');
  b.pricing(pick, [
    'Gable', '€110', 'per night', 'Ask about Gable', 'Two under the roof;Shower;The quietest of the six',
    'Ridge', '€145', 'per night', 'Ask about Ridge', 'Two, east facing;Bath;Window seat over the valley',
    'Long room', '€180', 'per night', 'Ask about the Long room', 'Four, two rooms;Bath;The corner windows',
  ], { featured: 2, accent: PINE, background: PANEL, color: INK });

  const detail = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'Detail');
  const detailSplit = b.columns(detail, { count: '2', gap: '40', ratio: '2:3', align: 'center' });
  b.image(detailSplit, P.interiors.kitchen(900), {
    alt: 'The white kitchen where breakfast is laid out', radius: 10, width: '100%', height: '360px',
  });
  const detailCopy = b.container(detailSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Detail copy');
  b.heading(detailCopy, 'What is in every room', { fontSize: '28', color: INK });
  b.list(detailCopy, [
    'A bed made up with linen, not polyester',
    'A window that opens, and a seat beside it',
    'Tea, a kettle, and a tin that is refilled daily',
    'No television, and no apology for it',
  ], { color: MUTED, fontSize: '15' });

  const ask = b.container(root, { background: PAPER, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  b.heading(ask, 'Before you book', { fontSize: '30', color: INK });
  b.spacer(ask, '20');
  b.accordion(ask, [
    'Can we bring a dog?',
    'Two rooms take dogs — Gable and the Long room. Tell us when you write and there is no extra charge.',
    'Is there parking?',
    'Four spaces at the gate, first come. The lane is steep and narrow; a small car is a happier car.',
    'What about children?',
    'The Long room sleeps four and has done for ninety years. The stairs are old and there is no lift.',
  ], { background: PANEL, color: INK, radius: 10 });

  const close = b.container(root, { background: PAPER, padding: ['8', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Hold a room while you think',
    text: 'Tell us the dates and we will keep it for forty-eight hours. No card, no deposit.',
    cta: 'Ask about a date', href: '/stay/',
    background: PINE, color: WHITE, buttonBackground: PAPER, buttonColor: INK,
  });

  footer();
  return b.map;
}

/* ------------------------------------------------------------------ *
 * The valley — the reason anybody comes
 * ------------------------------------------------------------------ */

function valley() {
  const b = createBuilder();
  const root = b.root({ background: PAPER, width: '100%' });
  const footer = chrome(b, root);

  const head = b.container(root, { background: PAPER, padding: ['64', '48', '24', '48'], width: '100%' }, 'Valley header');
  b.heading(head, 'A day in the valley', { level: '1', fontSize: '44', color: INK });
  b.text(head, 'What people actually do here, in the order they tend to do it.', {
    fontSize: '17', color: MUTED, margin: ['12', '0', '0', '0'],
  });

  const seen = b.container(root, { background: PAPER, padding: ['16', '48', '40', '48'], width: '100%', anchor: 'seen' }, 'Seen');
  b.carousel(seen, {
    width: '100%', height: '420px', accent: PINE, title: 'The valley through the year',
    src1: P.travel.mountains(1000), heading1: 'The ridge, first light', label1: 'Twenty minutes up', p1: 'The path from the gate, before the cloud lifts off the far side.',
    src2: P.travel.window(1000), heading2: 'The green half', label2: 'The lower valley', p2: 'Meadow all the way down to the river and the old mill.',
    src3: P.travel.dusk(1000), heading3: 'Last of the light', label3: 'From the terrace', p3: 'The half hour that makes people book a third night.',
  });

  const day = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'A day');
  b.heading(day, 'How the day goes', { fontSize: '30', color: INK });
  b.spacer(day, '24');
  b.timeline(day, [
    '08:00', 'Breakfast', 'One table, everybody at it. Bread, eggs, and whoever is staying tells you where they walked yesterday.',
    '09:30', 'Out', 'Six paths from the gate, from an hour to most of a day. Boots by the door, maps on the hook.',
    '16:00', 'Back', 'Tea on the terrace if the sun is on it, by the fire if it is not.',
    '19:30', 'The village', 'Twelve minutes down. One kitchen, four tables, and you should have rung ahead.',
  ], { accent: PINE, color: INK });

  const when = b.container(root, { background: PAPER, padding: ['48', '48', '32', '48'], width: '100%' }, 'When');
  const whenSplit = b.columns(when, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const whenCopy = b.container(whenSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'When copy');
  b.heading(whenCopy, 'When to come', { fontSize: '28', color: INK });
  b.text(whenCopy, 'We are open from March to November. Each end of that has something the middle does not.', {
    fontSize: '16', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.tabs(whenSplit, [
    'Spring', 'Meadow flowers, cold mornings, and the paths to yourself. The best light of the year.',
    'Summer', 'Long days and a warm terrace. Book early — the four weeks around August go first.',
    'Autumn', 'Colour on the far side and nobody on the ridge. Bring a second jumper.',
  ], { accent: PINE });

  const where = b.container(root, { background: PANEL, padding: ['40', '48', '48', '48'], width: '100%', anchor: 'where' }, 'Where');
  b.heading(where, 'Where the house is', { fontSize: '28', color: INK, margin: ['0', '0', '18', '0'] });
  b.map_(where, {
    lat: 46.6247, lng: 8.0414, zoom: 12, height: '340px',
    label: 'Fold House', address: 'Top of the lane, above the village',
  });

  footer();
  return b.map;
}

/* ------------------------------------------------------------------ *
 * Stay — the page that takes the booking
 * ------------------------------------------------------------------ */

function stay() {
  const b = createBuilder();
  const root = b.root({ background: PAPER, width: '100%' });
  const footer = chrome(b, root);

  const head = b.container(root, { background: PAPER, padding: ['64', '48', '24', '48'], width: '100%' }, 'Stay header');
  b.heading(head, 'Ask about a date', { level: '1', fontSize: '44', color: INK });
  b.text(head, 'There is no booking engine and no deposit. Write, and somebody who lives here answers by the evening.', {
    fontSize: '17', color: MUTED, margin: ['12', '0', '0', '0'],
  });

  const book = b.container(root, { background: PAPER, padding: ['24', '48', '48', '48'], width: '100%', anchor: 'book' }, 'Book');
  const bookSplit = b.columns(book, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  b.form(bookSplit, {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
      { label: 'Which nights', type: 'text', placeholder: 'e.g. 12–14 April, two of us' },
      { label: 'Anything we should know', type: 'textarea', placeholder: 'A dog, a birthday, a very early train' },
    ],
    submitText: 'Send the enquiry',
    successMessage: 'Thank you — we answer by the evening, every day.',
    accent: PINE, background: PANEL, textColor: INK,
  });
  const aside = b.container(bookSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Aside');
  b.heading(aside, 'Or take a slot', { fontSize: '24', color: INK });
  b.text(aside, 'Fifteen minutes on the telephone, if you would rather ask than type.', {
    fontSize: '15', color: MUTED, margin: ['10', '0', '14', '0'],
  });
  b.booking(aside, {
    heading: 'A call about a stay', buttonText: 'Book the call',
    duration: 15, startHour: 9, endHour: 18, timeZone: 'Europe/Zurich', accent: PINE,
  });

  const know = b.container(root, { background: PANEL, padding: ['48', '48', '40', '48'], width: '100%' }, 'Know');
  b.heading(know, 'Getting here', { fontSize: '28', color: INK });
  b.spacer(know, '20');
  const knowCols = b.columns(know, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['By train', 'train', 'To the valley station, then the post bus at ten past the hour until six.'],
    ['By car', 'directions_car', 'The lane is steep and single track. Four spaces at the gate.'],
    ['On foot', 'hiking', 'Fifty minutes up from the village, and worth it with a light bag.'],
  ]) {
    const card = b.container(knowCols, { background: PAPER, padding: ['22', '20', '22', '20'], radius: 10 }, name);
    b.icon(card, symbol, { color: PANEL, background: PINE });
    b.heading(card, name, { level: '3', fontSize: '17', color: INK, margin: ['12', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '14', color: MUTED });
  }

  const news = b.container(root, { background: PAPER, padding: ['40', '48', '72', '48'], width: '100%' }, 'News');
  b.newsletter(news, {
    heading: 'Two letters a year, and never more',
    placeholder: 'you@example.com',
    buttonText: 'Keep in touch',
    successMessage: 'Thank you — one at the start of the season, one at the end.',
    accent: PINE, color: INK,
  });

  footer();
  return b.map;
}

export default function guesthouse() {
  return {
    name: 'Guesthouse — Fold House',
    category: 'Business',
    thumb: P.interiors.lounge(600),
    pages: [
      { name: 'Home', slug: 'home', map: home() },
      { name: 'Rooms', slug: 'rooms', map: rooms() },
      { name: 'The valley', slug: 'valley', map: valley() },
      { name: 'Stay', slug: 'stay', map: stay() },
    ],
  };
}
