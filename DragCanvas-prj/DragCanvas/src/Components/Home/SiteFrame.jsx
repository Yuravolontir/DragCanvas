import { useEffect, useRef, useState } from 'react';

import MiniSite from './MiniSite.jsx';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';
import './SiteFrame.css';

/**
 * The browser the example site is shown in, and the third beat of the hero.
 *
 * Tilted in CSS 3D and following the cursor. This is the depth the page was
 * asked for, and it costs nothing: `transform` on one element, composited by
 * the GPU, no library and no scene graph. The 3D that was removed spent 242 KB
 * doing less.
 *
 * The address types itself and the tick lands after it, in that order - the
 * badge confirms something, so it cannot arrive before the thing it confirms.
 * Neither is a real deployment: generating and publishing both need an account.
 * It shows what happens next rather than pretending it already happened.
 */

const TYPE_MS = 55;

/** Degrees of tilt at the far edge of the frame. Small on purpose. */
const TILT = 5;

export default function SiteFrame({ site, run, live }) {
  const frameRef = useRef(null);
  const [typed, setTyped] = useState('');
  const prefersReducedMotion = usePrefersReducedMotion();

  // Tilt toward the cursor. Pointer-driven, so a touch device never gets it -
  // there is no cursor to follow and a fixed skew would just look broken.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || prefersReducedMotion) return undefined;
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined;

    let raf;
    const onMove = event => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const box = frame.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        frame.style.setProperty('--tilt-y', `${x * TILT * 2}deg`);
        frame.style.setProperty('--tilt-x', `${-y * TILT}deg`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      frame.style.setProperty('--tilt-y', '0deg');
      frame.style.setProperty('--tilt-x', '0deg');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [prefersReducedMotion]);

  // The address, one character at a time
  useEffect(() => {
    if (!live) return undefined;

    let count = 0;
    let timer;
    const tick = () => {
      count += 1;
      setTyped(site.url.slice(0, count));
      if (count < site.url.length) timer = setTimeout(tick, TYPE_MS);
    };
    timer = setTimeout(tick, TYPE_MS);
    return () => clearTimeout(timer);
  }, [live, site.url]);

  const shown = live ? typed : '';
  const arrived = shown.length === site.url.length;

  return (
    <div className="frame" ref={frameRef}>
      <div className="frame__body glass glow">
        <div className="frame__bar">
          <span className="frame__dot" />
          <span className="frame__dot" />
          <span className="frame__dot" />
          <span className="frame__url">
            {shown}
            {live && !arrived && <span className="frame__caret" />}
          </span>
        </div>

        <div className="frame__viewport">
          {/* Remounting on a new run replays the build from the first section */}
          <MiniSite key={`${site.id}-${run}`} site={site} />
        </div>
      </div>

      <div className={`frame__badge${arrived ? ' is-in' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="currentColor" />
          <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#08111f" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Published
      </div>
    </div>
  );
}
