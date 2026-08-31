/**
 * One vocabulary of entrance animations.
 *
 * Four places have to agree about what "fade up over 600ms" means: the canvas
 * the author is looking at, the page that gets published, the templates in the
 * gallery and the prompt the generator is given. They agreed by coincidence
 * once — the published page faded every section up over 450ms and the canvas
 * did nothing at all, so the only way to see an animation was to publish — and
 * the fix is not to write it four times more carefully. Everything below is
 * generated from ANIMATIONS, including the stylesheet and the script that ship
 * with a published page.
 *
 * The properties are universal: any element can carry them, and no element
 * declares them in its craft defaults, because a default of "animate" would
 * mean every spacer and divider on every page fades in.
 *
 *   animation           which entrance, by name
 *   animationDuration   how long it takes, in milliseconds
 *   animationDelay      how long it waits first, in milliseconds
 *   animationRepeat     whether it plays again on every return to the block
 */

/**
 * The markers, as attributes rather than classes.
 *
 * The canvas drives these straight on the DOM node, underneath React, and
 * React manages className on most of these elements — a class would be wiped
 * out on the component's next render. Nothing manages a data attribute it did
 * not write.
 */
export const ANIM_ATTR = 'data-dc-anim';
export const IN_ATTR = 'data-dc-in';
export const REPEAT_ATTR = 'data-dc-repeat';

/**
 * Set on <html> before the first paint.
 *
 * Without it nothing is hidden, so a page whose script never ran — no
 * JavaScript, a parse error, a crawler that does not execute — is a page that
 * reads normally rather than a blank one.
 */
export const READY_CLASS = 'dc-anim-ready';

export const DEFAULT_DURATION = 600;
export const DEFAULT_DELAY = 0;
const MIN_MS = 0;
const MAX_MS = 4000;

const EASE = 'cubic-bezier(.2,.8,.2,1)';

/**
 * Every entrance on offer, in the order the menu shows them.
 *
 * `from` is the state before the reveal; the reveal is always the same — back
 * to no transform, no filter, full opacity — so a variant is one line and
 * cannot get out of step with its own ending.
 */
export const ANIMATIONS = [
  { value: 'none', label: 'None', from: null },
  { value: 'fade', label: 'Fade in', from: {} },
  { value: 'fadeUp', label: 'Fade up', from: { transform: 'translateY(24px)' } },
  { value: 'fadeDown', label: 'Fade down', from: { transform: 'translateY(-24px)' } },
  { value: 'fadeLeft', label: 'Slide in from the left', from: { transform: 'translateX(-28px)' } },
  { value: 'fadeRight', label: 'Slide in from the right', from: { transform: 'translateX(28px)' } },
  { value: 'zoomIn', label: 'Zoom in', from: { transform: 'scale(0.92)' } },
  { value: 'zoomOut', label: 'Zoom out', from: { transform: 'scale(1.06)' } },
  { value: 'pop', label: 'Pop', from: { transform: 'scale(0.8)' }, easing: 'cubic-bezier(.34,1.56,.64,1)' },
  { value: 'blurIn', label: 'Blur in', from: { filter: 'blur(10px)' } },
  { value: 'tiltUp', label: 'Tilt up', from: { transform: 'perspective(900px) rotateX(14deg)' } },
];

/**
 * Which types animate when nobody said anything.
 *
 * Every section on a published page used to fade up, always, with no way to ask
 * for anything else and no sign of it on the canvas. Sections keep that
 * entrance so pages published before any of this keep looking the way they were
 * published; everything else stands still until an author picks something.
 */
export const DEFAULT_ANIMATION = { Container: 'fadeUp' };

/** The names a stored prop is allowed to hold. */
export const ANIMATION_NAMES = ANIMATIONS.map((entry) => entry.value);

/** The moving ones: everything the stylesheet has to describe a start for. */
const MOVING_ANIMATIONS = ANIMATIONS.filter((entry) => entry.value !== 'none');

const clampMs = (value, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.round(Math.max(MIN_MS, Math.min(MAX_MS, number)));
};

