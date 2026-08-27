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
