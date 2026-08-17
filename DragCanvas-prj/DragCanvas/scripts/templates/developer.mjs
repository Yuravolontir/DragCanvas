import { createBuilder, rgba, WHITE } from './_builder.mjs';
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
  b.heading(hero, 'I build the boring parts properly', { level: '1', fontSize: '48', color: BONE });
  b.text(hero, 'Backend and infrastructure, mostly Node and Postgres. Ten years, four companies, one very long migration.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82), margin: ['14', '0', '0', '0'],
  });
  b.spacer(hero, '24');
  b.socialLinks(hero, ['GitHub', 'https://github.com/', 'LinkedIn', 'https://linkedin.com/', 'Email', 'mailto:hi@omer.dev'], {
    background: rgba(255, 255, 255, 0.07), color: BONE,
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

  const stack = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'stack' }, 'Stack');
  const split = b.columns(stack, { count: '2', gap: '40' });
  const know = b.container(split, { background: PANEL, padding: ['0', '0', '0', '0'] }, 'Know');
  b.heading(know, 'What I reach for', { fontSize: '26', color: BONE });
  b.list(know, ['Node, TypeScript, Postgres', 'Terraform and too much YAML', 'Playwright, because it catches the real bugs'], {
    color: MUTED, fontSize: '16',
  });
  const learning = b.container(split, { background: PANEL, padding: ['0', '0', '0', '0'] }, 'Learning');
  b.heading(learning, 'What I am learning', { fontSize: '26', color: BONE });
  b.list(learning, ['Rust, slowly and badly', 'How to write a design document nobody dreads'], {
    color: MUTED, fontSize: '16',
  });

  const notes = b.container(root, { background: INK, padding: ['56', '48', '56', '48'], width: '100%' }, 'Work notes');
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

  const contact = b.container(root, { background: INK, padding: ['48', '48', '72', '48'], width: '100%', anchor: 'contact' }, 'Contact');
  b.ctaBanner(contact, {
    title: 'Looking for someone?',
    text: 'Available for contract work from October. Tell me what is broken.',
    cta: 'Email me', href: 'mailto:hi@omer.dev',
    background: CYAN, color: INK, buttonBackground: INK, buttonColor: CYAN,
  });

  b.footer(root, {
    brand: 'omer.dev',
    note: 'Backend and infrastructure. Open to contract work.',
    socials: ['GitHub', 'https://github.com/', 'LinkedIn', 'https://linkedin.com/'],
    background: PANEL, ink: BONE, muted: MUTED,
  });

  return { name: 'Developer Portfolio — omer.dev', category: 'Portfolio', thumb: P.developer.terminal(600), map: b.map };
}
