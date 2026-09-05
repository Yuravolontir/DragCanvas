/**
 * What one export is building up as it walks the page.
 *
 * Converting a page is a recursive walk over forty plain functions, and each of
 * them needs to add a CSS rule, claim a class name or ask which project this
 * is. Threading a "sheet" argument through forty converters would be forty
 * chances to forget one, so the sheet lives here instead - one module, reset at
 * the start of every export.
 *
 * `startNewPage` is what makes that safe: nothing may survive from the previous
 * page, or a site would publish with another page's rules in it.
 */

/** Base rules, in the order they were collected. */
export const cssRules = [];

/** Overrides for narrow screens, emitted as one @media block at the end. */
export const mobileRules = [];
export const tabletRules = [];

/** Distinct duration/delay pairs, so ten staggered cards share three rules. */
export const timingRules = new Map();

/**
 * Anchors that some section in this document actually claimed.
 *
 * Collected before the first link is written, so navigation links can be
 * checked against reality rather than hope.
 */
export const knownAnchors = new Set();

/**
 * Which project this page belongs to, and where its forms should post.
 *
 * A published page has no way of knowing either, so both are baked into the
 * markup as it is written.
 */
export const exportContext = { projectId: null, apiUrl: '' };

let ruleCounter = 0;
let usesAnimation = false;

/** Forget the previous page and start collecting a new one. */
export function startNewPage({ projectId = null, apiUrl = '' } = {}) {
  ruleCounter = 0;
  cssRules.length = 0;
  mobileRules.length = 0;
  tabletRules.length = 0;
  timingRules.clear();
  knownAnchors.clear();
  usesAnimation = false;

  exportContext.projectId = projectId;
  exportContext.apiUrl = apiUrl;
}

/** A class name nothing else on this page uses. */
export function generateClass(prefix) {
  ruleCounter += 1;
  return `${prefix}-${ruleCounter}`;
}

/** Something on this page animates, so the page needs the animation stylesheet. */
export function markUsesAnimation() {
  usesAnimation = true;
}

export function pageUsesAnimation() {
  return usesAnimation;
}
