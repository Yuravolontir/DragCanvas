import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query and re-renders when it changes.
 *
 * `useSyncExternalStore` rather than useState + useEffect: a media query is an
 * external store, and reading it in an effect means one render against a stale
 * answer before the correct one arrives — which for the editor would be a frame
 * of the clipped three-column layout before the preview replaces it.
 *
 * Deliberately not the same question as `useDeviceMode`. That one measures the
 * editor's *canvas container* — how wide is the page the user is drawing — and
 * a 768px window already reports `mobile` there, because the canvas area is only
 * 553px once the panels have taken their share. This one measures the *window*,
 * which is what decides whether the panels fit beside the canvas at all.
 *
 * Conflating the two would make the preview claim a breakpoint the visitor's
 * phone will not use.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onStoreChange) => {
      const list = window.matchMedia?.(query);
      if (!list) return () => {};
      list.addEventListener('change', onStoreChange);
      return () => list.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => window.matchMedia?.(query).matches ?? false,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
