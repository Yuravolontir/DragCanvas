import { useCallback, useEffect, useState } from 'react';

/**
 * The three beats of the hero, on a loop: prompt → built → live.
 *
 * Only the beat changes here, four times a cycle - the frame-by-frame motion
 * lives inside the canvas and never touches React state, because re-rendering
 * a component tree sixty times a second to move a box is how a scene like this
 * turns into a stutter.
 *
 *   assemble   blocks fly in and snap into the layout
 *   pullback   camera retreats to show the finished page
 *   publish    a browser frame closes around it and the URL types out
 *   hold       it sits there long enough to be read, then the next layout
 */

export const DURATIONS = {
  assemble: 1900,
  pullback: 900,
  publish: 1500,
  hold: 2200,
};

const NEXT = {
  assemble: 'pullback',
  pullback: 'publish',
  publish: 'hold',
  hold: 'assemble',
};

export function useHeroTimeline(layoutCount, { enabled = true } = {}) {
  const [phase, setPhase] = useState('assemble');
  const [index, setIndex] = useState(0);
  // Bumped on every restart so the canvas can reset its clock even when the
  // phase name happens to be the same as before.
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!enabled || layoutCount === 0) return undefined;

    const timer = setTimeout(() => {
      if (phase === 'hold') {
        setIndex(current => (current + 1) % layoutCount);
        setRun(current => current + 1);
      }
      setPhase(NEXT[phase]);
    }, DURATIONS[phase]);

    return () => clearTimeout(timer);
  }, [phase, run, enabled, layoutCount]);

  /** Jump straight to a layout - used by the example chips. */
  const goToLayout = useCallback((next) => {
    setIndex(next);
    setPhase('assemble');
    setRun(current => current + 1);
  }, []);

  return { phase, index, run, goToLayout };
}
