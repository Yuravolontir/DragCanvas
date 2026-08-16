import { useEffect, useState } from 'react';

/**
 * Does this visitor want animation kept to a minimum?
 *
 * Someone who sets this at the operating-system level is usually saying that
 * movement makes them ill, not that they dislike decoration. An assembling,
 * looping, camera-moving hero is close to the worst case, so the whole scene is
 * replaced by its poster rather than merely slowed down.
 *
 * The preference is watched rather than read once: it can be toggled while the
 * page is open, and honouring that immediately is the point of the setting.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia?.(QUERY).matches ?? false
  );

  useEffect(() => {
    const list = window.matchMedia?.(QUERY);
    if (!list) return;

    const onChange = (event) => setPrefersReduced(event.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}
