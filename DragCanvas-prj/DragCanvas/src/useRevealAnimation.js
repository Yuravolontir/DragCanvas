import { useEffect } from 'react';

import {
  ANIM_ATTR,
  IN_ATTR,
  READY_CLASS,
  REPEAT_ATTR,
  hasAnimation,
  animationStyleSheet,
  readAnimation,
} from './utils/animation.js';

/** Ask one element to play its entrance again. */
export const REPLAY_EVENT = 'dragcanvas:animation-replay';

/**
 * The stylesheet, mounted once per document.
 *
 * The published page gets the same text inlined by the exporter. Writing it out
 * a second time here by hand is how the canvas ended up disagreeing with the
 * published page about what an animation looks like, so it is imported instead.
 */
let mounted = false;
const mountStyles = () => {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;
  const style = document.createElement('style');
  style.dataset.dcAnimation = '';
  style.textContent = animationStyleSheet();
  document.head.appendChild(style);
  document.documentElement.classList.add(READY_CLASS);
};

/**
 * Play a node's entrance on the canvas the way the published page will.
 *
 * Driven straight on the DOM node rather than through a component's style prop:
 * this has to work for forty elements without any of them knowing about it, and
 * the one place that already holds every node's DOM element is the node
 * renderer. Attributes, not classes, because React owns className on most of
 * these elements and would drop a class on its next render.
 *
 * @param {HTMLElement|null} dom          the node's element
 * @param {object} nodeProps              the node's stored props
 * @param {object} options
 * @param {string} options.fallback       the entrance for a node that stored none
 * @param {boolean} options.forceVisible  show it regardless — a selected element
 *   that happens to be scrolled out of view must not be invisible while its
 *   author is editing it
 * @param {string} options.id             which node, for the replay button
 */
export function useRevealAnimation(dom, nodeProps, { fallback = 'none', forceVisible = false, id } = {}) {
  const spec = readAnimation(nodeProps, fallback);
  const { name, duration, delay, repeat } = spec;

  useEffect(() => {
    if (!dom) return undefined;

    if (!hasAnimation({ name })) {
      dom.removeAttribute(ANIM_ATTR);
      dom.removeAttribute(IN_ATTR);
      dom.removeAttribute(REPEAT_ATTR);
      dom.style.removeProperty('--dc-duration');
      dom.style.removeProperty('--dc-delay');
      return undefined;
    }

    mountStyles();
    dom.setAttribute(ANIM_ATTR, name);
    dom.style.setProperty('--dc-duration', `${duration}ms`);
    dom.style.setProperty('--dc-delay', `${delay}ms`);
    if (repeat) dom.setAttribute(REPEAT_ATTR, '1');
    else dom.removeAttribute(REPEAT_ATTR);

    let frame = 0;
    let arrive = null;
    let leave = null;

    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (forceVisible || still || !('IntersectionObserver' in window)) {
      dom.setAttribute(IN_ATTR, '');
    } else {
      // Arriving is "an eighth of it is on screen", leaving is "none of it is".
      // The gap between the two is what stops a block that sits half in view
      // from flickering, and winding back only ever happens off screen.
      arrive = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        dom.setAttribute(IN_ATTR, '');
        if (!repeat) arrive.disconnect();
      }, { threshold: 0.12 });
      arrive.observe(dom);

      if (repeat) {
        leave = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) return;
          dom.removeAttribute(IN_ATTR);
        }, { threshold: 0 });
        leave.observe(dom);
      }
    }

    const replay = (event) => {
      if (event.detail?.id !== id) return;
      dom.removeAttribute(IN_ATTR);
      // Two frames: the hidden state has to reach the screen before the shown
      // one, or the browser has nothing to animate between and the element
      // simply stays where it is.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => dom.setAttribute(IN_ATTR, ''));
      });
    };
    window.addEventListener(REPLAY_EVENT, replay);

    return () => {
      window.removeEventListener(REPLAY_EVENT, replay);
      cancelAnimationFrame(frame);
      arrive?.disconnect();
      leave?.disconnect();
      dom.removeAttribute(ANIM_ATTR);
      dom.removeAttribute(IN_ATTR);
      dom.removeAttribute(REPEAT_ATTR);
    };
  }, [dom, name, duration, delay, repeat, forceVisible, id]);
}
