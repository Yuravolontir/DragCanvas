import { apiFetch } from '../api.js';
import { exportToHtml } from '../utils/exportToHtml.js';
import { blockersIn, inspectBeforePublish, warningsIn } from '../utils/publishPreflight.js';
import { syncSharedChrome } from '../utils/projectPages.js';

function preparePages(serializedCanvas, pages, currentPageSlug) {
  const currentCanvas = JSON.parse(serializedCanvas);
  return pages.map((page) => ({
    ...page,
    data: page.slug === currentPageSlug
      ? currentCanvas
      : syncSharedChrome(currentCanvas, page.data),
  }));
}

function inspectPages(pages) {
  return pages.flatMap((page) => (
    inspectBeforePublish(page.data, { title: page.name })
      .map((issue) => ({ ...issue, message: `${page.name}: ${issue.message}` }))
  ));
}

function formatIssues(issues) {
  return issues.map((issue) => `• ${issue.message}`).join('\n');
}

function findBookingSettings(pages) {
  for (const page of pages) {
    for (const node of Object.values(page.data || {})) {
      const type = node?.type?.resolvedName || node?.type;
      if (type === 'Booking') {
        return {
          duration: Number(node.props?.duration) || 60,
          startHour: Number(node.props?.startHour) || 9,
          endHour: Number(node.props?.endHour) || 17,
          timeZone: String(node.props?.timeZone || 'UTC'),
        };
      }
    }
  }
  return null;
}

function createSupportingFiles(pages, canonicalUrl, comingSoon, exportPage) {
  const files = {};
  for (const page of pages) {
    if (comingSoon || page.slug === 'home' || !page.data) continue;
    files[`/${page.slug}/index.html`] = exportPage(page);
  }

  const sitemapBase = canonicalUrl?.replace(/\/$/, '') || '{{DRAGCANVAS_SITE_URL}}';
  const sitemapUrls = pages
    .filter((page) => page.data && (!comingSoon || page.slug === 'home'))
    .map((page) => page.slug === 'home' ? `${sitemapBase}/` : `${sitemapBase}/${page.slug}/`);
  files['/robots.txt'] = `User-agent: *\nAllow: /\nSitemap: ${sitemapBase}/sitemap.xml\n`;
  files['/sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
  return files;
}

/** Validates, exports and publishes every page of an editor project. */
export async function publishEditorProject({
  projectId,
  serializedCanvas,
  pages,
  currentPageSlug,
  projectName,
  projectDescription,
  publishTarget,
  customDomain,
  publishedUrl,
  siteSettings,
  integrations,
  askConfirm,
}) {
  const publishPages = preparePages(serializedCanvas, pages, currentPageSlug);
  const issues = inspectPages(publishPages);
  const blockers = blockersIn(issues);
  if (blockers.length) {
    throw new Error(`Fix these items before publishing:\n\n${formatIssues(blockers)}`);
  }

  const warnings = warningsIn(issues);
  if (warnings.length) {
    const confirmed = await askConfirm({
      title: 'Publish with these as they are?',
      message: `${formatIssues(warnings)}\n\nEverything here works — it is the values that may not be yours. You can close this, change them, and publish again.`,
      confirmText: 'Publish anyway',
      cancelText: 'Let me change them',
    });
    if (!confirmed) return null;
  }

  const canonicalUrl = publishTarget === 'custom'
    ? `https://${customDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}`
    : publishedUrl;
  const commonExportOptions = {
    projectId,
    description: projectDescription,
    lang: siteSettings.lang,
    socialImage: siteSettings.socialImage,
    favicon: siteSettings.favicon,
  };
  const homePage = publishPages.find((page) => page.slug === 'home') || publishPages[0];
  const html = exportToHtml(homePage.data, projectName, {
    ...commonExportOptions,
    canonicalUrl,
    comingSoon: siteSettings.comingSoon,
  });
  const exportPage = (page) => {
    const pageUrl = canonicalUrl
      ? `${canonicalUrl.replace(/\/$/, '')}/${page.slug}/`
      : `{{DRAGCANVAS_SITE_URL}}/${page.slug}/`;
    return exportToHtml(page.data, `${page.name} — ${projectName}`, {
      ...commonExportOptions,
      canonicalUrl: pageUrl,
    });
  };
  const files = createSupportingFiles(
    publishPages,
    canonicalUrl,
    siteSettings.comingSoon,
    exportPage,
  );

  const result = await apiFetch('/api/publish/site', {
    method: 'POST',
    body: {
      projectId,
      html,
      files,
      ...(siteSettings.password ? { password: siteSettings.password } : {}),
      bookingSettings: findBookingSettings(publishPages),
      target: publishTarget,
      domain: publishTarget === 'custom' ? customDomain.trim() : null,
    },
  });

  await apiFetch(`/api/forms/project/${projectId}/integrations`, {
    method: 'PUT',
    body: integrations,
  });
  await apiFetch(`/api/projects/${projectId}/site-settings`, {
    method: 'PUT',
    body: {
      lang: siteSettings.lang,
      socialImage: siteSettings.socialImage,
      favicon: siteSettings.favicon,
      comingSoon: siteSettings.comingSoon,
    },
  });

  return result;
}
