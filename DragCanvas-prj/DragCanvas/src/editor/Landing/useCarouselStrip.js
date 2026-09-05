import { useCallback, useEffect, useRef, useState } from 'react';

/** Somebody who asked the system for less motion did not ask for an exception. */
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Moves a scroll-snap strip, and reports which slide is in view.
 *
 * The scroll position is the only state there is. A swipe, an arrow, a dot and
 * an autoplay tick all end up calling the same scroll, so they cannot drift
 * apart - and the dots are read back off the scroll rather than counted
 * separately.
 *
 * @param {number} slideCount  how many slides the strip holds
 * @param {boolean} loop       jump back to the start instead of stopping at the end
 * @param {boolean} autoplay   advance on a timer
 * @param {number} interval    milliseconds between automatic advances
 * @param {boolean} paused     hold the timer (the pointer is over the carousel)
 */
export function useCarouselStrip({ slideCount, loop, autoplay, interval, paused }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  /** One slide's width, measured rather than assumed. */
  const slideWidth = () => {
    const track = trackRef.current;
    if (!track) return 0;
    return track.firstElementChild?.getBoundingClientRect().width || track.clientWidth;
  };

  /** Move one slide forward (direction 1) or back (direction -1). */
  const go = useCallback((direction) => {
    const track = trackRef.current;
    if (!track) return;

    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    const atStart = track.scrollLeft <= 1;

    // Rewind rather than clone: cloning slides doubles the DOM and breaks the
    // "n of m" announcements. See design.md.
    if (direction > 0 && atEnd) {
      if (loop) track.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    if (direction < 0 && atStart) {
      if (loop) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
      return;
    }

    track.scrollBy({ left: direction * slideWidth(), behavior: 'smooth' });
  }, [loop]);

  const goTo = (index) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * slideWidth(), behavior: 'smooth' });
  };

  /* The dots follow the scroll position; nothing counts slides separately. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const onScroll = () => {
      const width = slideWidth();
      if (width > 0) setActive(Math.round(track.scrollLeft / width));
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const shouldTick = autoplay && !paused && slideCount > 1 && !prefersReducedMotion();
    if (!shouldTick) return undefined;

    const timer = setInterval(() => go(1), interval);
    return () => clearInterval(timer);
  }, [autoplay, paused, interval, go, slideCount]);

  return { trackRef, active, go, goTo };
}
