/**
 * Generate 5 professional templates as Craft.js flat node maps
 * and insert them into TBTemplates (redesign-templates change).
 *
 * Run from DragCanvas-prj/DragCanvas:  node scripts/generate-templates.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- helpers ----------

const px = (id, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const rgba = (r, g, b, a = 1) => ({ r, g, b, a });

const WHITE = rgba(255, 255, 255);

function createBuilder() {
  const map = {};
  let counter = 0;
  const uid = (prefix) => `${prefix}${String(++counter).padStart(2, '0')}`;

  const baseContainer = {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    fillSpace: 'no',
    padding: ['0', '0', '0', '0'],
    margin: ['0', '0', '0', '0'],
    background: rgba(255, 255, 255),
    color: rgba(0, 0, 0),
    shadow: 0,
    radius: 0,
    width: '100%',
    height: 'auto',
  };

  const root = (props, label = 'App') => {
    map.ROOT = {
      type: { resolvedName: 'Container' },
      isCanvas: true,
      props: { ...baseContainer, width: '800px', ...props },
      displayName: 'Container',
      custom: { displayName: label },
      hidden: false,
      nodes: [],
      linkedNodes: {},
    };
    return 'ROOT';
  };

  const node = (resolvedName, parent, props, { canvas = false, label } = {}) => {
    const id = uid(resolvedName.toLowerCase().slice(0, 4));
    map[id] = {
      type: { resolvedName },
      isCanvas: canvas,
      props,
      displayName: resolvedName,
      custom: { displayName: label || resolvedName },
      parent,
      hidden: false,
      nodes: [],
      linkedNodes: {},
    };
    map[parent].nodes.push(id);
    return id;
  };

  const container = (parent, props = {}, label = 'Container') =>
    node('Container', parent, { ...baseContainer, ...props }, { canvas: true, label });

  const text = (parent, str, props = {}, label = 'Text') =>
    node(
      'Text',
      parent,
      {
        fontSize: '15',
        textAlign: 'left',
        fontWeight: '500',
        color: rgba(92, 90, 90),
        margin: ['0', '0', '0', '0'],
        shadow: 0,
        text: str,
        ...props,
      },
      { label }
    );

  const button = (parent, str, props = {}, label = 'Button') =>
    node(
      'Button',
      parent,
      {
        background: rgba(255, 255, 255, 0.5),
        color: rgba(92, 90, 90),
        buttonStyle: 'full',
        text: str,
        margin: ['5', '0', '5', '0'],
        textComponent: {
          fontSize: '15',
          textAlign: 'center',
          fontWeight: '600',
          color: rgba(92, 90, 90),
          margin: ['0', '0', '0', '0'],
          shadow: 0,
          text: str,
        },
        ...props,
      },
      { label }
    );

  const image = (parent, src, props = {}, label = 'Image') =>
    node('Image', parent, { src, radius: 0, width: 'auto', height: 'auto', maxWidth: '100%', ...props }, { label });

  const video = (parent, props = {}, label = 'Video') =>
    node('Video', parent, { sourceType: 'file', videoId: '', videoUrl: '', text: '', ...props }, { label });

  const link = (parent, str, href, props = {}, label = 'Link') =>
    node('Link', parent, { href, text: str, width: 'auto', height: 'auto', maxWidth: '100%', ...props }, { label });

  const carousel = (parent, props = {}, label = 'Carousel') =>
    node(
      'Carousel',
      parent,
      {
        width: '600px',
        height: '400px',
        src1: '', src2: '', src3: '',
        heading1: '', heading2: '', heading3: '',
        label1: '', label2: '', label3: '',
        p1: '', p2: '', p3: '',
        ...props,
      },
      { label }
    );

  return { map, root, node, container, text, button, image, video, link, carousel };
}

// Common blocks
function navLinks(b, parent, items, colorNote) {
  for (const [t, href] of items) {
    const box = b.container(parent, { width: 'auto', padding: ['0', '0', '0', '24'] }, 'NavItem');
    b.link(box, t, href || '#');
  }
}

// ---------- 1. SaaS Landing — NovaFlow ----------

function saasLanding() {
  const b = createBuilder();
  const BG = rgba(2, 6, 23);
  const CARD = rgba(30, 41, 59);
  const INDIGO = rgba(99, 102, 241);
  const GRAY = rgba(148, 163, 184);
  const LIGHT = rgba(226, 232, 240);

  b.root({ background: BG, padding: ['0', '0', '0', '0'] });

  // Navbar
  const nav = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    background: BG, padding: ['24', '40', '24', '40'],
  }, 'Navbar');
  b.text(nav, 'NovaFlow', { fontSize: '20', fontWeight: '800', color: WHITE });
  const navRight = b.container(nav, { flexDirection: 'row', alignItems: 'center', width: 'auto', background: BG }, 'NavLinks');
  navLinks(b, navRight, [['Features'], ['Pricing'], ['Docs']]);

  // Hero
  const hero = b.container('ROOT', {
    alignItems: 'center', background: BG, padding: ['70', '60', '50', '60'],
  }, 'Hero');
  const badge = b.container(hero, {
    width: 'auto', background: rgba(99, 102, 241, 0.15), radius: 20, padding: ['6', '16', '6', '16'],
  }, 'Badge');
  b.text(badge, 'NEW — AI-powered automations', { fontSize: '13', fontWeight: '600', color: INDIGO, textAlign: 'center' });
  b.text(hero, 'Ship products **ten times faster**', {
    fontSize: '44', fontWeight: '800', color: WHITE, textAlign: 'center', margin: ['24', '0', '14', '0'],
  }, 'Headline');
  b.text(hero, 'NovaFlow unifies your roadmap, tasks and releases in one calm workspace — so your team ships, not juggles tools.', {
    fontSize: '18', fontWeight: '400', color: rgba(203, 213, 225), textAlign: 'center',
  }, 'Subtitle');
  const ctaRow = b.container(hero, {
    flexDirection: 'row', justifyContent: 'center', width: 'auto', background: BG, margin: ['30', '0', '0', '0'],
  }, 'CTARow');
  const cta1 = b.container(ctaRow, { width: '200px', background: BG, padding: ['0', '10', '0', '0'] }, 'BtnBox');
  b.button(cta1, 'Start free trial', { background: INDIGO, color: WHITE });
  const cta2 = b.container(ctaRow, { width: '180px', background: BG, padding: ['0', '0', '0', '10'] }, 'BtnBox');
  b.button(cta2, 'Watch demo', { buttonStyle: 'outline', background: INDIGO, color: LIGHT });

  // Logos strip
  const logos = b.container('ROOT', { alignItems: 'center', background: BG, padding: ['10', '40', '40', '40'] }, 'Logos');
  b.text(logos, 'TRUSTED BY TEAMS AT', { fontSize: '12', fontWeight: '700', color: rgba(100, 116, 139), textAlign: 'center' });
  b.text(logos, 'ACME · GLOBEX · INITECH · HOOLI · STARK', {
    fontSize: '16', fontWeight: '700', color: rgba(148, 163, 184), textAlign: 'center', margin: ['10', '0', '0', '0'],
  });

  // Product video
  const videoSec = b.container('ROOT', { background: BG, padding: ['0', '60', '40', '60'] }, 'ProductVideo');
  b.video(videoSec, {
    videoUrl: 'https://videos.pexels.com/video-files/3129957/3129957-hd_1280_720_25fps.mp4',
    text: 'See NovaFlow in action',
  });

  // Features
  const feat = b.container('ROOT', { alignItems: 'center', background: BG, padding: ['40', '60', '20', '60'] }, 'Features');
  b.text(feat, 'Everything your team needs', { fontSize: '32', fontWeight: '700', color: WHITE, textAlign: 'center' });
  b.text(feat, 'Powerful alone. Unstoppable together.', {
    fontSize: '16', color: GRAY, textAlign: 'center', margin: ['8', '0', '0', '0'],
  });
  const featRow = b.container(feat, {
    flexDirection: 'row', justifyContent: 'space-between', background: BG, margin: ['30', '0', '0', '0'],
  }, 'FeatureRow');
  const features = [
    ['⚡', 'Lightning fast', 'Instant search, optimistic UI and sub-second sync across your whole workspace.'],
    ['🔒', 'Secure by default', 'SOC 2 Type II, SSO/SAML and granular permissions on every plan.'],
    ['📊', 'Real-time analytics', 'Live dashboards that turn shipping data into decisions your team trusts.'],
  ];
  for (const [icon, title, desc] of features) {
    const card = b.container(featRow, {
      width: '31%', background: CARD, radius: 16, padding: ['26', '22', '26', '22'],
    }, 'FeatureCard');
    b.text(card, icon, { fontSize: '30', color: WHITE });
    b.text(card, title, { fontSize: '18', fontWeight: '700', color: WHITE, margin: ['12', '0', '8', '0'] });
    b.text(card, desc, { fontSize: '14', color: GRAY });
  }

  // Stats
  const stats = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', background: INDIGO,
    padding: ['40', '60', '40', '60'], margin: ['40', '0', '0', '0'],
  }, 'Stats');
  const statItems = [['99.9%', 'Uptime SLA'], ['12,000+', 'Teams onboard'], ['4.9 / 5', 'Average rating']];
  for (const [num, label] of statItems) {
    const col = b.container(stats, { width: '31%', alignItems: 'center', background: INDIGO }, 'Stat');
    b.text(col, num, { fontSize: '38', fontWeight: '800', color: WHITE, textAlign: 'center' });
    b.text(col, label, { fontSize: '14', color: rgba(224, 231, 255), textAlign: 'center', margin: ['6', '0', '0', '0'] });
  }

  // Testimonial
  const testi = b.container('ROOT', { alignItems: 'center', background: BG, padding: ['54', '80', '36', '80'] }, 'Testimonial');
  b.image(testi, px(774909, 400), { width: '84px', height: '84px', radius: 50 });
  b.text(testi, '"NovaFlow cut our release cycle from weeks to days. It is the first tool the whole company actually loves."', {
    fontSize: '20', color: LIGHT, textAlign: 'center', margin: ['20', '0', '12', '0'],
  });
  b.text(testi, 'Sarah Mitchell — VP Engineering, Acme', {
    fontSize: '14', fontWeight: '600', color: INDIGO, textAlign: 'center',
  });

  // CTA banner
  const ctaWrap = b.container('ROOT', { background: BG, padding: ['10', '60', '44', '60'] }, 'CTASection');
  const banner = b.container(ctaWrap, {
    alignItems: 'center', background: INDIGO, radius: 20, padding: ['44', '40', '44', '40'],
  }, 'CTABanner');
  b.text(banner, 'Ready to ship faster?', { fontSize: '30', fontWeight: '800', color: WHITE, textAlign: 'center' });
  b.text(banner, 'Free for teams up to 10. No credit card required.', {
    fontSize: '15', color: rgba(224, 231, 255), textAlign: 'center', margin: ['8', '0', '0', '0'],
  });
  const bannerBtn = b.container(banner, { width: '240px', background: INDIGO, margin: ['20', '0', '0', '0'] }, 'BtnBox');
  b.button(bannerBtn, 'Get started — free', { background: WHITE, color: rgba(49, 46, 129) });

  // Footer
  const footer = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    background: rgba(15, 23, 42), padding: ['26', '40', '26', '40'],
  }, 'Footer');
  b.text(footer, 'NovaFlow', { fontSize: '15', fontWeight: '700', color: WHITE });
  b.text(footer, '© 2026 NovaFlow Inc. All rights reserved.', { fontSize: '13', color: GRAY });

  return b.map;
}

// ---------- 2. Creative Portfolio — Mara Kim ----------

function creativePortfolio() {
  const b = createBuilder();
  const BG = rgba(10, 10, 10);
  const CARD = rgba(23, 23, 23);
  const LIME = rgba(163, 230, 53);
  const GRAY = rgba(163, 163, 163);

  b.root({ background: BG, padding: ['0', '0', '0', '0'] });

  // Navbar
  const nav = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    background: BG, padding: ['28', '40', '28', '40'],
  }, 'Navbar');
  b.text(nav, 'MARA KIM ©', { fontSize: '16', fontWeight: '800', color: WHITE });
  const navRight = b.container(nav, { flexDirection: 'row', width: 'auto', background: BG }, 'NavLinks');
  navLinks(b, navRight, [['Work'], ['About'], ['Contact']]);

  // Hero — big type
  const hero = b.container('ROOT', { background: BG, padding: ['64', '40', '56', '40'] }, 'Hero');
  b.text(hero, 'VISUAL', { fontSize: '64', fontWeight: '800', color: WHITE });
  b.text(hero, 'DESIGNER —', { fontSize: '64', fontWeight: '800', color: LIME });
  b.text(hero, 'ART DIRECTOR', { fontSize: '64', fontWeight: '800', color: WHITE });
  b.text(hero, 'Berlin-based, worldwide-booked. I craft identities, editorial design and digital experiences for brands that refuse to be boring.', {
    fontSize: '17', color: GRAY, margin: ['24', '120', '0', '0'],
  }, 'Intro');
  const heroBtn = b.container(hero, { width: '200px', background: BG, margin: ['26', '0', '0', '0'] }, 'BtnBox');
  b.button(heroBtn, 'See my work', { buttonStyle: 'outline', background: LIME, color: LIME });

  // Skills strip
  const strip = b.container('ROOT', { alignItems: 'center', background: CARD, padding: ['16', '20', '16', '20'] }, 'SkillsStrip');
  b.text(strip, 'BRANDING · TYPOGRAPHY · MOTION · ILLUSTRATION · WEB', {
    fontSize: '13', fontWeight: '700', color: rgba(115, 115, 115), textAlign: 'center',
  });

  // About
  const about = b.container('ROOT', {
    flexDirection: 'row', alignItems: 'center', background: BG, padding: ['54', '40', '26', '40'],
  }, 'About');
  b.image(about, px(3778876, 800), { width: '280px', height: '340px', radius: 16 });
  const aboutCol = b.container(about, { width: '55%', background: BG, padding: ['0', '0', '0', '32'] }, 'AboutText');
  b.text(aboutCol, 'ABOUT', { fontSize: '13', fontWeight: '700', color: LIME });
  b.text(aboutCol, 'I turn bold ideas into unforgettable visuals.', {
    fontSize: '28', fontWeight: '800', color: WHITE, margin: ['10', '0', '12', '0'],
  });
  b.text(aboutCol, 'From first sketch to final artwork, I lead projects end-to-end: strategy, concept, design systems and launch. My clients range from indie labels to global brands.', {
    fontSize: '15', color: GRAY,
  });
  b.text(aboutCol, '10+ years · 120 projects · 14 design awards', {
    fontSize: '14', fontWeight: '600', color: WHITE, margin: ['16', '0', '0', '0'],
  });

  // Work grid
  const workHead = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    background: BG, padding: ['40', '40', '4', '40'],
  }, 'WorkHeading');
  b.text(workHead, 'SELECTED WORK', { fontSize: '24', fontWeight: '800', color: WHITE });
  b.text(workHead, '2019 — 2026', { fontSize: '14', color: GRAY });

  const works = [
    [px(1145720), 'Chromatic Bloom', 'Art direction'],
    [px(196644), 'Studio Norr', 'Brand identity'],
    [px(1029757), 'Paper & Ink', 'Editorial design'],
    [px(1779487), 'Femme Digitale', 'Web design'],
  ];
  for (let row = 0; row < 2; row++) {
    const grid = b.container('ROOT', {
      flexDirection: 'row', justifyContent: 'space-between', background: BG, padding: ['16', '40', '0', '40'],
    }, 'WorkRow');
    for (let col = 0; col < 2; col++) {
      const [src, title, cat] = works[row * 2 + col];
      const cell = b.container(grid, { width: '48%', background: BG }, 'WorkCard');
      b.image(cell, src, { width: '100%', height: '250px', radius: 12 });
      b.text(cell, title, { fontSize: '16', fontWeight: '700', color: WHITE, margin: ['12', '0', '2', '0'] });
      b.text(cell, cat, { fontSize: '13', color: LIME });
    }
  }

  // Services
  const servRow = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', background: BG, padding: ['54', '40', '20', '40'],
  }, 'Services');
  const services = [
    ['01', 'Brand Identity', 'Logos, systems and guidelines that make brands instantly recognizable.'],
    ['02', 'Art Direction', 'Campaigns, shoots and visual worlds with a strong point of view.'],
    ['03', 'Digital Design', 'Websites and products where craft meets conversion.'],
  ];
  for (const [num, title, desc] of services) {
    const col = b.container(servRow, { width: '31%', background: BG }, 'Service');
    b.text(col, num, { fontSize: '13', fontWeight: '700', color: LIME });
    b.text(col, title, { fontSize: '19', fontWeight: '700', color: WHITE, margin: ['8', '0', '6', '0'] });
    b.text(col, desc, { fontSize: '14', color: GRAY });
  }

  // Testimonial
  const testiWrap = b.container('ROOT', { background: BG, padding: ['20', '40', '30', '40'] }, 'TestimonialSection');
  const testi = b.container(testiWrap, { background: CARD, radius: 16, padding: ['34', '36', '34', '36'] }, 'Testimonial');
  b.text(testi, '"Mara sees what a brand can become long before anyone else does. Working with her doubled our recognition in a year."', {
    fontSize: '21', fontWeight: '600', color: WHITE,
  });
  b.text(testi, '— Jonas Berg, CEO Studio Norr', { fontSize: '14', color: LIME, margin: ['14', '0', '0', '0'] });

  // Contact footer
  const contact = b.container('ROOT', { alignItems: 'center', background: LIME, padding: ['54', '40', '48', '40'] }, 'Contact');
  b.text(contact, "LET'S WORK TOGETHER", { fontSize: '36', fontWeight: '800', color: BG, textAlign: 'center' });
  b.text(contact, 'mara@marakim.studio', {
    fontSize: '17', fontWeight: '600', color: BG, textAlign: 'center', margin: ['10', '0', '18', '0'],
  });
  const contactBtn = b.container(contact, { width: '220px', background: LIME }, 'BtnBox');
  b.button(contactBtn, 'Get in touch', { background: BG, color: LIME });
  b.text(contact, '© 2026 Mara Kim — Berlin', {
    fontSize: '12', color: rgba(10, 10, 10, 0.6), textAlign: 'center', margin: ['20', '0', '0', '0'],
  });

  return b.map;
}

// ---------- 3. Restaurant — Casa Oliva ----------

function restaurant() {
  const b = createBuilder();
  const CREAM = rgba(255, 248, 240);
  const BORDEAUX = rgba(127, 29, 29);
  const GOLD = rgba(180, 83, 9);
  const BROWN = rgba(68, 64, 60);
  const DARK = rgba(28, 25, 23);

  b.root({ background: CREAM, padding: ['0', '0', '0', '0'] });

  // Navbar
  const nav = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    background: CREAM, padding: ['24', '40', '20', '40'],
  }, 'Navbar');
  b.text(nav, 'Casa Oliva', { fontSize: '22', fontWeight: '800', color: BORDEAUX });
  const navRight = b.container(nav, { flexDirection: 'row', width: 'auto', background: CREAM }, 'NavLinks');
  navLinks(b, navRight, [['Menu'], ['Story'], ['Visit']]);

  // Hero
  const heroImg = b.container('ROOT', { background: CREAM, padding: ['8', '40', '0', '40'] }, 'HeroImage');
  b.image(heroImg, px(262978, 1600), { width: '100%', height: '360px', radius: 18 });
  const hero = b.container('ROOT', { alignItems: 'center', background: CREAM, padding: ['30', '60', '20', '60'] }, 'Hero');
  b.text(hero, 'Fine Italian dining, family style', {
    fontSize: '40', fontWeight: '800', color: BORDEAUX, textAlign: 'center',
  });
  b.text(hero, 'Handmade pasta, wood-fired pizza and natural wines — in the heart of the old town since 1987.', {
    fontSize: '17', color: BROWN, textAlign: 'center', margin: ['12', '0', '20', '0'],
  });
  const heroBtn = b.container(hero, { width: '220px', background: CREAM }, 'BtnBox');
  b.button(heroBtn, 'Reserve a table', { background: BORDEAUX, color: CREAM });

  // Story
  const story = b.container('ROOT', {
    flexDirection: 'row', alignItems: 'center', background: CREAM, padding: ['44', '40', '22', '40'],
  }, 'Story');
  const storyCol = b.container(story, { width: '52%', background: CREAM, padding: ['0', '28', '0', '0'] }, 'StoryText');
  b.text(storyCol, 'OUR STORY', { fontSize: '13', fontWeight: '700', color: GOLD });
  b.text(storyCol, 'Three generations at one stove', {
    fontSize: '28', fontWeight: '800', color: BORDEAUX, margin: ['10', '0', '12', '0'],
  });
  b.text(storyCol, 'Nonna Lucia opened Casa Oliva with one table and six chairs. Today her grandchildren roll the same tagliatelle by hand every morning, with flour from the same mill in Tuscany.', {
    fontSize: '15', color: BROWN,
  });
  b.image(story, px(941861, 900), { width: '320px', height: '300px', radius: 16 });

  // Menu
  const menu = b.container('ROOT', { alignItems: 'center', background: CREAM, padding: ['36', '40', '10', '40'] }, 'Menu');
  b.text(menu, 'FROM THE MENU', { fontSize: '13', fontWeight: '700', color: GOLD, textAlign: 'center' });
  b.text(menu, 'Signature dishes', {
    fontSize: '30', fontWeight: '800', color: BORDEAUX, textAlign: 'center', margin: ['8', '0', '24', '0'],
  });
  const menuRow = b.container(menu, {
    flexDirection: 'row', justifyContent: 'space-between', background: CREAM,
  }, 'MenuRow');
  const dishes = [
    [px(1279330, 900), 'Tagliatelle al Tartufo', '€18', 'Hand-rolled pasta, black truffle, aged parmigiano.'],
    [px(1099680, 900), 'Pizza Margherita DOP', '€14', 'San Marzano tomatoes, buffalo mozzarella, basil.'],
    [px(376464, 900), 'Panna Cotta al Miele', '€9', 'Wildflower honey, roasted figs, almond crumble.'],
  ];
  for (const [src, name, price, desc] of dishes) {
    const card = b.container(menuRow, {
      width: '31%', background: rgba(255, 255, 255), radius: 16, padding: ['0', '0', '18', '0'], shadow: 10,
    }, 'DishCard');
    b.image(card, src, { width: '100%', height: '150px', radius: 12 });
    b.text(card, name, { fontSize: '17', fontWeight: '700', color: DARK, margin: ['14', '16', '4', '16'] });
    b.text(card, price, { fontSize: '15', fontWeight: '800', color: GOLD, margin: ['0', '16', '6', '16'] });
    b.text(card, desc, { fontSize: '13', color: rgba(87, 83, 78), margin: ['0', '16', '0', '16'] });
  }

  // Chef quote
  const quoteWrap = b.container('ROOT', { background: CREAM, padding: ['36', '40', '22', '40'] }, 'QuoteSection');
  const quote = b.container(quoteWrap, {
    alignItems: 'center', background: BORDEAUX, radius: 18, padding: ['40', '48', '40', '48'],
  }, 'ChefQuote');
  b.text(quote, '"Simple ingredients, treated with respect — that is the whole secret."', {
    fontSize: '21', fontWeight: '600', color: CREAM, textAlign: 'center',
  });
  b.text(quote, '— Nonna Lucia, Head Chef', {
    fontSize: '14', fontWeight: '700', color: rgba(253, 230, 138), textAlign: 'center', margin: ['14', '0', '0', '0'],
  });

  // Hours & location
  const visit = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', background: CREAM, padding: ['22', '40', '30', '40'],
  }, 'Visit');
  const hours = b.container(visit, { width: '48%', background: rgba(255, 255, 255), radius: 16, padding: ['26', '26', '26', '26'] }, 'Hours');
  b.text(hours, 'HOURS', { fontSize: '13', fontWeight: '700', color: GOLD });
  b.text(hours, 'Tuesday — Sunday', { fontSize: '18', fontWeight: '700', color: DARK, margin: ['10', '0', '6', '0'] });
  b.text(hours, 'Lunch 12:00 – 15:00 · Dinner 18:00 – 23:00', { fontSize: '14', color: BROWN });
  const loc = b.container(visit, { width: '48%', background: rgba(255, 255, 255), radius: 16, padding: ['26', '26', '26', '26'] }, 'Location');
  b.text(loc, 'FIND US', { fontSize: '13', fontWeight: '700', color: GOLD });
  b.text(loc, 'Via delle Rose 12, Firenze', { fontSize: '18', fontWeight: '700', color: DARK, margin: ['10', '0', '6', '0'] });
  b.link(loc, 'Get directions →', 'https://maps.google.com');

  // Footer
  const footer = b.container('ROOT', { alignItems: 'center', background: BORDEAUX, padding: ['22', '40', '22', '40'] }, 'Footer');
  b.text(footer, 'Casa Oliva · Est. 1987 · Firenze, Italia', { fontSize: '13', color: CREAM, textAlign: 'center' });

  return b.map;
}

// ---------- 4. Fitness / Coach — FORGE ----------

function fitness() {
  const b = createBuilder();
  const BG = rgba(24, 24, 27);
  const CARD = rgba(39, 39, 42);
  const ORANGE = rgba(249, 115, 22);
  const GRAY = rgba(161, 161, 170);

  b.root({ background: BG, padding: ['0', '0', '0', '0'] });

  // Navbar
  const nav = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    background: BG, padding: ['24', '40', '24', '40'],
  }, 'Navbar');
  b.text(nav, 'FORGE', { fontSize: '22', fontWeight: '800', color: WHITE });
  const navRight = b.container(nav, { flexDirection: 'row', alignItems: 'center', width: 'auto', background: BG }, 'NavLinks');
  navLinks(b, navRight, [['Programs'], ['Coach'], ['Pricing']]);

  // Hero video
  const heroVideo = b.container('ROOT', { background: BG, padding: ['0', '0', '0', '0'] }, 'HeroVideo');
  b.video(heroVideo, {
    videoUrl: 'https://videos.pexels.com/video-files/852421/852421-hd_1920_1080_30fps.mp4',
    text: 'TRAIN HARD. RECOVER SMART.',
  });
  const hero = b.container('ROOT', { alignItems: 'center', background: BG, padding: ['34', '60', '18', '60'] }, 'Hero');
  b.text(hero, 'STRONGER EVERY DAY', { fontSize: '44', fontWeight: '800', color: WHITE, textAlign: 'center' });
  b.text(hero, 'Personal coaching and science-based programs for real people with real schedules.', {
    fontSize: '17', color: GRAY, textAlign: 'center', margin: ['12', '0', '22', '0'],
  });
  const heroBtn = b.container(hero, { width: '260px', background: BG }, 'BtnBox');
  b.button(heroBtn, 'Start 7-day free trial', { background: ORANGE, color: WHITE });

  // Programs
  const prog = b.container('ROOT', { alignItems: 'center', background: BG, padding: ['34', '40', '8', '40'] }, 'Programs');
  b.text(prog, 'PROGRAMS', { fontSize: '13', fontWeight: '700', color: ORANGE, textAlign: 'center' });
  b.text(prog, 'Built for your goals', {
    fontSize: '30', fontWeight: '800', color: WHITE, textAlign: 'center', margin: ['8', '0', '24', '0'],
  });
  const progRow = b.container(prog, { flexDirection: 'row', justifyContent: 'space-between', background: BG }, 'ProgramRow');
  const programs = [
    ['🏋️', 'Strength', 'Progressive overload done right — squat, hinge, push, pull, carry.'],
    ['🔥', 'HIIT & Conditioning', 'Short, brutal, effective. Burn fat and build an engine in 30 minutes.'],
    ['🧘', 'Mobility & Recovery', 'Move better, sleep deeper, stay injury-free for the long run.'],
  ];
  for (const [icon, title, desc] of programs) {
    const card = b.container(progRow, { width: '31%', background: CARD, radius: 16, padding: ['24', '20', '24', '20'] }, 'ProgramCard');
    b.text(card, icon, { fontSize: '30', color: WHITE });
    b.text(card, title, { fontSize: '19', fontWeight: '700', color: WHITE, margin: ['10', '0', '8', '0'] });
    b.text(card, desc, { fontSize: '14', color: GRAY });
  }

  // Coach
  const coach = b.container('ROOT', {
    flexDirection: 'row', alignItems: 'center', background: BG, padding: ['44', '40', '22', '40'],
  }, 'Coach');
  b.image(coach, px(3837781, 800), { width: '300px', height: '340px', radius: 16 });
  const coachCol = b.container(coach, { width: '55%', background: BG, padding: ['0', '0', '0', '32'] }, 'CoachBio');
  b.text(coachCol, 'HEAD COACH', { fontSize: '13', fontWeight: '700', color: ORANGE });
  b.text(coachCol, 'Alex Torres', { fontSize: '30', fontWeight: '800', color: WHITE, margin: ['8', '0', '12', '0'] });
  b.text(coachCol, 'Former national-level sprinter turned strength coach. Alex has spent 12 years helping desk workers, parents and athletes get strong without living in the gym.', {
    fontSize: '15', color: GRAY,
  });
  b.text(coachCol, 'CSCS certified · 12 years coaching · 500+ athletes', {
    fontSize: '14', fontWeight: '600', color: WHITE, margin: ['14', '0', '0', '0'],
  });

  // Pricing
  const pricing = b.container('ROOT', { alignItems: 'center', background: BG, padding: ['34', '40', '10', '40'] }, 'Pricing');
  b.text(pricing, 'PRICING', { fontSize: '13', fontWeight: '700', color: ORANGE, textAlign: 'center' });
  b.text(pricing, 'Simple plans, no contracts', {
    fontSize: '30', fontWeight: '800', color: WHITE, textAlign: 'center', margin: ['8', '0', '24', '0'],
  });
  const priceRow = b.container(pricing, { flexDirection: 'row', justifyContent: 'space-between', background: BG }, 'PricingRow');
  const plans = [
    ['BASIC', '$29', 'Gym access · group classes', CARD, WHITE, GRAY, false],
    ['PRO', '$59', 'Everything in Basic + 2 PT sessions', ORANGE, rgba(24, 24, 27), rgba(69, 26, 3), true],
    ['ELITE', '$99', 'Unlimited PT · nutrition coaching', CARD, WHITE, GRAY, false],
  ];
  for (const [name, price, desc, cardBg, titleColor, descColor, highlight] of plans) {
    const card = b.container(priceRow, {
      width: '31%', alignItems: 'center', background: cardBg, radius: 16, padding: ['28', '18', '28', '18'],
    }, 'PlanCard');
    b.text(card, name, { fontSize: '14', fontWeight: '700', color: highlight ? rgba(24, 24, 27) : ORANGE, textAlign: 'center' });
    b.text(card, price, { fontSize: '38', fontWeight: '800', color: titleColor, textAlign: 'center', margin: ['8', '0', '2', '0'] });
    b.text(card, 'per month', { fontSize: '12', color: descColor, textAlign: 'center' });
    b.text(card, desc, { fontSize: '13', color: descColor, textAlign: 'center', margin: ['12', '0', '14', '0'] });
    b.button(card, highlight ? 'Most popular' : 'Choose plan',
      highlight
        ? { background: rgba(24, 24, 27), color: ORANGE }
        : { buttonStyle: 'outline', background: ORANGE, color: WHITE });
  }

  // Testimonial
  const testi = b.container('ROOT', { alignItems: 'center', background: BG, padding: ['44', '80', '30', '80'] }, 'Testimonial');
  b.image(testi, px(220453, 400), { width: '80px', height: '80px', radius: 50 });
  b.text(testi, '"Down 14 kg and deadlifting double bodyweight. FORGE changed how I train — and how I live."', {
    fontSize: '20', color: rgba(228, 228, 231), textAlign: 'center', margin: ['18', '0', '10', '0'],
  });
  b.text(testi, 'Marcus J. — member since 2024', { fontSize: '14', fontWeight: '600', color: ORANGE, textAlign: 'center' });

  // CTA footer
  const cta = b.container('ROOT', { alignItems: 'center', background: ORANGE, padding: ['46', '40', '40', '40'] }, 'CTAFooter');
  b.text(cta, 'YOUR FIRST WEEK IS FREE', { fontSize: '32', fontWeight: '800', color: rgba(24, 24, 27), textAlign: 'center' });
  const ctaBtn = b.container(cta, { width: '240px', background: ORANGE, margin: ['18', '0', '0', '0'] }, 'BtnBox');
  b.button(ctaBtn, 'Claim your pass', { background: rgba(24, 24, 27), color: ORANGE });
  b.text(cta, '© 2026 FORGE Athletics', {
    fontSize: '12', color: rgba(24, 24, 27, 0.7), textAlign: 'center', margin: ['18', '0', '0', '0'],
  });

  return b.map;
}

// ---------- 5. Travel Blog — Wanderlog ----------

function travelBlog() {
  const b = createBuilder();
  const SKY = rgba(14, 165, 233);
  const DARK = rgba(15, 23, 42);
  const GRAY = rgba(100, 116, 139);
  const LIGHTBG = rgba(224, 242, 254);

  b.root({ background: rgba(255, 255, 255), padding: ['0', '0', '0', '0'] });

  // Navbar
  const nav = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: ['24', '40', '20', '40'],
  }, 'Navbar');
  b.text(nav, 'Wanderlog', { fontSize: '20', fontWeight: '800', color: SKY });
  const navRight = b.container(nav, { flexDirection: 'row', width: 'auto' }, 'NavLinks');
  navLinks(b, navRight, [['Stories'], ['Destinations'], ['About']]);

  // Hero
  const heroImg = b.container('ROOT', { padding: ['8', '40', '0', '40'] }, 'HeroImage');
  b.image(heroImg, px(1271619, 1600), { width: '100%', height: '400px', radius: 18 });
  const hero = b.container('ROOT', { alignItems: 'center', padding: ['28', '60', '6', '60'] }, 'Hero');
  b.text(hero, 'Stories from the road', { fontSize: '42', fontWeight: '800', color: DARK, textAlign: 'center' });
  b.text(hero, 'Field notes, itineraries and photo essays from 47 countries — written slowly, traveled slower.', {
    fontSize: '17', color: GRAY, textAlign: 'center', margin: ['10', '0', '0', '0'],
  });

  // Carousel — destinations
  const caro = b.container('ROOT', { alignItems: 'center', padding: ['30', '40', '6', '40'] }, 'Destinations');
  b.text(caro, 'DESTINATION OF THE MONTH', { fontSize: '13', fontWeight: '700', color: SKY, textAlign: 'center' });
  b.text(caro, 'Where to next?', {
    fontSize: '28', fontWeight: '800', color: DARK, textAlign: 'center', margin: ['8', '0', '20', '0'],
  });
  b.carousel(caro, {
    width: '720px', height: '400px',
    src1: px(2325446, 1600), src2: px(1450353, 1600), src3: px(3155666, 1600),
    heading1: 'Iceland — Ring Road', heading2: 'Cappadocia, Türkiye', heading3: 'Santorini, Greece',
    label1: 'Wild', label2: 'Ballooning', label3: 'Islands',
    p1: 'Ten days of waterfalls, black beaches and zero regrets.',
    p2: 'Sunrise at 400 meters — the flight that ruins all other flights.',
    p3: 'Blue domes, slow ferries and the best tomatoes of your life.',
  });

  // Latest posts
  const postsHead = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ['40', '40', '4', '40'],
  }, 'PostsHeading');
  b.text(postsHead, 'Latest stories', { fontSize: '26', fontWeight: '800', color: DARK });
  b.link(postsHead, 'All stories →', '#');
  const postsRow = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', padding: ['14', '40', '0', '40'],
  }, 'PostsRow');
  const posts = [
    [px(417074, 900), '48 hours in the Alps', 'A whirlwind weekend of cable cars, rösti and ridge walks above the clouds.'],
    [px(338504, 900), 'Bali on a budget', 'How we spent three weeks in paradise for less than a month of rent.'],
    [px(358457, 900), 'Window seat diaries', 'Everything I have learned from 300,000 km of looking out of airplane windows.'],
  ];
  for (const [src, title, snippet] of posts) {
    const card = b.container(postsRow, { width: '31%' }, 'PostCard');
    b.image(card, src, { width: '100%', height: '150px', radius: 12 });
    b.text(card, title, { fontSize: '17', fontWeight: '700', color: DARK, margin: ['12', '0', '6', '0'] });
    b.text(card, snippet, { fontSize: '14', color: GRAY, margin: ['0', '0', '8', '0'] });
    b.link(card, 'Read more →', '#');
  }

  // Newsletter
  const nlWrap = b.container('ROOT', { padding: ['40', '40', '20', '40'] }, 'NewsletterSection');
  const nl = b.container(nlWrap, {
    alignItems: 'center', background: LIGHTBG, radius: 18, padding: ['38', '48', '38', '48'],
  }, 'Newsletter');
  b.text(nl, 'Join 12,000 slow travelers', { fontSize: '26', fontWeight: '800', color: DARK, textAlign: 'center' });
  b.text(nl, 'One thoughtful email per month. No spam, just stories.', {
    fontSize: '15', color: GRAY, textAlign: 'center', margin: ['8', '0', '18', '0'],
  });
  const nlBtn = b.container(nl, { width: '220px', background: LIGHTBG }, 'BtnBox');
  b.button(nlBtn, 'Subscribe free', { background: SKY, color: WHITE });

  // Footer
  const footer = b.container('ROOT', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    background: DARK, padding: ['26', '40', '26', '40'],
  }, 'Footer');
  b.text(footer, 'Wanderlog', { fontSize: '15', fontWeight: '700', color: WHITE });
  b.text(footer, '© 2026 Wanderlog. Made with wanderlust.', { fontSize: '13', color: rgba(148, 163, 184) });

  return b.map;
}

// ---------- build, save, insert ----------

const templates = [
  { name: 'SaaS Landing — NovaFlow', category: 'Landing Page', thumb: px(3184291, 640), map: saasLanding() },
  { name: 'Creative Portfolio — Mara Kim', category: 'Portfolio', thumb: px(1779487, 640), map: creativePortfolio() },
  { name: 'Restaurant — Casa Oliva', category: 'Business', thumb: px(262978, 640), map: restaurant() },
  { name: 'Fitness Studio — FORGE', category: 'Business', thumb: px(2261477, 640), map: fitness() },
  { name: 'Travel Blog — Wanderlog', category: 'Landing Page', thumb: px(1271619, 640), map: travelBlog() },
];

// Validate: parent/nodes consistency + spacing arrays
for (const t of templates) {
  for (const [id, n] of Object.entries(t.map)) {
    if (id !== 'ROOT' && !t.map[n.parent]) throw new Error(`${t.name}: ${id} has missing parent ${n.parent}`);
    if (id !== 'ROOT' && !t.map[n.parent].nodes.includes(id)) throw new Error(`${t.name}: ${id} not in parent.nodes`);
    for (const key of ['padding', 'margin']) {
      const v = n.props[key];
      if (v !== undefined) {
        if (!Array.isArray(v) || v.length !== 4 || v.some((x) => isNaN(Number(x)))) {
          throw new Error(`${t.name}: ${id} has invalid ${key}: ${JSON.stringify(v)}`);
        }
      }
    }
  }
}

// Save JSON files for inspection
const outDir = path.join(__dirname, 'templates-out');
fs.mkdirSync(outDir, { recursive: true });
for (const t of templates) {
  const file = path.join(outDir, t.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') + '.json');
  fs.writeFileSync(file, JSON.stringify(t.map, null, 2));
}
console.log(`Validated ${templates.length} templates, JSON written to ${outDir}`);

// Insert into DB
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const dbUrl = envText.match(/^DATABASE_?URL=(.+)$/m)?.[1]?.trim();
if (!dbUrl) throw new Error('DATABASE_URL not found in .env');

const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

for (const t of templates) {
  const flat = JSON.stringify(t.map);
  // Match saveAsTemplateFunc convention: TemplateData is a double-encoded JSON string
  const templateData = JSON.stringify(flat);
  const componentCount = Object.keys(t.map).length - 1;
  const res = await pool.query(
    `INSERT INTO "TBTemplates" ("TemplateName", "Category", "ThumbnailURL", "TemplateData", "ComponentCount", "CreatedBy", "IsActive")
     VALUES ($1, $2, $3, $4, $5, 1, true) RETURNING "Template_ID"`,
    [t.name, t.category, t.thumb, templateData, componentCount]
  );
  console.log(`Inserted "${t.name}" (id=${res.rows[0].Template_ID}, ${componentCount} components, ${(flat.length / 1024).toFixed(1)} KB)`);
}

await pool.end();
console.log('Done.');