/**
 * What one node's animation actually is, whatever is stored on it.
 *
 * `fallback` is how a node with nothing stored behaves. Sections carry one, so
 * that pages published before any of this existed keep the entrance they were
 * published with; everything else stands still until asked not to.
 */
export function readAnimation(props = {}, fallback = 'none') {
  const stored = props?.animation;
  const unset = stored === undefined || stored === null || stored === '';
  const name = ANIMATION_NAMES.includes(stored)
    ? stored
    : unset && ANIMATION_NAMES.includes(fallback)
      ? fallback
      : 'none';
  return {
    name,
    duration: clampMs(props?.animationDuration, DEFAULT_DURATION),
    delay: clampMs(props?.animationDelay, DEFAULT_DELAY),
    repeat: props?.animationRepeat === true,
  };
}

/** True when this node has an entrance worth wiring anything up for. */
export const hasAnimation = (spec) => Boolean(spec) && spec.name !== 'none';

/**
 * The stylesheet, built from the table above.
 *
 * Keyframes rather than a transition, for one reason worth writing down: a
 * transition has to leave `transform: none` on the finished element to have
 * something to finish at, and that flattens whatever the element does for
 * itself — a button that lifts on hover stopped lifting the moment it was
 * given an entrance. A keyframe with only a `from` block animates towards the
 * element's own styles and then lets go of it completely, so an animated
 * element behaves like an unanimated one the instant it has arrived.
 *
 * `backwards` is what holds the start state through the delay; without it a row
 * staggered by 90ms flashes into view and then animates in from nothing.
 *
 * Everything hangs off the ready class, so the hidden state only exists once
 * something is in a position to undo it.
 */
export function animationStyleSheet() {
  const lines = [
    `.${READY_CLASS} [${ANIM_ATTR}]:not([${IN_ATTR}]) { opacity: 0; }`,
  ];

  for (const entry of MOVING_ANIMATIONS) {
    const from = ['opacity: 0;'];
    if (entry.from?.transform) from.push(`transform: ${entry.from.transform};`);
    if (entry.from?.filter) from.push(`filter: ${entry.from.filter};`);
    lines.push(`@keyframes dc-${entry.value} { from { ${from.join(' ')} } }`);
  }

  for (const entry of MOVING_ANIMATIONS) {
    lines.push(
      `.${READY_CLASS} [${ANIM_ATTR}="${entry.value}"][${IN_ATTR}] {`
      + ` animation: dc-${entry.value} var(--dc-duration, ${DEFAULT_DURATION}ms)`
      + ` ${entry.easing || EASE} var(--dc-delay, ${DEFAULT_DELAY}ms) backwards; }`,
    );
  }

  lines.push(
    '@media (prefers-reduced-motion: reduce) {',
    `  .${READY_CLASS} [${ANIM_ATTR}]:not([${IN_ATTR}]) { opacity: 1; }`,
    `  .${READY_CLASS} [${ANIM_ATTR}][${IN_ATTR}] { animation: none; }`,
    '}',
  );
  return lines.join('\n');
}

/**
 * The reveal, as a body of JavaScript for the published page.
 *
 * Two observers rather than one reading ratios: arriving is "an eighth of it is
 * on screen", leaving is "none of it is", and the gap between the two is what
 * stops a block sitting half in view from flickering in and out. The second one
 * is only given the blocks that asked to play again; everything else is let go
 * of the moment it has been seen.
 *
 * Expects a `reduced` variable in scope — the page reads the motion preference
 * once and several features share the answer.
 */
export function animationRuntime() {
  return `var animated = document.querySelectorAll('[${ANIM_ATTR}]');
  if (animated.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      animated.forEach(function (el) { el.setAttribute('${IN_ATTR}', ''); });
    } else {
      var arrive = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('${IN_ATTR}', '');
          if (entry.target.getAttribute('${REPEAT_ATTR}') !== '1') arrive.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      var leave = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) entry.target.removeAttribute('${IN_ATTR}');
        });
      }, { threshold: 0 });
      animated.forEach(function (el) {
        arrive.observe(el);
        if (el.getAttribute('${REPEAT_ATTR}') === '1') leave.observe(el);
      });
    }
  }`;
}
