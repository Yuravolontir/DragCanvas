import { useEffect, useRef } from 'react';

/**
 * Brings a section in as it is reached.
 *
 * Written as a class toggle on a ref rather than as React state on purpose: a
 * dozen sections each re-rendering when they cross the viewport is work the
 * browser can do with one class change instead.
 *
 * The revealed state is the resting state in CSS - `.reveal` starts faded and
 * `.is-in` restores it. So a browser without IntersectionObserver, a visitor
 * with reduced motion, and anything that goes wrong all fail the same way: the
 * page is simply already there. Nothing readable is ever gated on an animation
 * having run, which is the failure mode that makes scroll effects dangerous.
 *
 * @param {number} delay stagger in ms, for items in a row
 */
export function useReveal(delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-in');
      return undefined;
    }

    if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      node.classList.add('is-in');
      // One way only. A section that faded out again on the way back up would
      // punish scrolling, which is the opposite of the point.
      observer.disconnect();
    }, { rootMargin: '0px 0px -12% 0px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}
