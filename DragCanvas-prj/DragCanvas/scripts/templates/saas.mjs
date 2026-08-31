import { createBuilder, rgba, WHITE, TRANSPARENT, RADIUS, SHADOW } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/**
 * SaaS Landing — NovaFlow (replaces template 12)
 *
 * The old version was Text×29 and Container×27: a product page with no price and
 * no answers to the obvious questions. A visitor deciding whether to sign up
 * wants three things - what it costs, who else uses it, and what happens when
 * something goes wrong - and none of them were there.
 *
 * Dark, indigo, dense. The opening is a promise and a price in the same screen.
 */
export default function saas() {
  const b = createBuilder();
  const INK = rgba(2, 6, 23);
  const CARD = rgba(30, 41, 59);
  const INDIGO = rgba(90, 93, 233);
  // The same indigo that carries a white label is too dark to read as text on
  // the near-black sections, so those get a lifted one.
  const INDIGO_ON_INK = rgba(120, 123, 240);
  const MUTED = rgba(148, 163, 184);

  const root = b.root({ background: INK, width: '100%' });

  b.navbar(root, 'NovaFlow', [
    { text: 'Features', href: '#features' },
    { text: 'Pricing', href: '#pricing' },
    { text: 'Questions', href: '#questions' },
  ], { variant: 'dark', sticky: true });

  // ── the promise ────────────────────────────────────────────────
  const hero = b.container(root, {
    background: INK, padding: ['80', '48', '64', '48'], alignItems: 'center', width: '100%',
    backgroundImage: P.saas.floor(1600), overlay: rgba(2, 6, 23, 0.82),
  }, 'Hero');
  b.heading(hero, 'Ship the work, not the status update', {
    level: '1', fontSize: '52', fontWeight: '800', textAlign: 'center', color: WHITE,
  });
  b.text(hero, 'NovaFlow keeps a small team’s work in one place, and tells everyone else what changed without a meeting.', {
    fontSize: '19', textAlign: 'center', color: MUTED, margin: ['16', '0', '28', '0'],
  });
  b.button(hero, 'Start free', { background: INDIGO, color: WHITE, buttonStyle: 'full' });
  b.spacer(hero, '12');
  b.logoStrip(hero, ['Kettle', 'Fathom', 'Northwind', 'Sable'], { height: '26', color: WHITE });

  // ── what it does ───────────────────────────────────────────────
  const features = b.container(root, {
    background: INK, padding: ['64', '48', '64', '48'], width: '100%', anchor: 'features',
  }, 'Features');
  b.heading(features, 'Three things, done properly', { fontSize: '34', color: WHITE });
  b.spacer(features, '28');
  const cols = b.columns(features, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['One board', 'view_kanban', 'Everything in flight, in one place, with no columns nobody uses.'],
    ['Written updates', 'draft', 'A digest that writes itself from what actually moved this week.'],
    ['Honest dates', 'schedule', 'Estimates that change when the work changes, not when someone asks.'],
  ]) {
    const card = b.container(cols, { background: CARD, padding: ['26', '24', '26', '24'], shadow: SHADOW.lifted, radius: RADIUS.card }, name);
    b.icon(card, symbol, { color: WHITE, background: INDIGO });
    b.heading(card, name, { level: '3', fontSize: '19', color: WHITE, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  b.spacer(root, '8');
  const numbers = b.container(root, { background: INK, padding: ['0', '48', '64', '48'], width: '100%' }, 'Numbers');
  b.stats(numbers, ['1,200+', 'teams shipping', '4 min', 'to first board', '99.9%', 'uptime last year'], {
    accent: INDIGO, color: MUTED,
  });

  const product = b.container(root, { background: INK, padding: ['0', '48', '64', '48'], width: '100%' }, 'Product tour');
  b.carousel(product, {
    width: '704px', height: '400px', accent: INDIGO,
    src1: P.saas.screen(1200), heading1: 'One calm board', label1: 'Plan', p1: 'See what is moving, blocked and actually finished.',
    src2: P.saas.pairing(1200), heading2: 'Work together', label2: 'Collaborate', p2: 'Decisions and updates stay beside the work they changed.',
    src3: P.saas.standup(1200), heading3: 'Skip the status meeting', label3: 'Automate', p3: 'A useful weekly digest assembled from real activity.',
  }, 'NovaFlow product tour');

  // ── the meeting it replaces ────────────────────────────────────
  const digest = b.container(root, {
    background: INK, padding: ['0', '48', '64', '48'], width: '100%', anchor: 'workflow',
  }, 'Digest');
  const split = b.columns(digest, { count: '2', gap: '36', ratio: '3:2', stack: 'yes' });
  const photoSide = b.container(split, { background: TRANSPARENT, width: '100%' }, 'Digest photo');
  b.image(photoSide, P.saas.desks(1000), { alt: 'Product team reviewing project activity together', width: '100%', height: '420px', objectFit: 'cover', radius: RADIUS.card });
  const copySide = b.container(split, {
    background: TRANSPARENT, width: '100%', justifyContent: 'center', padding: ['0', '0', '0', '8'],
  }, 'Digest copy');
  b.heading(copySide, 'The Monday meeting, written instead', { fontSize: '26', color: WHITE });
  b.text(copySide, 'Every Friday the digest goes out: what shipped, what slipped, and the one decision that is still open. It is assembled from the board, so nobody has to write a status update again.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.link(copySide, 'Explore the workflow', '#workflow', { color: INDIGO_ON_INK, fontSize: '15' });

  // ── what it costs ──────────────────────────────────────────────
  const price = b.container(root, {
    background: CARD, padding: ['64', '48', '64', '48'], width: '100%', anchor: 'pricing', alignItems: 'center',
  }, 'Pricing');
  b.heading(price, 'Priced per team, not per seat', { fontSize: '34', textAlign: 'center', color: WHITE });
  b.spacer(price, '28');
  b.pricing(price, [
    'Solo', '$0', 'forever', 'Start free', 'One board; Two people; Weekly digest',
    'Team', '$29', 'per month', 'Choose Team', 'Ten boards; Unlimited people; Digests; Integrations',
    'Studio', '$79', 'per month', 'Talk to us', 'Everything in Team; Client access; Priority support; SSO',
  ], { featured: 2, accent: INDIGO, background: INK, color: WHITE });

  // ── the obvious questions ──────────────────────────────────────
  const faq = b.container(root, {
    background: INK, padding: ['64', '48', '48', '48'], width: '100%', anchor: 'questions',
  }, 'Questions');
  const faqSplit = b.columns(faq, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const faqIntro = b.container(faqSplit, {
    background: TRANSPARENT, width: '100%', justifyContent: 'center',
  }, 'Questions intro');
  b.heading(faqIntro, 'Before you ask', { fontSize: '34', color: WHITE });
  b.text(faqIntro, 'The three questions every team asks on day one, answered without a sales call.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(faqSplit, [
    'Can I move my data out?',
    'Yes, as JSON or CSV, whenever you like. It is your work.',
    'What happens when the free tier runs out?',
    'Nothing disappears. The board goes read-only until you pick a plan or remove one.',
    'Do you charge per person?',
    'No. A plan covers the whole team, however many of you there are.',
  ], { background: CARD, color: WHITE, radius: RADIUS.card });

  const proof = b.container(root, { background: INK, padding: ['16', '48', '64', '48'], width: '100%' }, 'Proof');
  b.testimonial(proof, {
    quote: 'We stopped having the Monday meeting. Nobody has asked for it back.',
    author: 'Maya Chen', role: 'Engineering lead, Fathom',
    background: CARD, color: WHITE, accent: INDIGO,
  });

  const close = b.container(root, { background: INK, padding: ['0', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Try it with one board',
    text: 'No card, no trial clock. Move a real project onto it and see.',
    cta: 'Start free', href: '#pricing',
    background: INDIGO, color: WHITE, buttonBackground: WHITE, buttonColor: INDIGO,
  });

  b.modernSuite(root, { mode: 'content', background: INK, panel: CARD, ink: rgba(255, 255, 255), accent: INDIGO_ON_INK });
  b.footer(root, {
    brand: 'NovaFlow',
    note: 'Made by a small team. No card needed to start.',
    socials: ['Twitter', 'https://twitter.com/', 'GitHub', 'https://github.com/'],
    background: CARD, ink: WHITE, muted: MUTED,
  });

  return {
    id: 12,
    name: 'SaaS Landing — NovaFlow',
    category: 'Landing Page',
    thumb: P.saas.pairing(600),
    map: b.map,
  };
}
