import { createBuilder, rgba, WHITE, TRANSPARENT } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/** Developer portfolio — projects, what they know, and how to reach them. Sparse on purpose. */
export default function developer() {
  const b = createBuilder();
  const INK = rgba(14, 16, 20);
  const PANEL = rgba(23, 26, 32);
  const BONE = rgba(233, 236, 241);
  const CYAN = rgba(86, 204, 218);
  const MUTED = rgba(133, 141, 153);

  const root = b.root({ background: INK, width: '100%' });
  b.navbar(root, 'omer.dev', [
    { text: 'Projects', href: '#projects' },
    { text: 'Stack', href: '#stack' },
    { text: 'Contact', href: '#contact' },
  ], { variant: 'dark' });

  const hero = b.container(root, { background: INK, padding: ['80', '48', '48', '48'], width: '100%', backgroundImage: P.developer.editor(1600), overlay: rgba(14, 16, 20, 0.8) }, 'Hero');
  b.badge(hero, 'Contract from October', { background: PANEL, color: CYAN });
  b.heading(hero, 'I build the boring parts properly', { level: '1', fontSize: '48', color: BONE, margin: ['16', '0', '12', '0'] });
  b.text(hero, 'Backend and infrastructure, mostly Node and Postgres. Ten years, four companies, one very long migration.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82), margin: ['0', '0', '24', '0'],
  });
  b.socialLinks(hero, ['GitHub', 'https://github.com/', 'LinkedIn', 'https://linkedin.com/', 'Email', 'mailto:hi@omer.dev'], {
    background: rgba(255, 255, 255, 0.07), color: BONE,
  });

  // ── the cv in three numbers ─────────────────────────────────────
  const num = b.container(root, { background: INK, padding: ['32', '48', '8', '48'], width: '100%' }, 'Numbers');
  b.stats(num, ['10', 'years, four companies', '40k', 'lines in the reconciler', '80ms', 'the cold start, after the fix'], {
    accent: CYAN, color: MUTED,
  });

  const proj = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%', anchor: 'projects' }, 'Projects');
  b.heading(proj, 'Things I have shipped', { fontSize: '32', color: BONE });
  b.spacer(proj, '24');
  const cols = b.columns(proj, { count: '2', gap: '20' });
  for (const [name, what] of [
    ['ledger-sync', 'Reconciles two accounting systems that disagree politely. 40k lines, no cron.'],
    ['pgqueue', 'A job queue that is just Postgres. Because the fifth dependency is the expensive one.'],
    ['warmups', 'Cuts cold starts on a serverless fleet from 900ms to 80ms.'],
    ['tinyauth', 'Session auth in 300 lines, for people who do not need a provider.'],
  ]) {
    const card = b.container(cols, { background: PANEL, padding: ['24', '24', '24', '24'], radius: 10 }, name);
    b.heading(card, name, { level: '3', fontSize: '18', color: CYAN });
    b.text(card, what, { fontSize: '15', color: MUTED, margin: ['8', '0', '0', '0'] });
  }

  // ── how the work is done ────────────────────────────────────────
  const how = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%' }, 'How');
  b.heading(how, 'How the work is done', { fontSize: '30', color: BONE });
  b.spacer(how, '24');
  const howCols = b.columns(how, { count: '3', gap: '20' });
  for (const [name, symbol, copy] of [
    ['Observe before fixing', 'monitor_heart', 'A dashboard exists before a fix is attempted. Most bugs die of visibility.'],
    ['Small interfaces', 'extension', 'Boundaries drawn on purpose. The fifth dependency is always the expensive one.'],
    ['Boring on purpose', 'verified_user', 'Provisioned in Terraform, reviewed by a second person, no heroics at 2am.'],
  ]) {
    const card = b.container(howCols, { background: PANEL, padding: ['24', '22', '24', '22'], radius: 10 }, name);
    b.icon(card, symbol, { color: INK, background: CYAN });
    b.heading(card, name, { level: '3', fontSize: '18', color: BONE, margin: ['14', '0', '6', '0'] });
    b.text(card, copy, { fontSize: '15', color: MUTED });
  }

  // ── the migration that taught the most ──────────────────────────
  const war = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%' }, 'The migration');
  b.heading(war, 'The migration that taught me most', { fontSize: '30', color: BONE });
  b.spacer(war, '24');
  b.timeline(war, [
    'Month 0', 'The audit', 'Eleven services writing to two databases that disagreed politely about money.',
    'Month 9', 'The dual-write', 'Both systems fed from one queue. Every discrepancy filed weekly, until there were none.',
    'Month 20', 'The cutover', 'A Sunday, a flag flip, and a queue that drained itself empty by Monday.',
  ], { accent: CYAN, color: BONE });

  const stack = b.container(root, { background: INK, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'stack' }, 'Stack');
  const split = b.columns(stack, { count: '2', gap: '40' });
  const know = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Know');
  b.heading(know, 'What I reach for', { fontSize: '26', color: BONE });
  b.list(know, ['Node, TypeScript, Postgres', 'Terraform and too much YAML', 'Playwright, because it catches the real bugs'], {
    color: MUTED, fontSize: '16',
  });
  const learning = b.container(split, { background: TRANSPARENT, padding: ['0', '0', '0', '0'] }, 'Learning');
  b.heading(learning, 'What I am learning', { fontSize: '26', color: BONE });
  b.list(learning, ['Rust, slowly and badly', 'How to write a design document nobody dreads'], {
    color: MUTED, fontSize: '16',
  });

  const notes = b.container(root, { background: INK, padding: ['16', '48', '56', '48'], width: '100%' }, 'Work notes');
  b.heading(notes, 'Inside the work', { fontSize: '28', color: BONE });
  b.text(notes, 'A few frames from recent systems, reviews and migrations.', {
    color: MUTED, margin: ['8', '0', '22', '0'],
  });
  b.carousel(notes, {
    width: '704px', height: '400px', accent: CYAN,
    src1: P.developer.terminal(1200), heading1: 'Observe first', label1: 'Runtime', p1: 'Make the failure visible before trying to make it disappear.',
    src2: P.developer.review(1200), heading2: 'Review the boundary', label2: 'Code', p2: 'Small interfaces, explicit ownership, fewer surprises.',
    src3: P.developer.trace(1200), heading3: 'Leave a trail', label3: 'Debugging', p3: 'Logs that explain what the system believed at the time.',
  }, 'Project gallery');

  // ── what the time costs ─────────────────────────────────────────
  const rates = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', alignItems: 'center' }, 'Rates');
  b.heading(rates, 'What the time costs', { fontSize: '30', textAlign: 'center', color: BONE });
  b.text(rates, 'Contract from October. Advisory slots open a month earlier.', {
    fontSize: '15', textAlign: 'center', color: MUTED, margin: ['10', '0', '24', '0'],
  });
  b.pricing(rates, [
    'Contract', '₪1,600', 'per day', 'Check October', 'Three months minimum; Your stack, your repo; On site one day a week',
    'Mostly yours', '₪19k', 'three days a week', 'Hold the days', 'The long-haul work; The boring parts, properly; A month’s notice either way',
    'Advisory', '₪900', 'ninety minutes', 'Book a session', 'A read of your architecture; Hard questions, kindly; Written up after',
  ], { featured: 1, accent: CYAN, background: INK, color: BONE });

  // ── the questions that arrive by email ──────────────────────────
  const ask = b.container(root, { background: INK, padding: ['48', '48', '48', '48'], width: '100%' }, 'Questions');
  const askSplit = b.columns(ask, { count: '2', gap: '40', ratio: '2:3', stack: 'yes' });
  const askIntro = b.container(askSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Questions intro');
  b.heading(askIntro, 'The usual questions', { fontSize: '30', color: BONE });
  b.text(askIntro, 'The three every first email asks, answered once here instead.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '0', '0'],
  });
  b.accordion(askSplit, [
    'Can you start before October?',
    'Advisory slots open in September. Hands-on work starts in October, non-negotiably after the current contract ends.',
    'Do you do frontend?',
    'Enough React to be dangerous, not enough to sell it. I pair well with someone who does it for a living.',
    'On site or remote?',
    'Remote, mostly. One day a week on site if it is in the country — the whiteboard still earns its keep.',
  ], { background: PANEL, color: BONE, radius: 10 });

  const contact = b.container(root, { background: INK, padding: ['48', '48', '32', '48'], width: '100%', anchor: 'contact' }, 'Contact');
  const contactSplit = b.columns(contact, { count: '2', gap: '40', ratio: '3:2', stack: 'yes' });
  const contactCopy = b.container(contactSplit, { background: TRANSPARENT, width: '100%', justifyContent: 'center' }, 'Contact copy');
  b.heading(contactCopy, 'Tell me what is broken', { fontSize: '30', color: BONE });
  b.text(contactCopy, 'One honest paragraph beats a polished brief. Replies within a day.', {
    fontSize: '15', color: MUTED, margin: ['12', '0', '16', '0'],
  });
  b.list(contactCopy, [
    'What is broken, in one paragraph',
    'The deadline, honestly',
    'Where the repo lives — later is fine',
  ], { color: MUTED, fontSize: '15' });
  b.form(contactSplit, {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Email', type: 'email', placeholder: 'you@company.com', required: true },
      { label: 'What is broken', type: 'textarea', placeholder: 'One honest paragraph' },
    ],
    submitText: 'Send', successMessage: 'Got it. I reply within a day.',
    accent: CYAN, background: PANEL, color: BONE,
  });

  const close = b.container(root, { background: INK, padding: ['0', '48', '72', '48'], width: '100%' }, 'Close');
  b.ctaBanner(close, {
    title: 'Looking for someone?',
    text: 'Available for contract work from October. Advisory sooner. Tell me what is broken.',
    cta: 'Email me', href: 'mailto:hi@omer.dev',
    background: CYAN, color: INK, buttonBackground: INK, buttonColor: CYAN,
  });

  b.modernSuite(root, { mode: 'content', background: INK, panel: PANEL, ink: BONE, accent: CYAN });
  b.footer(root, {
    brand: 'omer.dev',
    note: 'Backend and infrastructure. Open to contract work.',
    socials: ['GitHub', 'https://github.com/', 'LinkedIn', 'https://linkedin.com/'],
    background: PANEL, ink: BONE, muted: MUTED,
  });

  return { name: 'Developer Portfolio — omer.dev', category: 'Portfolio', thumb: P.developer.terminal(600), map: b.map };
}
