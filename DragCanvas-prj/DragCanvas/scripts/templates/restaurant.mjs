import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

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

  b.navbar(root, 'Casa Oliva', [
    { text: 'Menu', href: '#menu' },
    { text: 'Hours', href: '#hours' },
    { text: 'Find us', href: '#find-us' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: CREAM, padding: ['64', '48', '48', '48'], width: '100%', backgroundImage: px(262978, 1600), overlay: rgba(42, 29, 19, 0.6) }, 'Hero');
  const top = b.columns(hero, { count: '2', gap: '40', align: 'center' });
  const words = b.container(top, { background: CREAM, padding: ['0', '0', '0', '0'] }, 'Words');
  b.badge(words, 'Open for dinner', { background: PANEL, color: TERRA });
  b.heading(words, 'Slow food, small room', { level: '1', fontSize: '46', color: INK, margin: ['12', '0', '10', '0'] });
  b.text(words, 'Twenty-four covers, one sitting a night, and whatever the market had that morning.', {
    fontSize: '17', color: MUTED,
  });
  b.button(words, 'Book a table', { background: TERRA, color: WHITE, buttonStyle: 'full' });
  b.image(top, px(262978, 900), { radius: 8, width: '100%' });

  const menu = b.container(root, { background: PANEL, padding: ['56', '48', '56', '48'], width: '100%', anchor: 'menu' }, 'Menu');
  b.heading(menu, 'This week', { fontSize: '32', color: INK });
  b.spacer(menu, '24');
  const dishes = b.columns(menu, { count: '3', gap: '24' });
  for (const [course, items] of [
    ['To start', ['Bread, oil, salt', 'Anchovy and butter', 'Tomato, done simply']],
    ['Mains', ['Lamb, slowly', 'Sea bream, whole', 'Aubergine, smoked']],
    ['After', ['Olive oil cake', 'Figs and cream', 'Coffee and something']],
  ]) {
    const col = b.container(dishes, { background: CREAM, padding: ['24', '22', '24', '22'], radius: 8 }, course);
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

  const find = b.container(root, { background: CREAM, padding: ['24', '48', '64', '48'], width: '100%', anchor: 'find-us' }, 'Find us');
  b.heading(find, 'Yehuda Halevi 21', { fontSize: '28', color: INK });
  b.spacer(find, '16');
  b.map_(find, { lat: 32.0629, lng: 34.7745, zoom: 15, label: 'Casa Oliva' });

  return { id: 14, name: 'Restaurant — Casa Oliva', category: 'Business', thumb: px(262978), map: b.map };
}
