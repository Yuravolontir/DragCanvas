/**
 * Everything a template has to be true about itself.
 *
 * Shared by the build (scripts/generate-templates.mjs) and the one-off checker
 * (scripts/check-template.mjs), so a template written by hand or by an AI is
 * held to exactly the checks the gallery is held to. Two copies of these rules
 * would have drifted the first time one was edited.
 *
 * Each rule exists because the gallery once shipped without it. The comments say
 * which failure, because the point of a rule nobody can remember the reason for
 * is quickly lost.
 */

/**
 * The types the editor can actually resolve.
 *
 * Mirrors the resolver in src/CreateNewProject.jsx. A template naming anything
 * else deserialises to nothing - Craft.js drops the node silently, so the
 * symptom is a section that is simply absent rather than an error. The Custom*
 * names are the older hand-built blocks; they resolve, but nothing should be
 * authored with them now.
 */
export const RESOLVED_NAMES = new Set([
  'Container', 'Text', 'Button', 'Video', 'BackgroundVideo', 'Link', 'Form', 'Image', 'Carousel',
  'Map', 'NavbarElement', 'Heading', 'Columns', 'Spacer', 'Divider', 'List',
  'Quote', 'Icon', 'Badge', 'Accordion', 'Pricing', 'Testimonial', 'Stats',
  'TeamGrid', 'Timeline', 'CTABanner', 'LogoStrip', 'SocialLinks',
  'Newsletter', 'Booking', 'ProductCatalog', 'Engagement', 'Tabs', 'Countdown',
  'Custom1', 'Custom2', 'Custom2VideoDrop', 'Custom3', 'Custom3BtnDrop', 'OnlyButtons',
]);

/**
 * Throws on the first problem it finds.
 *
 * @param {{ name: string, map: object }} t a template: its name, and its flat
 *   Craft.js node map.
 */
