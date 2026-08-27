const PAGE_PATH = /^(?:\/|\/[a-z0-9][a-z0-9-]*\/?)$/;

export function createPreviewBundle(homeHtml, files = {}, previewPath, token) {
  const pages = { home: String(homeHtml || '') };
  for (const [path, html] of Object.entries(files || {})) {
    const match = /^\/([a-z0-9][a-z0-9-]*)\/index\.html$/.exec(path);
    if (match && typeof html === 'string') pages[match[1]] = html;
  }

  const rewrite = (html) => html.replace(/href=(['"])(\/[^'"]*)\1/g, (whole, quote, href) => {
    if (!PAGE_PATH.test(href)) return whole;
    const slug = href.replace(/^\//, '').replace(/\/$/, '') || 'home';
    if (!pages[slug]) return whole;
    return `href=${quote}${previewPath}?token=${token}&amp;page=${slug}${quote}`;
  });

  return JSON.stringify({ version: 1, pages: Object.fromEntries(Object.entries(pages).map(([slug, html]) => [slug, rewrite(html)])) });
}

export function previewPage(stored, slug = 'home') {
  try {
    const bundle = JSON.parse(stored);
    if (bundle?.version === 1 && bundle.pages) return bundle.pages[slug] || null;
  } catch {
    return slug === 'home' ? stored : null;
  }
  return null;
}
