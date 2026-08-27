function nodeMap(value) {
  if (typeof value === 'string') return JSON.parse(value);
  return value || {};
}

function resolvedName(node) {
  return node?.type?.resolvedName || node?.displayName || 'Container';
}

export function craftPageToSections(value) {
  const nodes = nodeMap(value);
  const root = nodes.ROOT;
  if (!root) return [];

  const convert = (id) => {
    const node = nodes[id];
    if (!node) return null;
    const childIds = [...(node.nodes || []), ...Object.values(node.linkedNodes || {})];
    const children = [...new Set(childIds)].map(convert).filter(Boolean);
    const element = { type: resolvedName(node), props: structuredClone(node.props || {}) };
    if (children.length) element.children = children;
    return element;
  };

  return (root.nodes || []).map(convert).filter(Boolean);
}

export function craftProjectToAiLayout(pageState, currentData) {
  if (Array.isArray(pageState?.pages) && pageState.pages.length) {
    return {
      pages: pageState.pages.map(page => ({
        name: page.name,
        slug: page.slug,
        sections: craftPageToSections(page.slug === pageState.currentSlug ? currentData : page.data),
      })),
    };
  }
  return { sections: craftPageToSections(currentData) };
}