export function validateTemplate(t) {
  if (!t.map || !t.map.ROOT) throw new Error(`${t.name}: has no ROOT node`);
  if (t.map.ROOT.parent) throw new Error(`${t.name}: ROOT must not have a parent`);

  for (const [id, n] of Object.entries(t.map)) {
    const type = n.type?.resolvedName;
    if (!RESOLVED_NAMES.has(type)) {
      throw new Error(`${t.name}: ${id} is a "${type}", which the editor cannot resolve`);
    }
    // Craft.js needs a canvas to accept children. A Container written with
    // isCanvas false swallows everything under it.
    if ((n.nodes || []).length && !n.isCanvas) {
      throw new Error(`${t.name}: ${id} (${type}) has children but isCanvas is not true`);
    }
  }


  for (const [id, n] of Object.entries(t.map)) {
    if (id !== 'ROOT' && !t.map[n.parent]) throw new Error(`${t.name}: ${id} has missing parent ${n.parent}`);
    if (id !== 'ROOT' && !t.map[n.parent].nodes.includes(id)) throw new Error(`${t.name}: ${id} not in parent.nodes`);
    for (const key of ['padding', 'margin']) {
      const v = n.props?.[key];
      if (v !== undefined) {
        if (!Array.isArray(v) || v.length !== 4 || v.some((x) => isNaN(Number(x)))) {
          throw new Error(`${t.name}: ${id} has invalid ${key}: ${JSON.stringify(v)}`);
        }
      }
    }
  }

  // Props that must be text, and were not.
  //
  // Every image in the first build of this set was broken, because `image()`
  // takes its src as the second argument and it was being handed a props object
  // instead - so `src` held `{ src: '...', radius: 6 }` and the browser rendered
  // nothing. The URLs were all valid; they were in the wrong place. Checking
  // that a URL appears somewhere in the JSON does not catch that, and did not.
  for (const [id, n] of Object.entries(t.map)) {
    for (const key of ['src', 'videoUrl', 'href', 'text', 'brand', 'title', 'quote', 'author']) {
      const v = n.props?.[key];
      if (v !== undefined && typeof v !== 'string') {
        throw new Error(`${t.name}: ${id} (${n.type?.resolvedName}) has a non-string ${key}: ${JSON.stringify(v).slice(0, 60)}`);
      }
    }
    // An element that shows media and has none renders as an empty box
    if (n.type?.resolvedName === 'Image' && !n.props?.src) {
      throw new Error(`${t.name}: ${id} is an Image with no src`);
    }
    if (n.type?.resolvedName === 'Image' && !String(n.props?.alt || '').trim()) {
      throw new Error(`${t.name}: ${id} is an Image with no alt text`);
    }
    if (
      n.type?.resolvedName === 'Video' &&
      n.props?.sourceType !== 'background' &&
      !n.props?.videoUrl &&
      !n.props?.videoId
    ) {
      throw new Error(`${t.name}: ${id} is a Video with no videoUrl`);
    }
    if (
      n.type?.resolvedName === 'Video' &&
      n.props?.sourceType === 'background' &&
      !n.props?.src &&
      !n.props?.poster
    ) {
      throw new Error(`${t.name}: ${id} is a background Video with no video or poster`);
    }
  }

  // Internal calls to action must land on a real section. The exporter safely
  // disables dead anchors, but a template should not ship a button that only
  // becomes inert after publication.
  const anchors = new Set(
    Object.values(t.map).map((n) => n.props?.anchor).filter(Boolean).map(String)
  );
  const internalLinks = [];
  for (const [id, n] of Object.entries(t.map)) {
    if (typeof n.props?.href === 'string' && n.props.href.startsWith('#')) {
      internalLinks.push([id, n.props.href]);
    }
    for (const link of Array.isArray(n.props?.links) ? n.props.links : []) {
      const href = typeof link === 'string' ? null : link?.href;
      if (typeof href === 'string' && href.startsWith('#')) internalLinks.push([id, href]);
    }
  }
  for (const [id, href] of internalLinks) {
    const target = href.slice(1);
    if (target && !anchors.has(target)) {
      throw new Error(`${t.name}: ${id} links to missing #${target}`);
    }
  }

  // A page needs one level-1 heading. Zero leaves it with no subject; two make
  // the outline ambiguous, and both are silent until somebody audits the HTML.
  const h1 = Object.values(t.map).filter(
    (n) => n.type?.resolvedName === 'Heading' && String(n.props?.level) === '1'
  ).length;
  if (h1 !== 1) throw new Error(`${t.name}: has ${h1} level-1 headings, needs exactly 1`);

  // The same photograph twice on one page.
  //
  // Cheap to do by accident - a good picture gets reused for the hero and then
  // again for a card - and it is the single thing that most makes a page look
  // assembled rather than designed. The reader notices immediately.
  const seen = new Map();
  for (const [id, n] of Object.entries(t.map)) {
    for (const src of [n.props?.src, n.props?.backgroundImage]) {
      if (!src) continue;
      // Compare the photograph, not the requested width: the same picture at
      // 600px and at 1600px is still the same picture.
      const key = String(src).split('?')[0];
      if (seen.has(key)) {
        throw new Error(`${t.name}: ${id} repeats the image already used by ${seen.get(key)}`);
      }
      seen.set(key, id);
    }
  }

  // Card images with no fixed height.
  //
  // Photographs in a row of cards arrive at different aspect ratios, so without
  // a height each card is as tall as its own picture and the row comes out
  // ragged. `object-fit: cover` is already set, so a height is all it takes.
  const withinColumns = (id) => {
    for (let cur = t.map[id]?.parent; cur; cur = t.map[cur]?.parent) {
      if (t.map[cur]?.type?.resolvedName === 'Columns') return true;
    }
    return false;
  };
  for (const [id, n] of Object.entries(t.map)) {
    if (n.type?.resolvedName !== 'Image' || !withinColumns(id)) continue;
    if (!/^\d+px$/.test(String(n.props?.height || ''))) {
      throw new Error(`${t.name}: ${id} is an image in a row of cards with no fixed height`);
    }
  }

  // Text that cannot be read off its own hero.
  //
  // A section with a photograph behind it gets a dark scrim so the words stand
  // out - and then the words were left the same near-black as the rest of the
  // page, which is how a hero ends up with an invisible headline. Every template
  // in the first pass did this. The editor shows it too, so it is not that
  // nobody could see it; it is that nobody looked.
  const luminance = (c) => {
    if (!c) return null;
    const f = (v) => {
      const x = Number(v) / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const contrast = (a, b) => {
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  };

  for (const [id, n] of Object.entries(t.map)) {
    if (!n.props?.backgroundImage) continue;
    // The scrim is what the text actually sits on, so it is what to measure.
    const scrim = luminance(n.props.overlay);
    if (scrim === null) continue;

    // Carry the effective background down rather than stopping at the first
    // child that paints its own. Stopping was the first version of this check,
    // and it had a hole exactly the size of the bug it was written for: two
    // heroes held their words in a box that defaulted to opaque white, the walk
    // stopped there, and light-on-white went through as if it were fine.
    const stack = (n.nodes || []).map((childId) => [childId, scrim]);
    while (stack.length) {
      const [childId, ground] = stack.pop();
      const child = t.map[childId];
      if (!child) continue;

      const own = child.props?.background;
      const below = own && Number(own.a ?? 1) > 0.6 ? luminance(own) : ground;
      stack.push(...(child.nodes || []).map((kid) => [kid, below]));

      if (!['Text', 'Heading'].includes(child.type?.resolvedName)) continue;
      const ink = luminance(child.props?.color);
      if (ink === null) continue;
      const ratio = contrast(ink, below);
      if (ratio < 4.5) {
        throw new Error(
          `${t.name}: ${childId} reads at ${ratio.toFixed(2)}:1 under the ${id} photograph, needs 4.5:1`
        );
      }
    }
  }

  // A page that stops rather than ends reads as one that failed to load.
  const hasFooter = Object.values(t.map).some((n) => n.custom?.displayName === 'Footer');
  if (!hasFooter) throw new Error(`${t.name}: has no footer`);
}

/**
 * The elements that carry structure rather than just words.
 *
 * A page made of Heading, Text and Image is a page whose author reached for the
 * three things every builder has. These are the ones this editor has that most
 * do not, and a template exists to show somebody they are there - a customer who
 * never sees an Accordion in a template will not go looking for one in the
 * toolbar.
 */
const COMPOSED = new Set([
  'Accordion', 'Carousel', 'CTABanner', 'Form', 'Icon', 'LogoStrip', 'Map',
  'Pricing', 'Stats', 'TeamGrid', 'Testimonial', 'Timeline', 'Video', 'Quote',
  'Newsletter', 'Booking', 'ProductCatalog', 'Engagement', 'Tabs', 'Countdown',
]);

/**
 * How much of the editor a template actually shows off.
 *
 * Measured before this existed: the gallery averaged 12.6 of 27 element types,
 * 3.6 of the 14 composed ones, and 1.4 rows of columns per page - six sections
 * of heading, paragraph, picture, one after another. Every one of those pages
 * passed every other rule in this file, because nothing here could see the
 * difference between a page and a list.
 *
 * Prose could not fix it either: the authoring guide has had a section on
 * composition throughout, and templates written against it still came out flat.
 * A number that fails the build is what binds.
 */
export function checkRichness(t) {
  const nodes = Object.values(t.map);
  const kinds = new Set(nodes.map((n) => n.type?.resolvedName));
  const composed = [...kinds].filter((k) => COMPOSED.has(k));
  const columns = nodes.filter((n) => n.type?.resolvedName === 'Columns');
  const uneven = columns.filter((n) => String(n.props?.ratio || '').includes(':'));

  const shortfalls = [];
  if (kinds.size < 16) shortfalls.push(`${kinds.size} element types, needs 16`);
  if (composed.length < 6) shortfalls.push(`${composed.length} composed elements, needs 6`);
  if (columns.length < 3) shortfalls.push(`${columns.length} rows of columns, needs 3`);
  // At least one row that is not two equal halves. Without this the rule above
  // is satisfied by three more even splits, which is the layout being escaped.
  if (uneven.length < 1) shortfalls.push('no row with a ratio, needs 1');

  return shortfalls;
}
