/*
 * ── Dragging by finger ────────────────────────────────────────────────────
 *
 * Craft.js 0.2.12 drags with HTML5 drag-and-drop and nothing else:
 *
 *     connectors.create(el, factory)  ->  dragstart + dragend
 *     connectors.drag(el, id)         ->  dragstart + dragend
 *     connectors.drop(el, id)         ->  dragover  + dragenter
 *
 * iOS Safari does not implement that for page elements, so a finger produces
 * touchstart and touchmove and never a dragstart. Nothing gets dragged.
 *
 * This is a bridge, not a layer over craft. Three facts make it possible:
 *
 *   - Craft commits the drop on `dragend`, never on `drop`. A page cannot
 *     synthesise a trustworthy `drop`; `dragend` is ordinary.
 *   - Craft never reads `dataTransfer`. Reconstructing a transfer payload is
 *     the usual reason these shims are painful, and it does not apply.
 *   - The listeners sit on the elements themselves, so a dispatched event
 *     reaches them.
 *
 * So every element that is draggable by mouse becomes draggable by finger, and
 * craft keeps doing all of the actual work - the node tree, the drop rules, the
 * indicator. Elements that appear later are covered for free, because the
 * source is found by asking the DOM at gesture time rather than from a registry.
 */

/** Hold this long before a drag is possible. A guess at the common value, not a measurement. */
const HOLD_MS = 400;

/** Movement beyond this before the hold fires means the finger is scrolling, not dragging. */
const SLOP_PX = 10;

/** How close to an edge starts an autoscroll, and the most it scrolls per frame. */
const EDGE_PX = 64;
const EDGE_SPEED = 18;

const scrollableAncestor = (el) => {
  for (let p = el; p && p !== document.body; p = p.parentElement) {
    const style = getComputedStyle(p);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && p.scrollHeight > p.clientHeight) {
      return p;
    }
  }
  return document.scrollingElement || document.documentElement;
};

/**
 * Installs the bridge. Returns a teardown, so an unmounted editor leaves no
 * listeners behind.
 *
 * Installed unconditionally rather than behind `(pointer: coarse)`. A laptop
 * with a touchscreen reports a *fine* pointer because it also has a mouse,
 * while still producing touch events - gating on pointer type would exclude
 * exactly the machines that have both. It is safe because a mouse never emits
 * a touch event, so on a desktop none of this ever runs.
 */
export function installTouchDrag() {
  if (typeof window === 'undefined' || !('ontouchstart' in window)) return () => {};

  let source = null;      // the [draggable="true"] under the finger
  let holdTimer = null;   // fires HOLD_MS after touchstart
  let armed = false;      // the hold completed: a move from here is a drag
  let dragging = false;   // dragstart has been dispatched
  let startX = 0;
  let startY = 0;
  let pointX = 0;         // latest finger position, read by the frame loop
  let pointY = 0;
  let overTarget = null;  // last element dragenter was sent to
  let frame = null;
  let justDragged = false;

  const transfer = new DataTransfer();

  const fire = (element, type, x, y) =>
    element &&
    element.dispatchEvent(
      new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        dataTransfer: transfer,
        clientX: x,
        clientY: y,
      })
    );

  /*
   * One frame loop does both the scrolling and the dragover, rather than
   * dispatching from touchmove. A finger parked at the edge stops producing
   * touchmove events, so a touchmove-driven autoscroll would scroll once and
   * stop - which is the version that feels broken.
   */
  const step = () => {
    if (!dragging) return;

    const under = document.elementFromPoint(pointX, pointY);
    if (under) {
      const scroller = scrollableAncestor(under);
      const box =
        scroller === document.scrollingElement || scroller === document.documentElement
          ? { top: 0, bottom: window.innerHeight }
          : scroller.getBoundingClientRect();

      // Proportional to depth into the edge zone: a finger just inside creeps,
      // one at the very edge moves quickly. A fixed rate is unaimable.
      const fromTop = pointY - box.top;
      const fromBottom = box.bottom - pointY;
      if (fromTop < EDGE_PX) {
        scroller.scrollTop -= Math.ceil(((EDGE_PX - Math.max(fromTop, 0)) / EDGE_PX) * EDGE_SPEED);
      } else if (fromBottom < EDGE_PX) {
        scroller.scrollTop += Math.ceil(((EDGE_PX - Math.max(fromBottom, 0)) / EDGE_PX) * EDGE_SPEED);
      }

      if (under !== overTarget) {
        fire(under, 'dragenter', pointX, pointY);
        overTarget = under;
      }
      fire(under, 'dragover', pointX, pointY);
    }

    frame = requestAnimationFrame(step);
  };

  const reset = () => {
    clearTimeout(holdTimer);
    if (frame) cancelAnimationFrame(frame);
    // Swept rather than deleted from `source`: a gesture can end down several
    // paths, and a hold marker left behind would keep a stale element looking
    // picked up. Cheap, and there is never more than one.
    document
      .querySelectorAll('[data-touch-drag-armed]')
      .forEach((el) => delete el.dataset.touchDragArmed);
    holdTimer = null;
    frame = null;
    source = null;
    armed = false;
    dragging = false;
    overTarget = null;
  };

  const onTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    const target = event.target;
    const found = target && target.closest && target.closest('[draggable="true"]');
    if (!found) return;

    source = found;
    armed = false;
    dragging = false;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    pointX = startX;
    pointY = startY;

    holdTimer = setTimeout(() => {
      armed = true;
      // Feedback only. `dragstart` waits for movement, so a hold that is
      // released without moving is still a tap - and tapping to insert is the
      // feature this one is built on top of.
      source.dataset.touchDragArmed = 'true';
    }, HOLD_MS);
  };

  const onTouchMove = (event) => {
    if (!source) return;
    const point = event.touches[0];
    pointX = point.clientX;
    pointY = point.clientY;

    if (!armed) {
      // Moved before the hold completed: the finger is scrolling. Stand down
      // and let the page do what it always did.
      if (Math.hypot(pointX - startX, pointY - startY) > SLOP_PX) reset();
      return;
    }

    if (!dragging) {
      dragging = true;
      fire(source, 'dragstart', startX, startY);
      frame = requestAnimationFrame(step);
    }

    // Once a drag is live the page must not scroll on its own, or every
    // coordinate this is computing goes stale. The frame loop scrolls instead.
    event.preventDefault();
  };

  const onTouchEnd = () => {
    if (dragging) {
      fire(source, 'dragend', pointX, pointY);
      // A drag must not also fire the tap-insert, or one gesture adds two
      // blocks. Only a real drag suppresses; an armed-but-unmoved hold does
      // not, so the tap survives.
      justDragged = true;
      setTimeout(() => {
        justDragged = false;
      }, 300);
    }
    reset();
  };

  const onClick = (event) => {
    if (!justDragged) return;
    event.stopPropagation();
    event.preventDefault();
  };

  const options = { capture: true };
  window.addEventListener('touchstart', onTouchStart, { ...options, passive: true });
  window.addEventListener('touchmove', onTouchMove, { ...options, passive: false });
  window.addEventListener('touchend', onTouchEnd, options);
  window.addEventListener('touchcancel', onTouchEnd, options);
  window.addEventListener('click', onClick, options);

  return () => {
    reset();
    window.removeEventListener('touchstart', onTouchStart, options);
    window.removeEventListener('touchmove', onTouchMove, options);
    window.removeEventListener('touchend', onTouchEnd, options);
    window.removeEventListener('touchcancel', onTouchEnd, options);
    window.removeEventListener('click', onClick, options);
  };
}
