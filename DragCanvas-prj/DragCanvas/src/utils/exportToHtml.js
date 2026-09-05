import { animationRuntime, animationStyleSheet, READY_CLASS } from './animation.js';
import { baseStylesheet } from './export/baseStylesheet.js';
import { convertNode } from './export/convertNode.js';
import { resolveImageSrc } from './export/images.js';
import {
  cssRules,
  exportContext,
  knownAnchors,
  mobileRules,
  pageUsesAnimation,
  startNewPage,
  tabletRules,
  timingRules,
} from './export/sheet.js';
import { structuredDataScript } from './export/structuredData.js';
import { escapeAttribute, escapeHtmlText, rgbaToString, slugifyAnchor } from './export/values.js';

/**
 * Turn a saved project into one standalone HTML file.
 *
 * A published page carries no bundle and no framework: everything it needs -
 * the markup, the stylesheet, and the few lines of script that run the lightbox
 * and the visit counter - is written into the file here.
 *
 * The work is split in three:
 *   export/converters.*.js   one function per element, saved node -> markup
 *   export/sheet.js          the CSS and page facts collected along the way
 *   this file                the order it happens in, and the document itself
 */

/** Where a published page sends its form posts and its visit counts. */
const PRODUCTION_API_URL = 'https://dragcanvas.onrender.com';

/** A language tag we are willing to print into the lang attribute, or English. */
const readLanguage = (lang) => (/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(lang || '') ? lang : 'en');

/** The first picture anywhere in the project, used when no social image was set. */
const firstImageIn = (serializedData) => Object.values(serializedData || {})
  .map((node) => {
    const props = node?.props || {};
    return props.src || props.image || props.backgroundImage || props.slides?.[0]?.src || props.src1;
  })
  .find(Boolean);

/**
 * Every anchor some section in this document claimed.
 *
 * Collected in a pass of its own because which anchors exist has to be known
 * before the first link is written, and the navigation bar is usually the very
 * first section converted.
 */
const collectAnchors = (serializedData) => {
  for (const node of Object.values(serializedData || {})) {
    const anchor = slugifyAnchor(node?.props?.anchor);
    if (anchor) knownAnchors.add(anchor);
  }
};

/** Base rules, then tablet overrides, then phone ones - the narrowest wins. */
const combineStylesheet = () => {
  let css = cssRules.join('\n\n');
  if (tabletRules.length > 0) {
    css += `\n\n@media (max-width: 1024px) {\n${tabletRules.join('\n\n')}\n}`;
  }
  if (mobileRules.length > 0) {
    css += `\n\n@media (max-width: 768px) {\n${mobileRules.join('\n\n')}\n}`;
  }
  return css;
};

/**
 * @param {object} serializedData  the flat node map from query.serialize()
 * @param {string} title           the page title
 * @param {object} options         projectId, apiUrl, description, canonicalUrl,
 *                                 lang, socialImage, favicon, noindex, comingSoon
 */
