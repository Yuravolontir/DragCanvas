import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

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

  const hero = b.container(root, { background: PAPER, padding: ['80', '48', '40', '48'], width: '100%', backgroundImage: px(3184338, 1600), overlay: rgba(20, 20, 22, 0.68) }, 'Hero');
  b.heading(hero, 'We make the difficult part look obvious', { level: '1', fontSize: '54', color: INK });
  b.text(hero, 'Brand and product design for companies that have outgrown their first look.', {
    fontSize: '19', color: MUTED, margin: ['14', '0', '28', '0'],
  });
  b.logoStrip(hero, [px(3184291, 200), px(3184338, 200), px(3184465, 200), px(3184418, 200), px(262978, 200)], { height: '28' });

  const work = b.container(root, { background: PAPER, padding: ['40', '48', '48', '48'], width: '100%', anchor: 'work' }, 'Work');
  b.heading(work, 'Recent work', { fontSize: '32', color: INK });
  b.spacer(work, '24');
  const cases = b.columns(work, { count: '2', gap: '24' });
  for (const [client, what, img] of [
    ['Kettle', 'A brand that survives being printed small', px(1779487, 800)],
    ['Fathom', 'Turning a dense product into three screens', px(3184291, 800)],
  ]) {
    const card = b.container(cases, { background: PANEL, padding: ['0', '0', '22', '0'], radius: 12 }, client);
    b.image(card, img, { radius: 12, width: '100%' });
    b.heading(card, client, { level: '3', fontSize: '20', color: INK, margin: ['16', '22', '4', '22'] });
    b.text(card, what, { fontSize: '15', color: MUTED, margin: ['0', '22', '0', '22'] });
  }

  const studio = b.container(root, { background: INK, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'studio' }, 'Studio');
  b.heading(studio, 'Six people, one room', { fontSize: '32', color: PAPER });
  b.spacer(studio, '20');
  b.stats(studio, ['11', 'years', '60+', 'projects', '6', 'people'], { accent: RED, color: rgba(180, 178, 182) });
  b.spacer(studio, '28');
  b.testimonial(studio, {
    quote: 'They asked better questions than our board did, and then answered them in pictures.',
    author: 'Ronit Adler', role: 'CEO, Kettle',
    background: rgba(32, 32, 35), color: PAPER, accent: RED,
  });

  const brief = b.container(root, { background: PAPER, padding: ['56', '48', '72', '48'], width: '100%', anchor: 'brief' }, 'Brief');
  b.heading(brief, 'Send us a brief', { fontSize: '30', color: INK });
  b.text(brief, 'A paragraph is plenty. We will tell you within a week whether we are the right studio.', {
    fontSize: '16', color: MUTED, margin: ['10', '0', '20', '0'],
  });
  b.form(brief, { submitText: 'Send the brief', accent: RED, background: PANEL });

  return { name: 'Design Agency — FIELD', category: 'Business', thumb: px(3184338), map: b.map };
}
