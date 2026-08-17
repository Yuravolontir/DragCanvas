import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

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

  const hero = b.container(root, { background: INK, padding: ['80', '48', '56', '48'], width: '100%' }, 'Hero');
  b.heading(hero, 'Show up. Lift. Leave.', { level: '1', fontSize: '56', fontWeight: '800', color: BONE });
  b.text(hero, 'Barbell club and conditioning, five in the morning to ten at night. No mirrors, no contracts.', {
    fontSize: '18', color: MUTED, margin: ['14', '0', '24', '0'],
  });
  b.button(hero, 'First class free', { background: LIME, color: INK, buttonStyle: 'full' });
  b.spacer(hero, '32');
  b.stats(hero, ['5am', 'first class', '340', 'members', '12', 'coaches'], { accent: LIME, color: MUTED });

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
    'Adi Rom', 'Strength', px(6628962, 400),
    'Yonatan Bar', 'Olympic lifting', px(4464780, 400),
    'Shira Peled', 'Conditioning', px(32610333, 400),
  ], { columns: '3', accent: PANEL, color: BONE });

  const cost = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'membership', alignItems: 'center' }, 'Membership');
  b.heading(cost, 'Membership', { fontSize: '34', textAlign: 'center', color: BONE });
  b.spacer(cost, '24');
  b.pricing(cost, [
    'Drop in', '₪70', 'per class', 'Come once', 'Any class; No commitment',
    'Monthly', '₪380', 'per month', 'Join monthly', 'Unlimited classes; Open gym; Cancel any time',
    'Yearly', '₪3,600', 'per year', 'Join yearly', 'Everything monthly; Two months free; Guest passes',
  ], { featured: 2, accent: LIME, background: INK, color: BONE });

  const close = b.container(root, { background: INK, padding: ['48', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Come and try it',
    text: 'First class is free and nobody will make you talk about your goals.',
    cta: 'Book a slot', href: '#timetable',
    background: LIME, color: INK, buttonBackground: INK, buttonColor: LIME,
  });

  return { id: 15, name: 'Fitness Studio — FORGE', category: 'Business', thumb: px(2261477), map: b.map };
}
