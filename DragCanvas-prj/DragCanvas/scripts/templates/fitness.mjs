import { createBuilder, rgba, WHITE, TRANSPARENT, RADIUS, PAD, SHADOW } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/**
 * Fitness Studio — FORGE (replaces template 15)
 *
 * A gym page answers "when can I come and what does it cost". The timetable is a
 * timeline because a timetable is a sequence, and the old version had it as
 * thirty-six loose Texts.
 */
export default function fitness() {
  const b = createBuilder();
  const INK = rgba(16, 18, 17);
  const PANEL = rgba(25, 29, 26);
  const LIME = rgba(196, 242, 75);
  const BONE = rgba(244, 246, 242);
  const MUTED = rgba(141, 150, 134);

  const root = b.root({ background: INK, width: '100%' });
  b.navbar(root, 'FORGE', [
    { text: 'Timetable', href: '#timetable' },
    { text: 'Coaches', href: '#coaches' },
    { text: 'Membership', href: '#membership' },
  ], { variant: 'dark', sticky: true });

  const hero = b.container(root, { background: INK, padding: ['80', '48', '56', '48'], width: '100%', backgroundImage: P.fitness.deadlift(1600), overlay: rgba(16, 18, 17, 0.7) }, 'Hero');
  b.heading(hero, 'Show up. Lift. Leave.', { level: '1', fontSize: '56', fontWeight: '800', color: BONE });
  b.text(hero, 'Barbell club and conditioning, five in the morning to ten at night. No mirrors, no contracts.', {
    fontSize: '18', color: rgba(255, 255, 255, 0.82), margin: ['14', '0', '24', '0'],
  });
  b.button(hero, 'First class free', { background: LIME, color: INK, buttonStyle: 'full' });
  b.spacer(hero, '32');
  b.stats(hero, ['5am', 'first class', '340', 'members', '12', 'coaches'], { accent: LIME, color: rgba(255, 255, 255, 0.82) });

  // ── what a membership actually buys ────────────────────────────
  const buys = b.container(root, { background: INK, padding: ['56', '48', '48', '48'], width: '100%' }, 'Included');
  b.heading(buys, 'What the membership covers', { fontSize: '34', color: BONE });
  b.spacer(buys, '24');
  const buysCols = b.columns(buys, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Coached classes', 'fitness_center', 'Every class on the timetable, capped at eight so form gets checked.'],
    ['Open gym', 'schedule', 'Full access, five in the morning to ten at night, coaches around.'],
    ['Your programming', 'edit_note', 'A written plan for the days without a class, reviewed each month.'],
  ]) {
    const card = b.container(buysCols, { background: PANEL, padding: ['24', '22', '24', '22'], shadow: SHADOW.lifted, radius: RADIUS.card }, name);
    b.icon(card, symbol, { color: INK, background: LIME });
    b.heading(card, name, { level: '3', fontSize: '18', color: BONE, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  const when = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'timetable' }, 'Timetable');
  b.heading(when, 'A day here', { fontSize: '34', color: BONE });
  b.spacer(when, '24');
  b.timeline(when, [
    '05:00', 'Barbell fundamentals', 'Squat, press, pull. Coached, capped at eight.',
    '12:30', 'Thirty minutes', 'Conditioning for people with a lunch break.',
    '18:00', 'Olympic lifting', 'Snatch and clean, technique first.',
    '20:00', 'Open gym', 'The room is yours. A coach is around.',
  ], { accent: LIME, color: BONE });

  const who = b.container(root, { background: INK, padding: ['56', '48', '48', '48'], width: '100%', anchor: 'coaches' }, 'Coaches');
  b.heading(who, 'Who is on the floor', { fontSize: '34', color: BONE });
  b.spacer(who, '24');
  b.teamGrid(who, [
    'Adi Rom', 'Strength', P.faces.warm(400),
    'Yonatan Bar', 'Olympic lifting', P.faces.violet(400),
    'Shira Peled', 'Conditioning', P.faces.teal(400),
  ], { columns: '3', accent: PANEL, color: BONE });
  b.spacer(who, '32');
  b.carousel(who, {
    width: '704px', height: '400px', accent: LIME,
    src1: P.fitness.barbell(1200), heading1: 'Strength floor', label1: 'Train', p1: 'Platforms, racks and enough room to move safely.',
    src2: P.fitness.stack(1200), heading2: 'Conditioning', label2: 'Move', p2: 'Short sessions, measured work, no random punishment.',
    src3: P.fitness.rack(1200), heading3: 'Open gym', label3: 'Practice', p3: 'Your programme, with a coach nearby when you need one.',
  }, 'Inside FORGE');

  const member = b.container(root, { background: INK, padding: ['16', '48', '48', '48'], width: '100%' }, 'Member');
  b.testimonial(member, {
    quote: 'I came for the barbell class and stayed because somebody finally told me what to do on the other days.',
    author: 'Roni Adler', role: 'Member since 2023',
    background: PANEL, color: BONE, accent: LIME,
  });

  // ── the questions before the first class ───────────────────────
  const ask = b.container(root, { background: PANEL, padding: PAD.regular, width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Before the first class', { fontSize: '30', color: BONE });
  b.text(askIntro, 'Nobody expects experience. Here is what people ask anyway.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'I have never lifted. Is that a problem?',
    'No. The fundamentals class assumes nothing, and the bar starts empty until your form says otherwise.',
    'What should I bring?',
    'Flat shoes, a towel, water. Everything else - bars, plates, chalk - is on the floor.',
    'Can I pause the membership?',
    'Yes, for up to two months a year, from your phone, no phone call required.',
  ], { background: INK, color: BONE, radius: RADIUS.card });

  const cost = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'membership', alignItems: 'center' }, 'Membership');
  b.heading(cost, 'Membership', { fontSize: '34', textAlign: 'center', color: BONE });
  b.spacer(cost, '24');
  b.pricing(cost, [
    'Drop in', '₪70', 'per class', 'Come once', 'Any class; No commitment',
    'Monthly', '₪380', 'per month', 'Join monthly', 'Unlimited classes; Open gym; Cancel any time',
    'Yearly', '₪3,600', 'per year', 'Join yearly', 'Everything monthly; Two months free; Guest passes',
  ], { featured: 2, accent: LIME, background: INK, color: BONE });

  // ── book the free class ────────────────────────────────────────
  const book = b.container(root, { background: INK, padding: PAD.regular, width: '100%', anchor: 'book' }, 'Book');
  const bookSplit = b.columns(book, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const bookCopy = b.container(bookSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Book copy');
  b.heading(bookCopy, 'Take the free class', { fontSize: '30', color: BONE });
  b.text(bookCopy, 'Pick a slot from the timetable and put your name down. A coach confirms the same day.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(bookCopy, [
    'Arrive ten minutes early to borrow shoes',
    'Tell the coach about any old injuries',
    'The first squat is with an empty bar, always',
  ], { color: MUTED, fontSize: '15' });
  b.form(bookSplit, {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
      { label: 'Class', type: 'text', placeholder: 'e.g. Barbell fundamentals, Tuesday 05:00' },
    ],
    submitText: 'Book the class', successMessage: 'Booked. A coach will confirm by email today.',
    background: PANEL, accent: LIME, textColor: BONE,
  });

  const close = b.container(root, { background: INK, padding: ['0', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Come and try it',
    text: 'First class is free and nobody will make you talk about your goals.',
    cta: 'Book a slot', href: '#book',
    background: LIME, color: INK, buttonBackground: INK, buttonColor: LIME,
  });

  b.modernSuite(root, { mode: 'service', background: INK, panel: PANEL, ink: BONE, accent: LIME });
  b.footer(root, {
    brand: 'FORGE',
    note: 'Open 05:30 to 22:00. First session is free.',
    socials: ['Instagram', 'https://instagram.com/', 'Phone', 'tel:+97230000000'],
    background: PANEL, ink: BONE, muted: MUTED,
  });

  return { id: 15, name: 'Fitness Studio — FORGE', category: 'Business', thumb: P.fitness.rack(600), map: b.map };
}
