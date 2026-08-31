/**
 * The pieces every template is made of.
 *
 * Lifted out of generate-templates.mjs when the gallery outgrew one file. The
 * builder produces a Craft.js flat node map: the fiddly parts are the parent
 * links, the ids and `custom.displayName`, which is what the editor shows in its
 * layer list - none of which a template author should have to think about.
 */

// ---------- helpers ----------

const px = (id, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

import { readableInk } from '../../src/utils/readableInk.js';

const rgba = (r, g, b, a = 1) => ({ r, g, b, a });

const WHITE = rgba(255, 255, 255);

/** For blocks that sit on a photograph and must not hide it. */
const TRANSPARENT = rgba(0, 0, 0, 0);

/* ------------------------------------------------------------------ *
 * The house style
 *
 * Fifteen templates had eleven different corner radii between them and
 * forty-two sections padded to exactly 48 on all four sides. Neither is a
 * decision - the first is nobody choosing, the second is everybody choosing the
 * same safe number - and together they are why the gallery reads flat: every
 * block the same height off the page, every section the same distance from its
 * neighbour, nothing telling you what matters.
 *
 * These are the only values a template should reach for.
 * ------------------------------------------------------------------ */

/**
 * Four steps, far enough apart to read as different.
 *
 * 8 / 14 / 22 rather than 8 / 10 / 12: a two-pixel difference is noise at card
 * size, and the point of a scale is that a panel is visibly rounder than the
 * chip inside it. 14 for a card rather than the usual 12 - 12 is the value
 * every framework ships and it reads as unconsidered.
 */
export const RADIUS = {
    chip: 8,      // inputs, small labels, an icon's badge
    card: 14,     // the common case: a card, an image, a quote
    panel: 22,    // the one block on the page that is the offer
    pill: 999,    // a tag that should read as a tag
};

/**
 * Section rhythm, and the one liberty taken here.
 *
 * The top of a section is generous and the bottom is tighter, so a section
 * breathes into the one below rather than sitting in its own equal box. Equal
 * padding is what makes a page read as blocks stacked by a machine; the
 * asymmetry is small enough that nobody names it and large enough that the page
 * reads as one thing.
 */
export const PAD = {
    /** The opening, and the one section that carries the offer. */
    airy: ['72', '48', '56', '48'],
    /** Everything else. */
    regular: ['56', '48', '44', '48'],
    /** Bands that are a single line of content: stats, logos, a strip of tags. */
    tight: ['40', '48', '36', '48'],
    /** Inside a card. */
    card: ['24', '24', '24', '24'],
    /** A container that only groups things and should add nothing. */
    none: ['0', '0', '0', '0'],
};

/**
 * Two levels, and a real shadow rather than a glow.
 *
 * The blur was 100px with 20px of spread, which is not a shadow - it is a haze
 * the card floats in, and it is most of why these read as cheap. A shadow that
 * says "this is lifted" is short, tight and mostly transparent.
 */
export const SHADOW = {
    /** A card that is one of several. Let the border do the work. */
    flat: 0,
    /** The one card that is the point of its section. */
    lifted: 14,
};

export function createBuilder() {
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

  /**
   * A container, with a text colour that suits the ground it paints.
   *
   * `color` on a Container is what everything inside it inherits when it sets
   * no colour of its own, and the default is black. A template writing
   * `{ background: INK }` for a dark section therefore declared black type on
   * near-black - 1.10:1 - and every element that relies on inheritance went
   * with it: an Accordion's answer, a Tabs panel, the small print in a footer.
   * Nothing in the contrast check could see it, because inherited colour is not
   * a prop on the element that suffers.
   *
   * So a container that paints an opaque ground and says nothing about type
   * gets the ink that reads on it. Saying so explicitly beats inheriting a
   * colour chosen for a white canvas.
   */
  const container = (parent, props = {}, label = 'Container') => {
    const merged = { ...baseContainer, ...props };
    if (props.color === undefined && merged.background && (merged.background.a ?? 1) >= 1) {
      merged.color = readableInk(merged.background);
    }
    return node('Container', parent, merged, { canvas: true, label });
  };

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
        background: rgba(0, 64, 224),
        color: WHITE,
        buttonStyle: 'full',
        text: str,
        margin: ['8', '0', '8', '0'],
        action: 'none',
        actionValue: '',
        newTab: false,
        textComponent: {
          fontSize: '16',
          textAlign: 'center',
          fontWeight: '600',
          color: WHITE,
          margin: ['0', '0', '0', '0'],
          shadow: 0,
          text: str,
        },
        ...props,
      },
      { label }
    );

  const image = (parent, src, props = {}, label = 'Image') =>
    node('Image', parent, {
      src,
      alt: props.alt || (label === 'Image' ? '' : label),
      radius: 0,
      width: 'auto',
      height: 'auto',
      maxWidth: '100%',
      ...props,
    }, { label });

  const video = (parent, props = {}, label = 'Video') =>
    node('Video', parent, { sourceType: 'file', videoId: '', videoUrl: '', text: '', ...props }, { label });

  const link = (parent, str, href, props = {}, label = 'Link') =>
    node('Link', parent, { href, text: str, width: 'auto', height: 'auto', maxWidth: '100%', ...props }, { label });

  /**
   * Slides are a list now. Templates written before that passed src1..p3, and
   * those still work: the legacy keys are folded into `slides` here so no
   * template source has to change on the same day the component does.
   */
  const carousel = (parent, props = {}, label = 'Carousel') => {
    const { src1, src2, src3, heading1, heading2, heading3,
            label1, label2, label3, p1, p2, p3, slides, ...rest } = props;

    const legacy = [
      { src: src1, heading: heading1, label: label1, text: p1 },
      { src: src2, heading: heading2, label: label2, text: p2 },
      { src: src3, heading: heading3, label: label3, text: p3 },
    ].filter((slide) => slide.src);

    return node(
      'Carousel',
      parent,
      {
        width: '600px',
        height: '400px',
        title: label,
        autoplay: false,
        loop: true,
        arrows: true,
        dots: true,
        perView: 1,
        perViewTablet: 1,
        perViewMobile: 1,
        slides: slides || legacy,
        ...rest,
      },
      { label }
    );
  };

  /**
   * A hero with video behind it. Canvas: whatever the caller nests goes over the
   * video. A poster is always set, because it is what shows on a phone and when
   * the file fails.
   */
  const backgroundVideo = (parent, props = {}, label = 'Background video') =>
    node(
      'Video',
      parent,
      { sourceType: 'background', videoId: '', videoUrl: '', text: '', src: '', poster: '', overlay: 40, position: 'center', minHeight: '420px', loop: true, ...props },
      { label, canvas: true }
    );

  // ── The elements added by the element-library change ──────────────────
  //
  // Same shape as the six above: sensible defaults, then whatever the caller
  // overrides. The defaults matter more here than they look - a template that
  // spells out every prop is unreadable, and one that spells out none inherits
  // whatever the component happens to default to today.

  const heading = (parent, str, props = {}, label = 'Heading') =>
    node('Heading', parent, {
      text: str, level: '2', fontSize: '32', fontWeight: '700',
      textAlign: 'left', color: rgba(26, 28, 28), margin: ['0', '0', '0', '0'],
      ...props,
    }, { label });

  // A canvas: things get dropped into it, so isCanvas has to be true
  const columns = (parent, props = {}, label = 'Columns') =>
    node('Columns', parent, { count: '3', gap: '24', align: 'stretch', stack: 'yes', ...props },
      { canvas: true, label });

  const spacer = (parent, height = '48', label = 'Spacer') =>
    node('Spacer', parent, { height: String(height) }, { label });

  const divider = (parent, props = {}, label = 'Divider') =>
    node('Divider', parent, {
      thickness: '1', color: rgba(0, 0, 0, 0.12), inset: '0', spacing: '24', ...props,
    }, { label });

  const list = (parent, items, props = {}, label = 'List') =>
    node('List', parent, {
      items, ordered: 'no', fontSize: '16', gap: '8', color: rgba(67, 70, 86), ...props,
    }, { label });

  const quote = (parent, str, props = {}, label = 'Quote') =>
    node('Quote', parent, {
      text: str, attribution: '', fontSize: '20', align: 'left',
      color: rgba(26, 28, 28), accent: rgba(0, 64, 224), ...props,
    }, { label });

  const icon = (parent, name, props = {}, label = 'Icon') =>
    node('Icon', parent, {
      name, size: '32', padded: 'yes',
      color: rgba(0, 64, 224), background: rgba(238, 240, 255), ...props,
    }, { label });

  const badge = (parent, str, props = {}, label = 'Badge') =>
    node('Badge', parent, {
      text: str, background: rgba(238, 240, 255), color: rgba(0, 64, 224), radius: RADIUS.pill, ...props,
    }, { label });

  // Alternating lines: question, then its answer
  const accordion = (parent, items, props = {}, label = 'Accordion') =>
    node('Accordion', parent, {
      items, background: rgba(244, 243, 242), color: rgba(26, 28, 28), radius: RADIUS.card, ...props,
    }, { label });

  // Five lines per tier: name, price, period, button, features joined by ";"
  const pricing = (parent, tiers, props = {}, label = 'Pricing') =>
    node('Pricing', parent, {
      tiers, featured: 2, accent: rgba(0, 64, 224),
      background: WHITE, color: rgba(26, 28, 28), ...props,
    }, { label });

  const testimonial = (parent, props = {}, label = 'Testimonial') =>
    node('Testimonial', parent, {
      quote: '', author: '', role: '', avatar: '', align: 'left',
      background: WHITE, color: rgba(26, 28, 28), accent: rgba(238, 240, 255), ...props,
    }, { label });

  const stats = (parent, items, props = {}, label = 'Stats') =>
    node('Stats', parent, {
      items, align: 'center', accent: rgba(0, 64, 224), color: rgba(67, 70, 86), ...props,
    }, { label });

  const teamGrid = (parent, people, props = {}, label = 'TeamGrid') =>
    node('TeamGrid', parent, {
      people, columns: '3', accent: rgba(238, 240, 255), color: rgba(26, 28, 28), ...props,
    }, { label });

  const timeline = (parent, steps, props = {}, label = 'Timeline') =>
    node('Timeline', parent, {
      steps, accent: rgba(0, 64, 224), color: rgba(26, 28, 28), ...props,
    }, { label });

  const ctaBanner = (parent, props = {}, label = 'CTABanner') =>
    node('CTABanner', parent, {
      title: '', text: '', cta: '', href: '#',
      background: rgba(0, 64, 224), color: WHITE,
      buttonBackground: WHITE, buttonColor: rgba(0, 64, 224), radius: RADIUS.panel, ...props,
    }, { label });

  const logoStrip = (parent, logos, props = {}, label = 'LogoStrip') =>
    node('LogoStrip', parent, { logos, height: '32', gap: '40', grayscale: 'yes', ...props }, { label });

  const socialLinks = (parent, items, props = {}, label = 'SocialLinks') =>
    node('SocialLinks', parent, {
      items, background: rgba(0, 0, 0, 0.06), color: rgba(26, 28, 28), size: '14', ...props,
    }, { label });

  const navbar = (parent, brand, links, props = {}, label = 'Navbar') =>
    node('NavbarElement', parent, {
      variant: 'dark', brand, links, sticky: false,
      textColor: WHITE, height: '56px', width: '100%', ...props,
    }, { label });

  const map_ = (parent, props = {}, label = 'Map') =>
    node('Map', parent, { lat: 32.0853, lng: 34.7818, zoom: 14, height: '320px', width: '100%', label: '', ...props }, { label });

  const form = (parent, props = {}, label = 'Form') =>
    node('Form', parent, {
      fields: [
        { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
        { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
        { label: 'Message', type: 'textarea', placeholder: 'How can we help?' },
      ],
      submitText: 'Send', successMessage: 'Thank you — we will be in touch.',
      radius: RADIUS.card, background: WHITE, accent: rgba(0, 64, 224),
      textColor: rgba(73, 69, 79), inputBackground: WHITE, inputBorder: rgba(221, 221, 221),
      width: '100%', height: 'auto', ...props,
    }, { label });

  const newsletter = (parent, props = {}, label = 'Newsletter') =>
    node('Newsletter', parent, {
      heading: 'Useful updates, occasionally', placeholder: 'you@example.com',
      buttonText: 'Subscribe', successMessage: 'Check your inbox to confirm.',
      accent: rgba(0, 64, 224), color: rgba(26, 28, 28), ...props,
    }, { label });

  const booking = (parent, props = {}, label = 'Booking') =>
    node('Booking', parent, {
      heading: 'Choose a time', buttonText: 'Confirm booking', duration: 60,
      startHour: 9, endHour: 17, timeZone: 'Asia/Jerusalem', accent: rgba(0, 64, 224), ...props,
    }, { label });

  const productCatalog = (parent, products, props = {}, label = 'ProductCatalog') =>
    node('ProductCatalog', parent, {
      products, paymentLinks: [], buttonText: 'Buy now', currency: 'USD', accent: rgba(0, 64, 224), ...props,
    }, { label });

  const engagement = (parent, props = {}, label = 'Engagement') =>
    node('Engagement', parent, {
      mode: 'review', heading: 'What did you think?', options: ['👍', '❤️', '👏'],
      accent: rgba(0, 64, 224), ...props,
    }, { label });

  const tabs = (parent, items, props = {}, label = 'Tabs') =>
    node('Tabs', parent, { items, accent: rgba(0, 64, 224), ...props }, { label });

  const countdown = (parent, props = {}, label = 'Countdown') =>
    node('Countdown', parent, {
      target: '2030-01-01T00:00:00Z', label: 'Offer ends in',
      expiredText: 'This offer has ended.', accent: rgba(0, 64, 224), ...props,
    }, { label });

  /**
   * A compact next-step section, tailored to the kind of page it closes.
   *
   * This used to read like a component demo: every site ended with “Everything
   * in one place”, followed by a tall stack of unrelated widgets. It also
   * accepted a `panel` colour from every template and silently ignored it.
   * The section now has one clear editorial idea, a restrained surface, and a
   * different journey for a shop, an event, a service or an editorial page.
   */
  const modernSuite = (parent, {
    mode = 'service',
    background = WHITE,
    panel = rgba(246, 246, 244),
    ink = rgba(26, 28, 28),
    accent = rgba(0, 64, 224),
    timeZone = 'Asia/Jerusalem',
    currency = 'USD',
  } = {}) => {
    const copy = {
      service: {
        eyebrow: 'THE NEXT STEP',
        title: 'Start with a conversation',
        intro: 'Choose a time that works. You will know what happens next before the call ends.',
        facts: ['Before we meet', 'A short note is enough to prepare.', 'After the call', 'You will receive a clear recommendation and next steps.'],
      },
      commerce: {
        eyebrow: 'A SMALL EDIT',
        title: 'Made to be chosen slowly',
        intro: 'A concise selection, honest details and no artificial urgency.',
        facts: ['Delivery', 'Packed carefully in 1–2 business days.', 'Returns', 'Unused pieces can be returned within 30 days.'],
      },
      event: {
        eyebrow: 'YOUR VISIT',
        title: 'Plan the day around the good part',
        intro: 'Reserve a place now and arrive knowing exactly where to go and what to expect.',
        facts: ['On arrival', 'Your name is all you need at the door.', 'Need to change plans?', 'Move or cancel your reservation from the confirmation email.'],
      },
      content: {
        eyebrow: 'STAY CURIOUS',
        title: 'The next good thing, occasionally',
        intro: 'One considered update when there is something genuinely worth sharing.',
        facts: ['What arrives', 'New work, useful notes and behind-the-scenes details.', 'How often', 'Occasionally — never just to fill a schedule.'],
      },
    }[mode] || null;

    const section = container(parent, {
      background,
      padding: PAD.regular,
      width: '100%',
    }, 'Next step');

    const shell = container(section, {
      background: panel,
      color: ink,
      padding: ['40', '40', '40', '40'],
      width: '100%',
      radius: RADIUS.panel,
      shadow: SHADOW.flat,
    }, 'Next step panel');

    badge(shell, copy.eyebrow, {
      background: TRANSPARENT,
      color: accent,
      radius: 0,
    }, 'Section label');
    heading(shell, copy.title, {
      fontSize: '32',
      color: ink,
      margin: ['12', '0', '8', '0'],
    }, 'Next step heading');
    text(shell, copy.intro, {
      fontSize: '16',
      fontWeight: '400',
      color: ink,
      margin: ['0', '0', '28', '0'],
    }, 'Next step introduction');

    const journey = columns(shell, { count: '2', gap: '32', ratio: '3:2', stack: 'yes' }, 'Next step details');
    tabs(journey, copy.facts, { accent, color: ink }, 'Useful details');

    const action = container(journey, {
      background: TRANSPARENT,
      color: ink,
      width: '100%',
      justifyContent: 'center',
    }, 'Primary next step');

    if (mode === 'commerce') {
      countdown(action, { label: 'Current collection closes in', accent }, 'Collection countdown');
      productCatalog(shell, [
        'Everyday', 'A simple, useful place to begin', '29.00', '',
        'Signature', 'The piece people return for', '59.00', '',
      ], { currency, accent }, 'Selected pieces');
    } else if (mode === 'event') {
      countdown(action, { label: 'Until doors open', accent }, 'Event countdown');
      booking(shell, { heading: 'Reserve your place', duration: 60, timeZone, accent }, 'Reservation');
    } else if (mode === 'service') {
      booking(action, { heading: 'Choose a time', duration: 60, timeZone, accent }, 'Appointment booking');
    } else {
      newsletter(action, {
        heading: 'Receive the next edition',
        accent,
        color: ink,
      }, 'Newsletter signup');
    }

    const response = container(shell, {
      background: TRANSPARENT,
      width: '100%',
      padding: ['28', '0', '0', '0'],
    }, 'Visitor response');
    divider(response, { color: rgba(0, 0, 0, 0.12), spacing: '16' });
    engagement(response, {
      mode: mode === 'content' ? 'reaction' : 'review',
      heading: mode === 'content' ? 'Was this worth your time?' : 'How did this feel?',
      accent,
    }, 'Visitor feedback');

    return section;
  };

  /**
   * The closing band.
   *
   * Every template had a last section and then simply stopped, which reads as a
   * page that failed to finish loading. A footer is the thing that says the page
   * ended on purpose. Kept to one row - a name, a line of small print, and the
   * social links - because a template's footer is scaffolding for somebody
   * else's, not a sitemap of a site that does not exist yet.
   */
  const footer = (parent, { brand, note, socials = [], background, ink, muted }) => {
    const bar = container(parent, {
      background,
      color: ink,
      padding: ['40', '48', '40', '48'],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }, 'Footer');

    const left = container(bar, {
      background: TRANSPARENT,
      width: 'auto',
      alignItems: 'flex-start',
    }, 'Footer text');
    text(left, brand, { fontSize: '17', fontWeight: '700', color: ink }, 'Footer brand');
    text(left, note, { fontSize: '13', color: muted, margin: ['6', '0', '0', '0'] }, 'Small print');

    if (socials.length) {
      socialLinks(bar, socials, { color: muted, size: '20', gap: '18' }, 'Footer links');
    }

    return bar;
  };

  return {
    map, root, node, container, text, button, image, video, link, carousel,
    heading, columns, spacer, divider, list, quote, icon, badge, accordion,
    pricing, testimonial, stats, teamGrid, timeline, ctaBanner, logoStrip,
    socialLinks, navbar, map_, form, newsletter, booking, productCatalog,
    engagement, tabs, countdown, modernSuite, footer,
    backgroundVideo,
  };
}

// Common blocks
export function navLinks(b, parent, items, colorNote) {
  for (const [t, href] of items) {
    const box = b.container(parent, { width: 'auto', padding: ['0', '0', '0', '24'] }, 'NavItem');
    b.link(box, t, href || '#');
  }
}

/**
 * How long apart the blocks in a row arrive, and how many get their own turn.
 *
 * A fourth step is a card the visitor is waiting for rather than watching.
 */
const STAGGER_MS = 90;
const STAGGER_CAP = 3;

/** Give one node an entrance, without arguing with a template that chose one. */
export function animate(map, id, { animation, delay, duration, repeat } = {}) {
  const node = map[id];
  if (!node) return id;
  node.props ||= {};
  if (animation !== undefined && node.props.animation === undefined) node.props.animation = animation;
  if (delay !== undefined && node.props.animationDelay === undefined) node.props.animationDelay = delay;
  if (duration !== undefined && node.props.animationDuration === undefined) node.props.animationDuration = duration;
  if (repeat !== undefined && node.props.animationRepeat === undefined) node.props.animationRepeat = repeat;
  return id;
}

/** Hand a row of blocks their turns, one after another. */
export function stagger(map, ids, spec = {}) {
  const step = spec.step ?? STAGGER_MS;
  ids.forEach((id, index) => {
    animate(map, id, { ...spec, delay: Math.min(index, STAGGER_CAP) * step });
  });
  return ids;
}

/**
 * The motion every template gets for free.
 *
 * Sections already fade up — that is the fallback the canvas and the exporter
 * share — so what is left is the difference between three cards appearing at
 * once and three cards appearing one after another, which is the whole reason
 * a gallery page looks finished or looks flat. Doing it here rather than in
 * fifteen template files is also the only way the sixteenth gets it.
 *
 * Nothing already answered is overwritten, so a template that wants a hero
 * image to zoom says so and keeps it. The navigation bar is left alone on
 * purpose: it is usually sticky, and a transform on a sticky bar is a bar that
 * detaches from the top of the window while it animates.
 */
export function applyDefaultMotion(map) {
  for (const [id, node] of Object.entries(map)) {
    if (id === 'ROOT') continue;
    if (!node.isCanvas) continue;

    const rows = (node.nodes || []).filter((childId) => {
      const child = map[childId];
      return child && child.type?.resolvedName === 'Container';
    });
    if (rows.length < 2) continue;
    stagger(map, rows);
  }

  for (const node of Object.values(map)) {
    if (node.type?.resolvedName !== 'NavbarElement') continue;
    node.props ||= {};
    if (node.props.animation === undefined) node.props.animation = 'none';
  }

  return map;
}

export { px, rgba, WHITE, TRANSPARENT };
