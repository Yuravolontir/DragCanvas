import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

/**
 * Creative Portfolio — Mara Kim (replaces template 13)
 *
 * The work is the content, so the page gets out of its way: near-black, one
 * accent, very little copy. The old version had thirty-four Texts, which is a
 * portfolio that talks more than it shows.
 */
export default function portfolio() {
  const b = createBuilder();
  const INK = rgba(13, 13, 15);
  const PANEL = rgba(22, 22, 25);
  const BONE = rgba(242, 240, 238);
  const GOLD = rgba(228, 200, 138);
  const MUTED = rgba(139, 138, 144);

  const root = b.root({ background: INK, width: '100%' });

  b.navbar(root, 'MARA KIM', [
    { text: 'Work', href: '#work' },
    { text: 'About', href: '#about' },
    { text: 'Contact', href: '#contact' },
  ], { variant: 'dark' });

  const hero = b.container(root, { background: INK, padding: ['96', '48', '56', '48'], width: '100%' }, 'Hero');
  b.heading(hero, 'Portraits, mostly', { level: '1', fontSize: '58', fontWeight: '700', color: BONE });
  b.text(hero, 'Studio and location work for editorial and brands. Currently booking for spring.', {
    fontSize: '18', color: MUTED, margin: ['14', '0', '0', '0'],
  });

  const work = b.container(root, { background: INK, padding: ['24', '48', '48', '48'], width: '100%', anchor: 'work' }, 'Work');
  const grid = b.columns(work, { count: '2', gap: '20' });
  for (const id of [29057425, 37233404, 16666883, 1779487]) {
    b.image(grid, { src: px(id, 900), radius: 0, width: '100%' });
  }

  const said = b.container(root, { background: INK, padding: ['32', '48', '48', '48'], width: '100%' }, 'Said');
  b.quote(said, 'She photographs people the way they hope they look on a good day, and somehow it is still them.',
    { attribution: 'Aperture Quarterly', fontSize: '24', color: BONE, accent: GOLD });

  const about = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'about' }, 'About');
  const split = b.columns(about, { count: '2', gap: '40' });
  const left = b.container(split, { background: PANEL, padding: ['0', '0', '0', '0'] }, 'Bio');
  b.heading(left, 'Ten years, mostly indoors', { fontSize: '30', color: BONE });
  b.text(left, 'Trained as a painter, which is why the light takes so long and the sitting is short. Based in Tel Aviv, works anywhere with a plug.', {
    fontSize: '16', color: MUTED, margin: ['14', '0', '0', '0'],
  });
  const right = b.container(split, { background: PANEL, padding: ['0', '0', '0', '0'] }, 'Services');
  b.list(right, ['Editorial — half and full day', 'Brand and campaign', 'Personal — one hour, twenty frames'], {
    color: MUTED, fontSize: '16',
  });

  const contact = b.container(root, { background: INK, padding: ['56', '48', '72', '48'], width: '100%', anchor: 'contact' }, 'Contact');
  b.heading(contact, 'Get in touch', { fontSize: '30', color: BONE });
  b.spacer(contact, '20');
  b.form(contact, { submitText: 'Send', accent: GOLD, background: PANEL });
  b.spacer(contact, '20');
  b.socialLinks(contact, ['Instagram', 'https://instagram.com/', 'Behance', 'https://behance.net/'], {
    background: rgba(255, 255, 255, 0.08), color: BONE,
  });

  return { id: 13, name: 'Creative Portfolio — Mara Kim', category: 'Portfolio', thumb: px(1779487), map: b.map };
}