export const exportToHtml = (serializedData, title = 'My Website', options = {}) => {
  // A published page has no way of knowing which project it came from, so the
  // id is baked in here, and the API address is the one this build points at.
  // localhost is useful only while Vite itself is running locally: a missing
  // Netlify build variable must never make a public site call the visitor's own
  // computer.
  const fallbackApiUrl = import.meta.env?.PROD ? PRODUCTION_API_URL : 'http://localhost:3001';
  startNewPage({
    projectId: options.projectId ?? null,
    apiUrl: options.apiUrl || import.meta.env?.VITE_API_URL || fallbackApiUrl,
  });

  collectAnchors(serializedData);
  cssRules.push(baseStylesheet(rgbaToString(serializedData.ROOT?.props?.background)));

  // ROOT is the canvas Container itself, so converting it keeps the page's own
  // background and layout rather than only what was dropped inside it.
  const htmlContent = serializedData.ROOT ? convertNode('ROOT', serializedData) : '';

  // Only pages that actually animate pay for the stylesheet, and the timing
  // rules can only be known once every node has been through the converter.
  if (pageUsesAnimation()) {
    cssRules.push(animationStyleSheet());
    if (timingRules.size) cssRules.push([...timingRules.values()].join('\n'));
  }
  const css = combineStylesheet();

  const pageTitle = escapeHtmlText(title || 'My Website');
  const socialTitle = escapeAttribute(title || 'My Website');
  const description = escapeAttribute(options.description || '');
  const canonicalUrl = escapeAttribute(options.canonicalUrl || '{{DRAGCANVAS_SITE_URL}}');
  const language = readLanguage(options.lang);
  const socialImage = escapeAttribute(
    resolveImageSrc(options.socialImage || firstImageIn(serializedData) || ''),
  );
  const favicon = escapeAttribute(resolveImageSrc(options.favicon || ''));

  const descriptionTags = description ? `
  <meta name="description" content="${description}">
  <meta property="og:description" content="${description}">
  <meta name="twitter:description" content="${description}">` : '';
  const imageTags = socialImage ? `
  <meta property="og:image" content="${socialImage}">
  <meta name="twitter:image" content="${socialImage}">` : '';
  const faviconTag = favicon ? `
  <link rel="icon" href="${favicon}">` : '';
  const structuredData = structuredDataScript(serializedData, title, options);

  /*
   * Hiding is switched on from inside the document, before the first paint.
   *
   * The stylesheet only hides what it is told to hide once <html> carries the
   * ready class, so a visitor with no JavaScript - or a crawler that does not
   * run it - gets the whole page rather than a stack of invisible sections.
   */
  const animationGuard = pageUsesAnimation()
    ? `\n  <script>document.documentElement.classList.add(${JSON.stringify(READY_CLASS)});</script>`
    : '';
  const animationBlock = pageUsesAnimation() ? `  ${animationRuntime()}` : '';

  const bodyContent = options.comingSoon
    ? `<main style="min-height:100vh;display:grid;place-items:center;padding:32px;text-align:center"><div><h1>${pageTitle}</h1><p>${description || 'We are getting ready. Please check back soon.'}</p></div></main>`
    : htmlContent;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${options.noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
  <title>${pageTitle}</title>${descriptionTags}
  <link rel="canonical" href="${canonicalUrl}">${faviconTag}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${socialTitle}">
  <meta property="og:url" content="${canonicalUrl}">${imageTags}
  <meta name="twitter:card" content="${socialImage ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${socialTitle}">${structuredData}${animationGuard}
  <style>
${css}
  </style>
</head>
<body>
<div class="dc-scroll-progress" aria-hidden="true"></div>
${bodyContent}
<button class="dc-back-top" type="button" aria-label="Back to top">↑</button>
<dialog class="dc-lightbox" aria-label="Image preview"><img alt=""><form method="dialog"><button aria-label="Close preview">×</button></form></dialog>
<script>
(function () {
  var progress = document.querySelector('.dc-scroll-progress');
  var backTop = document.querySelector('.dc-back-top');
  var update = function () {
    var max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    backTop.classList.toggle('visible', scrollY > 500);
  };
  addEventListener('scroll', update, { passive: true }); update();
  backTop.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
${animationBlock}

  var lightbox = document.querySelector('.dc-lightbox');
  var preview = lightbox.querySelector('img');
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('click', function () { preview.src = img.currentSrc || img.src; preview.alt = img.alt; lightbox.showModal(); });
  });
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) lightbox.close(); });
  var analyticsUrl = ${JSON.stringify(`${exportContext.apiUrl}/api/analytics/hit`)};
  var projectId = ${JSON.stringify(exportContext.projectId)};
  if (projectId) {
    var analyticsBody = JSON.stringify({ projectId: projectId, referrer: document.referrer, screenWidth: screen.width });
    // Not sendBeacon. A beacon is always sent with credentials, and a
    // credentialed request may not be answered with "Access-Control-Allow-
    // Origin: *" - which is the only answer these endpoints can give, because
    // a published site lives on a domain nobody knew in advance. The browser
    // refused the preflight and the visit was never counted, on every
    // published site. A plain cross-origin fetch sends no credentials, so the
    // wildcard is accepted; keepalive covers somebody leaving straight away.
    fetch(analyticsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: analyticsBody, keepalive: true, credentials: 'omit' }).catch(function () {});
  }
})();
</script>
</body>
</html>`;
};

/** Save the exported page straight to the visitor's downloads. */
export const downloadHtml = (serializedData, filename = 'website.html') => {
  const html = exportToHtml(serializedData, filename.replace('.html', ''));

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
