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

const rgba = (r, g, b, a = 1) => ({ r, g, b, a });

const WHITE = rgba(255, 255, 255);

/** For blocks that sit on a photograph and must not hide it. */
const TRANSPARENT = rgba(0, 0, 0, 0);

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
      text: str, background: rgba(238, 240, 255), color: rgba(0, 64, 224), radius: 999, ...props,
    }, { label });

  // Alternating lines: question, then its answer
  const accordion = (parent, items, props = {}, label = 'Accordion') =>
    node('Accordion', parent, {
      items, background: rgba(244, 243, 242), color: rgba(26, 28, 28), radius: 10, ...props,
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
      buttonBackground: WHITE, buttonColor: rgba(0, 64, 224), radius: 16, ...props,
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
      radius: 10, background: WHITE, accent: rgba(0, 64, 224),
      width: '100%', height: 'auto', ...props,
    }, { label });

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
    socialLinks, navbar, map_, form, footer,
  };
}

// Common blocks
export function navLinks(b, parent, items, colorNote) {
  for (const [t, href] of items) {
    const box = b.container(parent, { width: 'auto', padding: ['0', '0', '0', '24'] }, 'NavItem');
    b.link(box, t, href || '#');
  }
}

export { px, rgba, WHITE, TRANSPARENT };
