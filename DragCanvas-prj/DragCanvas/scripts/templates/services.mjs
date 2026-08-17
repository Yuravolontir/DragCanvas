import { createBuilder, px, rgba, WHITE } from './_builder.mjs';

/**
 * Local services — a trade that lives on trust and a quick quote.
 *
 * The whole page leads to one form. Everything above it exists to make sending
 * that form feel safe: the work shown, the price named, the reviews real.
 */
export default function services() {
  const b = createBuilder();
  const PAPER = rgba(250, 250, 249);
  const PANEL = rgba(240, 240, 238);
  const INK = rgba(28, 30, 30);
  const AMBER = rgba(214, 138, 30);
  const MUTED = rgba(104, 108, 108);

  const root = b.root({ background: PAPER, width: '100%' });
  b.navbar(root, 'Northside Joinery', [
    { text: 'Work', href: '#work' },
    { text: 'Prices', href: '#prices' },
    { text: 'Quote', href: '#quote' },
  ], { variant: 'light', textColor: INK });

  const hero = b.container(root, { background: PAPER, padding: ['64', '48', '40', '48'], width: '100%', backgroundImage: px(1571460, 1600), overlay: rgba(28, 30, 30, 0.66) }, 'Hero');
  const top = b.columns(hero, { count: '2', gap: '40', align: 'center' });
  const words = b.container(top, { background: PAPER, padding: ['0', '0', '0', '0'] }, 'Words');
  b.badge(words, 'Booking three weeks ahead', { background: PANEL, color: AMBER });
  b.heading(words, 'Fitted properly, first time', { level: '1', fontSize: '44', color: INK, margin: ['12', '0', '10', '0'] });
  b.text(words, 'Kitchens, wardrobes and stairs. One joiner, no subcontractors, and a written quote before anything is cut.', {
    fontSize: '17', color: MUTED,
  });
  b.button(words, 'Get a quote', { background: AMBER, color: WHITE, buttonStyle: 'full' });
  b.image(top, px(1571460, 900), { radius: 10, width: '100%' });

  const work = b.container(root, { background: PAPER, padding: ['32', '48', '40', '48'], width: '100%', anchor: 'work' }, 'Work');
  b.heading(work, 'Before and after', { fontSize: '30', color: INK });
  b.spacer(work, '20');
  const ba = b.columns(work, { count: '2', gap: '20' });
  for (const [label, img] of [['Before', px(276724, 800)], ['After', px(1080721, 800)]]) {
    const card = b.container(ba, { background: PANEL, padding: ['0', '0', '16', '0'], radius: 10 }, label);
    b.image(card, img, { radius: 10, width: '100%' });
    b.badge(card, label, { background: WHITE, color: INK });
  }

  const prices = b.container(root, { background: PANEL, padding: ['48', '48', '48', '48'], width: '100%', anchor: 'prices' }, 'Prices');
  b.heading(prices, 'What things cost', { fontSize: '30', color: INK });
  b.text(prices, 'Rough guides. The quote is fixed once I have seen the room.', {
    fontSize: '15', color: MUTED, margin: ['8', '0', '20', '0'],
  });
  b.list(prices, [
    'Fitted wardrobe — from ₪6,000',
    'Kitchen refit — from ₪22,000',
    'Staircase repair — from ₪3,500',
    'Call-out and measure — free',
  ], { color: INK, fontSize: '16' });
  b.divider(prices, { color: rgba(28, 30, 30, 0.15), spacing: '24' });
  b.testimonial(prices, {
    quote: 'Turned up when he said, finished when he said, and cleaned up after himself. Twice now.',
    author: 'Miri Golan', role: 'Ramat Gan',
    background: PAPER, color: INK, accent: rgba(255, 255, 255, 0.8),
  });

  const quote = b.container(root, { background: PAPER, padding: ['48', '48', '72', '48'], width: '100%', anchor: 'quote' }, 'Quote');
  b.heading(quote, 'Tell me about the job', { fontSize: '30', color: INK });
  b.spacer(quote, '18');
  b.form(quote, {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Phone', type: 'phone', placeholder: '05x', required: true },
      { label: 'What needs doing', type: 'textarea', placeholder: 'A sentence is enough' },
    ],
    submitText: 'Send', successMessage: 'Got it — I will call within a day.',
    accent: AMBER, background: PANEL,
  });

  return { name: 'Local Services — Northside Joinery', category: 'Business', thumb: px(1571460), map: b.map };
}
