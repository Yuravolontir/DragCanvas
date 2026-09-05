import { apiFetch } from '../api.js';
import { exportToHtml } from '../utils/exportToHtml.js';
import { parseDesign } from '../utils/projectPages.js';

/**
 * Turning a saved design into the page it describes, once per design.
 *
 * Kept out of SitePreview so the showcase can warm a template up before it is
 * shown. That head start is what makes moving from one template to the next a
 * fade rather than a wait: by the time the card is swapped the next site has
 * already been drawn.
 *
 * The cache lives for as long as the page does. The showcase cycles through the
 * same handful of templates indefinitely, and without it every trip round the
 * loop re-fetches and re-exports sites that have not changed.
 */

const htmlCache = new Map();

/** The node map to draw, from whichever shape this design was saved in. */
function firstPageOf(data) {
  if (data?.__dragcanvasPages && Array.isArray(data.pages) && data.pages.length) {
    const home = data.pages.find((page) => page.slug === (data.currentSlug || 'home'));
    return (home || data.pages[0]).data;
  }
  return data;
}

/**
 * @param {string} endpoint   where the whole row lives, design included
 * @param {string} designKey  the column on that row holding the design
 * @param {string} name       the title the exported page is given
 * @returns {Promise<string>} the exported page
 */
export async function drawSite({ endpoint, designKey, name }) {
  const cached = htmlCache.get(endpoint);
  if (cached) return cached;

  const row = await apiFetch(endpoint);
  const design = firstPageOf(parseDesign(row?.[designKey]));
  // An empty project would export to a blank white page, which reads as a
  // broken card rather than an empty one. The panel says "nothing yet".
  if (!design || !Object.keys(design).length) throw new Error('empty design');

  const exported = exportToHtml(design, name);
  htmlCache.set(endpoint, exported);
  return exported;
}

/** The page this design was drawn into, if it has been drawn already. */
export function drawnSite(endpoint) {
  return htmlCache.get(endpoint) ?? null;
}

/**
 * Draw a site ahead of being asked for it, and say nothing about how it went.
 *
 * A failure here is not worth reporting: the card that eventually shows this
 * design will try again and handle it properly.
 */
export function prefetchSite({ endpoint, designKey, name }) {
  if (htmlCache.has(endpoint)) return;
  drawSite({ endpoint, designKey, name }).catch(() => {});
}
