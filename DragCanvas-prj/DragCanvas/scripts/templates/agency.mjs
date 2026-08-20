import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/** Design agency — case studies, the logos that vouch for them, and a brief form. */
export default function agency() {
  const b = createBuilder();
  const PAPER = rgba(250, 249, 248);
  const INK = rgba(20, 20, 22);
  const PANEL = rgba(238, 237, 235);
  const RED = rgba(214, 69, 46);
  const MUTED = rgba(105, 103, 108);

  const root = b.root({ background: PAPER, width: '100%' });
  b.navbar(root, 'FIELD', [
    { text: 'Work', href: '#work' },
    { text: 'Studio', href: '#studio' },
    { text: 'Brief', href: '#brief' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: PAPER, padding: ['80', '48', '40', '48'], width: '100%', backgroundImage: P.agency.facade(1600), overlay: rgba(20, 20, 22, 0.68) }, 'Hero');
  b.heading(hero, 'We make the difficult part look obvious', { level: '1', fontSize: '54', color: PAPER });
  b.text(hero, 'Brand and product design for companies that have outgrown their first look.', {
    fontSize: '19', color: rgba(255, 255, 255, 0.82), margin: ['14', '0', '28', '0'],
  });
  b.logoStrip(hero, ['Kettle', 'Fathom', 'Monday', 'Northwind', 'Sable'], { height: '28', color: PAPER });

  const work = b.container(root, { background: PAPER, padding: ['40', '48', '48', '48'], width: '100%', anchor: 'work' }, 'Work');
  b.heading(work, 'Recent work', { fontSize: '32', color: INK });
  b.spacer(work, '24');
  const cases = b.columns(work, { count: '2', gap: '24' });
  for (const [client, what, img] of [
    ['Kettle', 'A brand that survives being printed small', P.agency.proofs(800)],
    ['Fathom', 'Turning a dense product into three screens', P.agency.monitor(800)],
  ]) {
    const card = b.container(cases, { background: PANEL, padding: ['0', '0', '22', '0'], radius: 12 }, client);
    b.image(card, img, { alt: `${client} identity design case study`, radius: 12, width: '100%', height: '260px' });
    b.heading(card, client, { level: '3', fontSize: '20', color: INK, margin: ['16', '22', '4', '22'] });
    b.text(card, what, { fontSize: '15', color: MUTED, margin: ['0', '22', '0', '22'] });
  }

  // ── how a project runs ─────────────────────────────────────────
  const how = b.container(root, { background: PAPER, padding: ['48', '48', '48', '48'], width: '100%' }, 'Process');
  b.heading(how, 'How eight weeks actually go', { fontSize: '32', color: INK });
  b.spacer(how, '24');
  b.timeline(how, [
    'Week 1', 'Questions, not moodboards', 'Two days in your office, talking to the people who sell the thing.',
    'Week 3', 'Two directions', 'Presented in situ - on the packaging, the site, the invoice - never on slides alone.',
    'Week 6', 'Build', 'The chosen direction carried through everything, with the team who will own it.',
    'Week 8', 'Handover', 'Files, rules, and two hours of nobody-is-allowed-to-say-“just” training.',
  ], { accent: RED, color: INK });

  const studio = b.container(root, { background: INK, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'studio' }, 'Studio');
  b.heading(studio, 'Six people, one room', { fontSize: '32', color: PAPER });
  b.spacer(studio, '20');
  b.stats(studio, ['11', 'years', '60+', 'projects', '6', 'people'], { accent: RED, color: rgba(180, 178, 182) });
  b.spacer(studio, '28');
  b.teamGrid(studio, [
    'Noga Feld', 'Direction', P.faces.warm(400),
    'Assaf Liron', 'Identity', P.faces.grey(400),
    'Maya Dagan', 'Product', P.faces.violet(400),
  ], { columns: '3', accent: rgba(32, 32, 35), color: PAPER });
  b.spacer(studio, '28');
  b.testimonial(studio, {
    quote: 'They asked better questions than our board did, and then answered them in pictures.',
    author: 'Ronit Adler', role: 'CEO, Kettle',
    background: rgba(32, 32, 35), color: PAPER, accent: RED,
  });

  // ── ways to hire the room ──────────────────────────────────────
  const ways = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', alignItems: 'center' }, 'Engagements');
  b.heading(ways, 'Ways to hire the room', { fontSize: '30', textAlign: 'center', color: INK });
  b.text(ways, 'Starting points, not ceilings. Most projects bend between these.', {
    fontSize: '15', textAlign: 'center', color: MUTED, margin: ['10', '0', '24', '0'],
  });
  b.pricing(ways, [
    'Sprint', 'from ₪28k', 'two weeks', 'Book a sprint', 'One focused problem; Working files; A decision by Friday',
    'Identity', 'from ₪95k', 'six to eight weeks', 'Start identity', 'Full brand; Voice and type; Everything handed over',
    'Retainer', '₪30k', 'per month', 'Talk to us', 'A set number of days; Same two people; Cancel per month',
  ], { featured: 2, accent: RED, background: PAPER, color: INK });

  // ── the questions a brief usually raises ───────────────────────
  const ask = b.container(root, { background: PAPER, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'Before you write the brief', { fontSize: '30', color: INK });
  b.text(askIntro, 'The three things every first conversation gets to, usually in the first ten minutes.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'Who owns the work when it is done?',
    'You do, entirely, from the final payment. We keep only the right to show it here.',
    'Do you build, or only design?',
    'We design and art-direct the build. For code we bring in two studios we have worked with for years.',
    'What if we cannot articulate what we want?',
    'That is the normal case, not the exception. It is what the first week is for.',
  ], { background: PANEL, color: INK, radius: 12 });

  const brief = b.container(root, { background: PAPER, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'brief' }, 'Brief');
  const briefSplit = b.columns(brief, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const briefCopy = b.container(briefSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Brief copy');
  b.heading(briefCopy, 'Send us a brief', { fontSize: '30', color: INK });
  b.text(briefCopy, 'A paragraph is plenty. We will tell you within a week whether we are the right studio.', {
    fontSize: '16', color: MUTED, margin: ['10', '0', '16', '0'],
  });
  b.list(briefCopy, [
    'What the thing is, in one sentence',
    'What “better” would look like to you',
    'A date, if there is one',
  ], { color: MUTED, fontSize: '15' });
  b.form(briefSplit, { submitText: 'Send the brief', accent: RED, background: PANEL });

  const close = b.container(root, { background: PAPER, padding: ['24', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Start with the awkward paragraph',
    text: 'The briefs that begin “we are not sure how to say this” are the ones that end best.',
    cta: 'Send a brief', href: '#brief',
    background: INK, color: PAPER, buttonBackground: RED, buttonColor: WHITE,
  });

  b.footer(root, {
    brand: 'FIELD',
    note: 'Design and art direction. Tel Aviv and remote.',
    socials: ['Instagram', 'https://instagram.com/', 'Behance', 'https://behance.net/', 'Email', 'mailto:studio@field.co'],
    background: INK, ink: PAPER, muted: MUTED,
  });

  return { name: 'Design Agency — FIELD', category: 'Business', thumb: P.agency.studio(600), map: b.map };
}
