import { createBuilder, rgba, WHITE } from './_builder.mjs';
import { PHOTOS as P } from './_photos.mjs';

/** Coffee roastery — a subscription, and the story of where the beans came from. */
export default function coffee() {
  const b = createBuilder();
  const PAPER = rgba(249, 245, 240);
  const PANEL = rgba(238, 228, 216);
  const INK = rgba(45, 32, 24);
  const RUST = rgba(178, 92, 48);
  const MUTED = rgba(116, 99, 84);

  const root = b.root({ background: PAPER, width: '100%' });
  b.navbar(root, 'Harbour Roasters', [
    { text: 'Subscribe', href: '#subscribe' },
    { text: 'Origins', href: '#origins' },
    { text: 'Visit', href: '#visit' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: PAPER, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: P.coffee.counter(1600), overlay: rgba(45, 32, 24, 0.62) }, 'Hero');
  b.heading(hero, 'Roasted Tuesday, with you Thursday', { level: '1', fontSize: '46', color: PAPER });
  b.text(hero, 'One roastery, four farms, and a delivery that arrives before the last bag runs out.', {
    fontSize: '17', color: rgba(255, 255, 255, 0.82), margin: ['12', '0', '24', '0'],
  });
  b.button(hero, 'Start a subscription', { background: RUST, color: WHITE, buttonStyle: 'full' });

  const sub = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'subscribe', alignItems: 'center' }, 'Subscribe');
  b.heading(sub, 'How much coffee do you drink?', { fontSize: '30', textAlign: 'center', color: INK });
  b.spacer(sub, '24');
  b.pricing(sub, [
    'A bag', '₪64', 'every month', 'One bag', '250g; Free delivery; Change or pause any time',
    'Two bags', '₪118', 'every month', 'Two bags', '500g; Free delivery; Pick your roast',
    'Office', '₪420', 'every month', 'Talk to us', '2kg; Weekly delivery; Grinder on loan',
  ], { featured: 2, accent: RUST, background: PAPER, color: INK });

  const orig = b.container(root, { background: PAPER, padding: ['48', '48', '32', '48'], width: '100%', anchor: 'origins' }, 'Origins');
  b.heading(orig, 'Where it comes from', { fontSize: '30', color: INK });
  b.spacer(orig, '20');
  b.timeline(orig, [
    'Jan', 'Harvest', 'Picked by hand at Finca La Esperanza, 1,600 metres.',
    'Mar', 'Shipped', 'Six weeks at sea, which is slower and better than flying it.',
    'Apr', 'Roasted', 'Small batches, Tuesdays, in a drum older than the shop.',
  ], { accent: RUST, color: INK });
  b.spacer(orig, '28');
  b.carousel(orig, {
    width: '704px', height: '400px', accent: RUST,
    src1: P.coffee.bar(1200), heading1: 'The bar', label1: 'Visit', p1: 'Espresso, filter and the day’s roast at the long counter.',
    src2: P.coffee.shelves(1200), heading2: 'Four farms', label2: 'Origins', p2: 'Every bag names the farm, harvest and roast date.',
    src3: P.coffee.table(1200), heading3: 'Stay a while', label3: 'Harbour', p3: 'A quiet table, a window, and coffee made without hurry.',
  }, 'Roastery gallery');
  b.divider(orig, { color: rgba(45, 32, 24, 0.15), spacing: '28' });
  b.quote(orig, 'The only subscription I have never once thought about cancelling.', {
    attribution: 'A subscriber, three years in', fontSize: '19', color: INK, accent: RUST,
  });

  const visit = b.container(root, { background: PAPER, padding: ['24', '48', '64', '48'], width: '100%', anchor: 'visit' }, 'Visit');
  b.heading(visit, 'The shop', { fontSize: '26', color: INK });
  b.list(visit, ['Weekdays 07:00 to 17:00', 'Saturday 08:00 to 14:00', 'Cupping every first Friday'], {
    color: MUTED, fontSize: '16',
  });
  b.spacer(visit, '16');
  b.map_(visit, { lat: 32.0553, lng: 34.7595, zoom: 15, label: 'Harbour Roasters' });

  b.footer(root, {
    brand: 'Harbour Roastery',
    note: 'Roasted on Tuesdays, shipped on Wednesdays.',
    socials: ['Instagram', 'https://instagram.com/', 'Email', 'mailto:hello@harbour.coffee'],
    background: INK, ink: PAPER, muted: PANEL,
  });

  return { name: 'Coffee Roastery — Harbour', category: 'Business', thumb: P.coffee.pour(600), map: b.map };
}
