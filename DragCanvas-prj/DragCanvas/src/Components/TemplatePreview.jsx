import { useEffect, useRef, useState } from 'react';

import { apiFetch } from '../api.js';
import { exportToHtml } from '../utils/exportToHtml.js';
import { parseDesign } from '../utils/projectPages.js';
import './TemplatePreview.css';

/**
 * A template shown as the site it is, rather than as a picture of one.
 *
 * The gallery used to show `ThumbnailURL`: one stored image per template, taken
 * at some point by somebody, cropped to whatever the card happened to be. It
 * ages the moment a template is edited, it says nothing about the parts below
 * the first screen, and half the gallery had no thumbnail at all and showed a
 * tinted rectangle. Somebody choosing a starting point was choosing from a
 * picture of a page, and the picture is the thing this product makes.
 *
 * So the card renders the real thing: the same exporter that publishes a site,
 * run on the template's own data, dropped into a frame and scaled down. What
 * you see on the card is the page you get, animations and all.
 *
 * The page is always drawn at PAGE_WIDTH and then scaled to whatever the card
 * is, so every card in a row shows the same amount of site rather than a wider
 * card showing more of it.
 */

const PAGE_WIDTH = 1280;

/**
 * Whether a card can measure itself in CSS.
 *
 * The whole scaling trick is one `100cqw`, and without container queries the
 * frame would sit at its full 1280px inside a 380px card — a corner of a
 * website rather than a website. Asked once: the answer cannot change while the
 * page is open.
 */
const CAN_SCALE = typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
  && CSS.supports('width', '100cqw');

/**
 * Sandboxed to scripts alone.
 *
 * Scripts have to run — the entrance animations hold their elements hidden
 * until the page's own script says otherwise, so a preview with scripting off
 * is a preview of a blank page. Without `allow-same-origin` the frame gets an
 * opaque origin of its own: no cookies, no storage, nothing of ours reachable.
 * A published page only calls home when a project id was baked into it, and a
 * template has none.
 */
const SANDBOX = 'allow-scripts';

/** The node map to draw, from whichever shape this template was saved in. */
function firstPageOf(data) {
  if (data?.__dragcanvasPages && Array.isArray(data.pages) && data.pages.length) {
    const home = data.pages.find((page) => page.slug === (data.currentSlug || 'home'));
    return (home || data.pages[0]).data;
  }
  return data;
}

export default function TemplatePreview({ template, height = 1.25, className = '' }) {
  const boxRef = useRef(null);
  // Without an observer to tell us when the card arrives, it counts as arrived.
  const [seen, setSeen] = useState(() => typeof window !== 'undefined' && !('IntersectionObserver' in window));
  const [html, setHtml] = useState(null);
  const [failed, setFailed] = useState(false);

  // Nothing is fetched or rendered for a card nobody has scrolled to. A gallery
  // is fifteen whole websites; drawing them all on load is a second of frozen
  // page for the fourteen the reader has not looked at yet.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || seen) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      setSeen(true);
    }, { rootMargin: '400px' });
    observer.observe(box);
    return () => observer.disconnect();
  }, [seen]);

  useEffect(() => {
    if (!CAN_SCALE || !seen || html || failed) return undefined;
    let cancelled = false;

    apiFetch(`/api/templates/${template.Template_ID}`)
      .then((row) => {
        if (cancelled) return;
        const data = firstPageOf(parseDesign(row.TemplateData));
        setHtml(exportToHtml(data, template.TemplateName));
      })
      .catch(() => {
        // A preview that will not render falls back to the stored picture, and
        // then to a plain panel. A card is still a card.
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [seen, html, failed, template.Template_ID, template.TemplateName]);

  return (
    <div
      className={`tpl-preview ${className}`.trim()}
      ref={boxRef}
      style={{ '--tpl-page-width': `${PAGE_WIDTH}px`, '--tpl-height': height }}
    >
      {html && CAN_SCALE ? (
        <iframe
          className="tpl-preview__frame"
          srcDoc={html}
          sandbox={SANDBOX}
          loading="lazy"
          scrolling="no"
          // The frame is decoration for a link that already says where it goes,
          // and its contents are not reachable by keyboard from out here.
          title=""
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : (failed || !CAN_SCALE) && template.ThumbnailURL ? (
        <img className="tpl-preview__fallback" src={template.ThumbnailURL} alt="" loading="lazy" />
      ) : (
        <div className="tpl-preview__pending" aria-hidden="true" />
      )}
    </div>
  );
}
