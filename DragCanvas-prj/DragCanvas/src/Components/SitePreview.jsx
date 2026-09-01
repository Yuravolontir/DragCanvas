import { useEffect, useRef, useState } from 'react';

import { apiFetch } from '../api.js';
import { exportToHtml } from '../utils/exportToHtml.js';
import { parseDesign } from '../utils/projectPages.js';
import './TemplatePreview.css';

/**
 * A saved design shown as the site it is, rather than as a picture of one.
 *
 * The gallery learned this first: a stored thumbnail ages the moment the design
 * is edited, says nothing about the parts below the first screen, and is simply
 * absent for anything nobody ever captured. The card renders the real thing
 * instead - the same exporter that publishes a site, run on the design's own
 * data, dropped into a frame and scaled down. What you see is the page you get,
 * animations and all.
 *
 * Projects need exactly the same card and were showing a stored image or, far
 * more often, nothing at all: the thumbnail block was skipped entirely when
 * there was no thumbnail, so a list of somebody's own sites showed no sites.
 * The two differ only in which endpoint holds the design, so that is all this
 * takes as a prop. Plain strings rather than a loader function on purpose - an
 * inline callback changes identity on every render, and the effect below would
 * fetch the same design forever.
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
 *
 * The exporter is deliberately called without a project id, which is the only
 * thing that makes a published page call home. A preview's forms, bookings and
 * newsletter boxes therefore belong to no project and can submit nothing, which
 * is what a picture of a site should be able to do.
 */
const SANDBOX = 'allow-scripts';

/** The node map to draw, from whichever shape this design was saved in. */
function firstPageOf(data) {
  if (data?.__dragcanvasPages && Array.isArray(data.pages) && data.pages.length) {
    const home = data.pages.find((page) => page.slug === (data.currentSlug || 'home'));
    return (home || data.pages[0]).data;
  }
  return data;
}

/**
 * @param {object} props
 * @param {string} props.endpoint   where the whole row lives, design included
 * @param {string} props.designKey  the column on that row holding the design
 * @param {string} props.name       the title the exported page is given
 * @param {string} [props.fallbackSrc]  a stored picture, when the render fails
 * @param {number} [props.height]   slice to show, as a share of PAGE_WIDTH.
 *   Left out so a stylesheet can own it, which is how the projects grid gives
 *   its featured card a different shape at one width and not at another.
 */
export default function SitePreview({ endpoint, designKey, name, fallbackSrc = '', height, className = '' }) {
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

    apiFetch(endpoint)
      .then((row) => {
        if (cancelled) return;
        const design = firstPageOf(parseDesign(row?.[designKey]));
        // An empty project would export to a blank white page, which reads as a
        // broken card rather than an empty one. The panel says "nothing yet".
        if (!design || !Object.keys(design).length) throw new Error('empty design');
        setHtml(exportToHtml(design, name));
      })
      .catch(() => {
        // A preview that will not render falls back to the stored picture, and
        // then to a plain panel. A card is still a card.
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [seen, html, failed, endpoint, designKey, name]);

  const style = { '--tpl-page-width': `${PAGE_WIDTH}px` };
  if (typeof height === 'number') style['--tpl-height'] = height;

  return (
    <div className={`tpl-preview ${className}`.trim()} ref={boxRef} style={style}>
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
      ) : (failed || !CAN_SCALE) && fallbackSrc ? (
        <img className="tpl-preview__fallback" src={fallbackSrc} alt="" loading="lazy" />
      ) : (
        // Waiting sweeps; given up stands still. A card that shimmers forever
        // is a card that says "loading" about something that is never coming.
        <div className={failed ? 'tpl-preview__blank' : 'tpl-preview__pending'} aria-hidden="true" />
      )}
    </div>
  );
}
