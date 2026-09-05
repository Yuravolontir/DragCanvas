import { apiFetch } from '../api.js';
import { exportToHtml } from '../utils/exportToHtml.js';
import { syncSharedChrome } from '../utils/projectPages.js';

function createPreviewPages({ serializedCanvas, pages, currentPageSlug }) {
  const currentCanvas = JSON.parse(serializedCanvas);
  return pages.map((page) => ({
    ...page,
    data: page.slug === currentPageSlug
      ? currentCanvas
      : syncSharedChrome(currentCanvas, page.data),
  }));
}

/** Builds a private preview bundle and asks the browser to open it. */
export async function openProjectPreview({
  projectId,
  serializedCanvas,
  pages,
  currentPageSlug,
  projectName,
  projectDescription,
  siteLanguage,
  socialImage,
  favicon,
}) {
  const previewPages = createPreviewPages({ serializedCanvas, pages, currentPageSlug });
  const homePage = previewPages.find((page) => page.slug === 'home') || previewPages[0];
  const exportOptions = {
    projectId,
    description: projectDescription,
    lang: siteLanguage,
    socialImage,
    favicon,
    canonicalUrl: '',
    noindex: true,
  };
  const html = exportToHtml(homePage.data, projectName || 'Preview', exportOptions);
  const files = Object.fromEntries(
    previewPages
      .filter((page) => page.slug !== 'home' && page.data)
      .map((page) => [
        `/${page.slug}/index.html`,
        exportToHtml(page.data, `${page.name} — ${projectName || 'Preview'}`, exportOptions),
      ]),
  );

  const result = await apiFetch(`/api/publish/preview/${projectId}`, {
    method: 'POST',
    body: { html, files },
  });
  window.open(result.previewUrl, '_blank', 'noopener,noreferrer');
}
