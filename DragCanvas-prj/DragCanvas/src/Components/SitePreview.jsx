import { useEffect, useRef, useState } from 'react';

import { drawSite, drawnSite } from './sitePreviewCache.js';
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

/**
 * How fast a touring preview travels down the page, in page pixels a second.
 *
 * Measured in the page's own 1280px-wide coordinates rather than in the pixels
 * the card ends up occupying, so every template moves at the same apparent
 * speed however large the card is.
 */
const TOUR_SPEED = 105;

/**
 * A tour shorter than this reads as a twitch; longer than this, as a stall.
 *
 * These move with the speed above rather than staying put: most templates are
 * short enough that the minimum is what actually decides the duration, so
 * halving the speed without halving the clamp would leave them travelling at
 * very nearly the old pace.
 */
const TOUR_MIN_SECONDS = 20;
const TOUR_MAX_SECONDS = 80;

/**
 * A beat at the footer before the card moves on.
 *
 * Arriving at the bottom and leaving in the same instant means the end of the
 * page is the one part nobody ever reads.
 */
const TOUR_REST_MS = 1200;

/**
 * Asks the page inside the frame how tall it is.
 *
 * The frame is sandboxed without `allow-same-origin`, so it has an opaque
 * origin and nothing out here can read its document - which is the whole point,
 * and also why the height cannot simply be measured from the parent. The page
 * therefore reports it itself. postMessage crosses an opaque origin happily;
 * the listener checks the message came from this card's own frame.
 *
 * Reported again on load and on any resize, because the height at first paint
 * is not final: web fonts and images land later and usually make the page
 * taller.
 */
const MEASURE_SCRIPT = `<script>
(function () {
  var report = function () {
    parent.postMessage({ dragcanvasPreviewHeight: document.documentElement.scrollHeight }, '*');
  };
  report();
  addEventListener('load', report);
  if (window.ResizeObserver) new ResizeObserver(report).observe(document.documentElement);
})();
</script>`;

/** The exported page, with the measuring script added for a touring preview. */
function withMeasureScript(html) {
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd === -1) return html + MEASURE_SCRIPT;
  return html.slice(0, bodyEnd) + MEASURE_SCRIPT + html.slice(bodyEnd);
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
 * @param {boolean} [props.tour]   pan slowly down the page, so the card shows
 *   the whole site rather than its first screen. Deliberately off by default: a
 *   gallery of fifteen cards all panning at once is a fairground.
 * @param {Function} [props.onTourEnd]  called a beat after the tour reaches the
 *   footer. Whoever owns the card decides what happens next - the showcase uses
 *   it to move on to the next template.
 */
export default function SitePreview({
  endpoint,
  designKey,
  name,
  fallbackSrc = '',
  height,
  tour = false,
  onTourEnd,
  className = '',
}) {
  const boxRef = useRef(null);
  const frameRef = useRef(null);
  const restTimer = useRef(null);
  // How far the frame may travel, and how long that should take. Null until the
  // page inside has said how tall it is; the card simply sits still until then.
  const [travel, setTravel] = useState(null);
  // Without an observer to tell us when the card arrives, it counts as arrived.
  const [seen, setSeen] = useState(() => typeof window !== 'undefined' && !('IntersectionObserver' in window));
  // Straight from the cache when this design has been drawn before, so a card
  // returned to shows its site at once rather than blinking through a panel.
  const [html, setHtml] = useState(() => drawnSite(endpoint));
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

    drawSite({ endpoint, designKey, name })
      .then((exported) => {
        if (!cancelled) setHtml(exported);
      })
      .catch(() => {
        // A preview that will not render falls back to the stored picture, and
        // then to a plain panel. A card is still a card.
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [seen, html, failed, endpoint, designKey, name]);

  /*
   * Work out the journey once the page has reported its height.
   *
   * Everything is converted into the page's own 1280px-wide coordinates,
   * because that is the space the frame is laid out in before it is scaled: the
   * card is `scale` times smaller than the page, so a card `n` pixels tall is
   * showing `n / scale` pixels of website.
   *
   * Re-measured whenever the card is resized. The scale itself stays pure CSS -
   * this only needs the numbers to decide how far to travel and for how long.
   */
  useEffect(() => {
    if (!tour) return undefined;

    let pageHeight = 0;

    const recalculate = () => {
      const box = boxRef.current;
      if (!box || !pageHeight) return;

      const { width, height: boxHeight } = box.getBoundingClientRect();
      if (!width || !boxHeight) return;

      const scale = width / PAGE_WIDTH;
      const visible = boxHeight / scale;
      const distance = pageHeight - visible;

      // A page barely taller than the card has nothing worth touring.
      if (distance < 80) {
        setTravel(null);
        return;
      }

      const seconds = Math.min(
        TOUR_MAX_SECONDS,
        Math.max(TOUR_MIN_SECONDS, distance / TOUR_SPEED),
      );
      setTravel({ pageHeight, distance, seconds });
    };

    const onMessage = (event) => {
      // Only this card's own frame is believed - every other preview on the
      // page is posting the same kind of message about a different site.
      if (event.source !== frameRef.current?.contentWindow) return;

      const reported = event.data?.dragcanvasPreviewHeight;
      if (typeof reported !== 'number' || reported <= 0) return;

      pageHeight = reported;
      recalculate();
    };

    window.addEventListener('message', onMessage);
    const observer = new ResizeObserver(recalculate);
    if (boxRef.current) observer.observe(boxRef.current);

    return () => {
      window.removeEventListener('message', onMessage);
      observer.disconnect();
    };
  }, [tour, html]);

  const style = { '--tpl-page-width': `${PAGE_WIDTH}px` };
  if (typeof height === 'number') style['--tpl-height'] = height;
  if (travel) {
    style['--tpl-tour-height'] = `${travel.pageHeight}px`;
    style['--tpl-tour-distance'] = `${travel.distance}px`;
    style['--tpl-tour-duration'] = `${travel.seconds}s`;
  }

  const classes = ['tpl-preview', travel ? 'tpl-preview--tour' : '', className]
    .filter(Boolean)
    .join(' ');

  /*
   * The end of the journey, announced once.
   *
   * animationend also fires for the loading sweep and for anything a future
   * stylesheet adds, so the name is checked rather than assumed. The rest at the
   * footer is a timeout rather than an animation delay because a delay would
   * hold the *start* of the next run, and there is no next run - the card is
   * about to be replaced.
   *
   * The timer is dropped if the card goes away first. Somebody who picks a
   * template by hand during that pause replaces this card, and a timer left
   * running would move them straight off the one they just chose.
   */
  const handleAnimationEnd = (event) => {
    if (event.animationName !== 'tpl-preview-tour' || !onTourEnd) return;
    restTimer.current = setTimeout(onTourEnd, TOUR_REST_MS);
  };

  useEffect(() => () => clearTimeout(restTimer.current), []);

  return (
    <div className={classes} ref={boxRef} style={style}>
      {html && CAN_SCALE ? (
        <iframe
          ref={frameRef}
          className="tpl-preview__frame"
          onAnimationEnd={handleAnimationEnd}
          srcDoc={tour ? withMeasureScript(html) : html}
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
