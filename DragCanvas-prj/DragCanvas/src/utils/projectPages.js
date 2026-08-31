export const sharedRootIds = (data) => (data?.ROOT?.nodes || []).filter((id, index) => {
  const node = data[id];
  const type = node?.type?.resolvedName || node?.type;
  const display = String(node?.custom?.displayName || node?.props?.anchor || '').toLowerCase();
  return (index === 0 && type === 'NavbarElement') || display.includes('footer');
});

export const pageSlugFromHref = (href) => {
  const value = String(href || '').trim();
  if (!/^\/(?:[a-z0-9][a-z0-9-]*\/?)?$/.test(value)) return null;
  return value.replace(/^\/+|\/+$/g, '') || 'home';
};

const collectTreeIds = (data, roots) => {
  const ids = new Set();
  const visit = (id) => {
    if (!data[id] || ids.has(id)) return;
    ids.add(id);
    [...(data[id].nodes || []), ...Object.values(data[id].linkedNodes || {})].forEach(visit);
  };
  roots.forEach(visit);
  return ids;
};

export const syncSharedChrome = (source, target) => {
  if (!source?.ROOT || !target?.ROOT) return target;
  const sharedRoots = sharedRootIds(source);
  if (!sharedRoots.length) return target;
  const oldShared = sharedRootIds(target);
  const remove = collectTreeIds(target, oldShared);
  const next = Object.fromEntries(Object.entries(target).filter(([id]) => !remove.has(id)));
  const copyTree = (id) => {
    if (!source[id]) return;
    next[id] = structuredClone(source[id]);
    [...(source[id].nodes || []), ...Object.values(source[id].linkedNodes || {})].forEach(copyTree);
  };
  sharedRoots.forEach(copyTree);
  const content = (target.ROOT.nodes || []).filter((id) => !oldShared.includes(id));
  const navbar = sharedRoots.filter((id) => (source[id]?.type?.resolvedName || source[id]?.type) === 'NavbarElement');
  const footer = sharedRoots.filter((id) => !navbar.includes(id));
  next.ROOT = { ...structuredClone(target.ROOT), nodes: [...navbar, ...content, ...footer] };
  return next;
};

export const blankPageFrom = (source) => {
  const shared = sharedRootIds(source);
  const keep = collectTreeIds(source, shared);
  const next = { ROOT: { ...structuredClone(source.ROOT), nodes: [...shared] } };
  for (const id of keep) next[id] = structuredClone(source[id]);
  return next;
};

// The neutral page the editor starts from and returns to.  Mirrors the
// Container defaults, except that the canvas has the authoring measure the AI
// generator and the starter project already use, and no scrim - a cleared page
// should not darken whatever the next background turns out to be.
export const emptyPageProps = {
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  fillSpace: 'no',
  padding: ['0', '0', '0', '0'],
  margin: ['0', '0', '0', '0'],
  background: { r: 255, g: 255, b: 255, a: 1 },
  backgroundImage: '',
  overlay: { r: 0, g: 0, b: 0, a: 0 },
  color: { r: 0, g: 0, b: 0, a: 1 },
  shadow: 0,
  radius: 0,
  width: '800px',
  // Resizer supplies the 600px minimum. `auto` lets App grow as elements are
  // inserted instead of turning the initial empty-page size into a hard cap.
  height: 'auto',
};

/*
 * Craft needs its ROOT node even when the visible page has no elements.
 *
 * Rebuilt rather than spread from the old root: carrying the previous props
 * over meant that clearing a page whose App had, say, a photograph and 80px of
 * padding gave back an "empty" page that still looked like the old one. The
 * only thing worth keeping is the `App` label the layers panel shows.
 */
export const emptyPageFrom = (source) => ({
  ROOT: {
    type: { resolvedName: 'Container' },
    isCanvas: true,
    props: structuredClone(emptyPageProps),
    displayName: 'Container',
    custom: structuredClone(source?.ROOT?.custom || { displayName: 'App' }),
    parent: null,
    hidden: false,
    nodes: [],
    linkedNodes: {},
  },
});

/**
 * A stored design, whatever depth of JSON string it arrived wrapped in.
 *
 * Two writers disagree about this column. The editor's own "save as template"
 * sends `JSON.stringify(canvas)` and the row holds the design encoded once; the
 * gallery build wrapped that string a second time, and the row holds it encoded
 * twice. Nobody noticed, because a single parse of a double-encoded row hands
 * back a string and Craft's deserialize accepts a string as readily as an
 * object — so single-page templates opened either way.
 *
 * A multi-page design is where it stops being invisible: the envelope has to be
 * an object for anything to find the pages in it, and a string went straight to
 * deserialize as though it were one page. Rather than migrate rows that already
 * exist, this unwraps until it has the object, which both shapes reach.
 */
export function parseDesign(raw) {
  let value = raw;
  for (let depth = 0; depth < 4 && typeof value === 'string'; depth += 1) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return typeof value === 'object' ? value : null;
}
