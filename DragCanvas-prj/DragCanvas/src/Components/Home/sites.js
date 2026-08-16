/**
 * The example sites the hero builds.
 *
 * Each one carries its own look - background, ink, accent, typeface, corner
 * radius - because that is what the product actually does: the brief decides
 * the design. Five layouts in one palette would say the opposite, that every
 * site comes out the same, which is the fear anyone evaluating a builder
 * already has.
 *
 * The photographs are real, from the Pexels account this project already uses
 * for generated pages, requested at 900px and lazily loaded so only the site
 * currently on screen costs anything.
 *
 * Written by hand for now. Generator fixtures replace the contents without
 * changing the shape: `POST /api/ai/generate` returns sections with headings,
 * copy and image URLs, which is exactly what a section is here.
 */

const photo = (id, width = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

export const SITES = [
  {
    id: 'bakery',
    prompt: 'a bakery in tel aviv, warm tones',
    url: 'lehem.dragcanvas.app',
    theme: {
      bg: '#fbf3e9',
      panel: '#f3e6d6',
      fg: '#2a1d13',
      muted: '#6d5a45',
      accent: '#a44a22',
      font: 'Georgia, "Times New Roman", serif',
      radius: '4px',
    },
    sections: [
      { kind: 'nav', brand: 'Lehem', links: ['Bread', 'Orders', 'Visit'] },
      {
        kind: 'hero',
        title: 'Out of the oven at six',
        text: 'Sourdough, challah and rye, baked overnight on Yehuda Halevi and sold until they are gone.',
        cta: 'Order for tomorrow',
        image: photo(8633662),
      },
      {
        kind: 'cards',
        items: [
          { title: 'Sourdough', text: 'Two days of fermentation, baked dark.' },
          { title: 'Challah', text: 'Fridays only, ordered by Thursday noon.' },
          { title: 'Rye', text: 'Dense, sour, keeps all week.' },
        ],
      },
      { kind: 'gallery', images: [photo(35993723, 600), photo(10202985, 600)] },
      { kind: 'footer', text: 'Yehuda Halevi 21, Tel Aviv · 06:00 to sold out' },
    ],
  },

  {
    id: 'studio',
    prompt: 'a photographer portfolio, dark and minimal',
    url: 'studio-noor.dragcanvas.app',
    theme: {
      bg: '#0d0d0f',
      panel: '#161619',
      fg: '#f2f0ee',
      muted: '#8b8a90',
      accent: '#e4c88a',
      font: '"Helvetica Neue", Inter, system-ui, sans-serif',
      radius: '0px',
    },
    sections: [
      { kind: 'nav', brand: 'NOOR', links: ['Work', 'Studio', 'Contact'] },
      {
        kind: 'hero',
        title: 'Portraits, mostly',
        text: 'Studio and location work for editorial and brands. Currently booking for spring.',
        cta: 'See the work',
        image: photo(29057425),
      },
      { kind: 'gallery', images: [photo(37233404, 600), photo(16666883, 600)] },
      {
        kind: 'cards',
        items: [
          { title: 'Editorial', text: 'Half and full day rates.' },
          { title: 'Brand', text: 'Campaign and lookbook.' },
          { title: 'Personal', text: 'One hour, twenty frames.' },
        ],
      },
      { kind: 'footer', text: 'Booking · hello@studionoor.com' },
    ],
  },

  {
    id: 'gym',
    prompt: 'a gym with a class timetable',
    url: 'ironworks.dragcanvas.app',
    theme: {
      bg: '#101211',
      panel: '#191d1a',
      fg: '#f4f6f2',
      muted: '#8e968a',
      accent: '#c4f24b',
      font: '"Arial Black", Impact, system-ui, sans-serif',
      radius: '2px',
    },
    sections: [
      { kind: 'nav', brand: 'IRONWORKS', links: ['Classes', 'Coaches', 'Join'] },
      {
        kind: 'hero',
        title: 'Show up. Lift. Leave.',
        text: 'Barbell club and conditioning classes, five in the morning to ten at night.',
        cta: 'Book a class',
        image: photo(6628962),
      },
      {
        kind: 'agenda',
        items: [
          { time: '06:00', title: 'Strength — barbell fundamentals' },
          { time: '12:30', title: 'Conditioning — thirty minutes' },
          { time: '18:00', title: 'Olympic lifting — coached' },
        ],
      },
      { kind: 'gallery', images: [photo(4464780, 600), photo(32610333, 600)] },
      { kind: 'footer', text: 'No contracts · First class free' },
    ],
  },

  {
    id: 'summit',
    prompt: 'a conference page with a schedule and speakers',
    url: 'summit.dragcanvas.app',
    theme: {
      bg: '#0f1b34',
      panel: '#16264a',
      fg: '#eef3fb',
      muted: '#93a7c8',
      accent: '#ffc247',
      font: 'Inter, "Segoe UI", system-ui, sans-serif',
      radius: '10px',
    },
    sections: [
      { kind: 'nav', brand: 'Interface 26', links: ['Programme', 'Speakers', 'Tickets'] },
      {
        kind: 'hero',
        title: 'Two days on how software feels',
        text: 'Fourteen talks on interface, craft and the people who ship it. Haifa, 12 and 13 November.',
        cta: 'Get a ticket',
        image: photo(9275222),
      },
      {
        kind: 'agenda',
        items: [
          { time: '09:30', title: 'Opening — what we mean by craft' },
          { time: '11:00', title: 'Designing for the second glance' },
          { time: '14:00', title: 'Shipping without a design team' },
        ],
      },
      {
        kind: 'cards',
        items: [
          { title: 'Early', text: '₪240 until August.' },
          { title: 'Standard', text: '₪380 from September.' },
          { title: 'Student', text: '₪90 with an ID.' },
        ],
      },
      { kind: 'footer', text: 'Haifa · 12–13 November 2026' },
    ],
  },

  {
    id: 'clay',
    prompt: 'a small shop for handmade ceramics',
    url: 'clay-and-co.dragcanvas.app',
    theme: {
      bg: '#f6f2ea',
      panel: '#eae2d4',
      fg: '#3a352c',
      muted: '#6b6355',
      accent: '#6f7f5c',
      font: '"Iowan Old Style", Georgia, serif',
      radius: '18px',
    },
    sections: [
      { kind: 'nav', brand: 'Clay & Co', links: ['Shop', 'Workshops', 'About'] },
      {
        kind: 'hero',
        title: 'Made slowly, by two people',
        text: 'Tableware thrown and glazed in a small studio. Every batch is a little different, which is rather the point.',
        cta: 'Shop the batch',
        image: photo(34004100),
      },
      { kind: 'gallery', images: [photo(8063833, 600), photo(6693557, 600)] },
      {
        kind: 'cards',
        items: [
          { title: 'Bowls', text: 'Four sizes, stacked or single.' },
          { title: 'Mugs', text: 'Glazed in six colours.' },
          { title: 'Workshops', text: 'Saturdays, six seats.' },
        ],
      },
      { kind: 'footer', text: 'Studio open Thursdays and Saturdays' },
    ],
  },
];

export const DEFAULT_SITE = SITES[0];
