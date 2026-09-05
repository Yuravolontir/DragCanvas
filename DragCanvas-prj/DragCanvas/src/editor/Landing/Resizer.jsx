import { useNode, useEditor } from '@craftjs/core';
import cx from 'classnames';
import debounce from 'debounce';
import { Resizable } from 're-resizable';
import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';

import { Indicators } from './Resizer.styles.js';
import { useDeviceMode } from '../../useDeviceMode.js';
import { responsiveValue, updateResponsiveDraft } from '../../utils/responsiveProps.js';
import {
  isPercentage,
  pxToPercent,
  percentToPx,
  getElementDimensions,
} from '../../utils/numToMeasurement';

/**
 * Empty space kept below the last element of the page.
 *
 * Auto-growing after a drop is not enough: without empty space before the drop
 * there is nowhere to aim the next block.
 */
const ROOT_DROP_RUNWAY = 180;

/** The smallest the page itself may be dragged to. */
const ROOT_MIN_HEIGHT = 96;

const HANDLE_NAMES = [
  'top', 'left', 'bottom', 'right',
  'topLeft', 'topRight', 'bottomLeft', 'bottomRight',
];

/** re-resizable wants one flag per handle; they are all on or all off together. */
function handles(enabled) {
  return Object.fromEntries(HANDLE_NAMES.map((name) => [name, enabled]));
}

/**
 * The size to store for one axis after a drag.
 *
 * A value authored in pixels stays pixels and a percentage stays a percentage,
 * so a drag never quietly changes how an element was written down. The one
 * exception is a parent with no width of its own: a percentage of `auto` means
 * nothing, so the value falls back to pixels.
 *
 * @param {number} pixels        where the drag has taken this axis, in px
 * @param {string} storedValue   what the element currently has saved
 * @param {number} parentSize    the parent's size on this axis, in px
 * @param {boolean} parentIsAuto the parent has no explicit size on this axis
 * @param {number} startPixels   the size when the drag began
 * @param {number} delta         how far the handle has moved
 */
function measurementAfterResize({
  pixels, storedValue, parentSize, parentIsAuto, startPixels, delta,
}) {
  if (!isPercentage(storedValue)) return `${pixels}px`;
  if (parentIsAuto) return `${startPixels + delta}px`;
  return `${pxToPercent(pixels, parentSize)}%`;
}

/**
 * Makes one element of the page draggable by its corners.
 *
 * Craft stores the size on the node, and the same element can hold a different
 * size per device, so every value goes through `responsiveValue` on the way in
 * and `updateResponsiveDraft` on the way out.
 */
export const Resizer = ({ propKey, children, ...props }) => {
  const deviceMode = useDeviceMode();
  const {
    id,
    actions: { setProp },
    connectors: { connect },
    fillSpace,
    nodeWidth,
    nodeHeight,
    responsive,
    parent,
    active,
    inNodeContext,
  } = useNode((node) => ({
    parent: node.data.parent,
    active: node.events.selected,
    nodeWidth: node.data.props[propKey.width],
    nodeHeight: node.data.props[propKey.height],
    responsive: node.data.props.responsive,
    fillSpace: node.data.props.fillSpace,
  }));

  // What this element measures on the device currently being designed for.
  const effectiveWidth = responsiveValue(
    { [propKey.width]: nodeWidth, responsive }, deviceMode, propKey.width,
  );
  const effectiveHeight = responsiveValue(
    { [propKey.height]: nodeHeight, responsive }, deviceMode, propKey.height,
  );

  const { isRootNode, parentDirection, editorEnabled } = useEditor((state, query) => ({
    editorEnabled: state.options.enabled,
    parentDirection: parent && state.nodes[parent]?.data.props.flexDirection,
    isRootNode: query.node(id).isRoot(),
  }));

  const resizable = useRef(null);
  const isResizing = useRef(false);
  // The size the element had when the current drag started.
  const startingBounds = useRef(null);
  const nodeDimensions = useRef({ width: effectiveWidth, height: effectiveHeight });

  // The callbacks below read this ref instead of closing over the dimensions,
  // so they never go stale. Writing it during render is what React forbids -
  // a render that gets discarded would still have written. useLayoutEffect
  // rather than useEffect because it runs before paint, so the resize handlers
  // and the effect below never see a frame-old value while dragging.
  useLayoutEffect(() => {
    nodeDimensions.current = { width: effectiveWidth, height: effectiveHeight };
  });

  // What re-resizable is told to draw right now. It follows the node except
  // during a drag, when it follows the pointer.
  const [internalDimensions, setInternalDimensions] = useState({
    width: effectiveWidth,
    height: effectiveHeight,
  });

  const hasFixedHeight = Boolean(effectiveHeight && effectiveHeight !== 'auto');

  /** A drag works in pixels, so a percentage size is converted before it starts. */
  const showSizeInPixels = useCallback(() => {
    const parentElement = resizable.current?.resizable.parentElement;
    const parentSize = parentElement ? getElementDimensions(parentElement) : null;

    setInternalDimensions({
      width: percentToPx(nodeDimensions.current.width, parentSize && parentSize.width),
      height: percentToPx(nodeDimensions.current.height, parentSize && parentSize.height),
    });
  }, []);

  /** Back to whatever the node itself says, once nothing is being dragged. */
  const showSizeFromNode = useCallback(() => {
    setInternalDimensions({ ...nodeDimensions.current });
  }, []);

  useEffect(() => {
    if (!isResizing.current) showSizeFromNode();
  }, [effectiveWidth, effectiveHeight, showSizeFromNode]);

  useEffect(() => {
    // A percentage size means different pixels after the window changes.
    const onWindowResize = debounce(showSizeFromNode, 1);
    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, [showSizeFromNode]);

  const startResize = (event) => {
    showSizeInPixels();
    event.preventDefault();
    event.stopPropagation();

    const element = resizable.current?.resizable;
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    startingBounds.current = {
      width: bounds.width,
      // The runway is an editor affordance, not page content. Starting a manual
      // resize from its outer edge used to bake that extra gap into the first
      // saved height and made the page look impossible to close.
      height: Math.max(
        ROOT_MIN_HEIGHT,
        bounds.height - (isRootNode && !hasFixedHeight ? ROOT_DROP_RUNWAY : 0),
      ),
    };
    isResizing.current = true;
  };

  const handleResize = (_event, _direction, _element, delta) => {
    const element = resizable.current?.resizable;
    if (!element) return;

    const parentElement = element.parentElement;
    const parentSize = getElementDimensions(parentElement);
    const startWidth = parseInt(startingBounds.current.width, 10);
    const startHeight = parseInt(startingBounds.current.height, 10);

    const width = measurementAfterResize({
      pixels: startWidth + parseInt(delta.width, 10),
      storedValue: nodeWidth,
      parentSize: parentSize.width,
      parentIsAuto: parentElement.style.width === 'auto',
      startPixels: startingBounds.current.width,
      delta: delta.width,
    });

    const height = measurementAfterResize({
      pixels: startHeight + parseInt(delta.height, 10),
      storedValue: nodeHeight,
      parentSize: parentSize.height,
      parentIsAuto: parentElement.style.height === 'auto',
      startPixels: startingBounds.current.height,
      delta: delta.height,
    });

    setProp((prop) => {
      updateResponsiveDraft(prop, deviceMode, propKey.width, width);
      updateResponsiveDraft(prop, deviceMode, propKey.height, height);
    }, 500);
  };

  const stopResize = () => {
    isResizing.current = false;
    showSizeFromNode();
  };

  const style = {
    boxSizing: 'border-box',
    minWidth: 0,
    // A fixed boundary is authoritative. Wide or tall children stay inside it
    // instead of increasing the resizable element's min-content size or
    // painting over the next section on the page.
    overflowX: 'clip',
    overflowY: hasFixedHeight ? 'clip' : 'visible',
    ...props.style,
    // Saved projects and older templates may contain pixel widths larger than
    // their App container. Keep the stored authoring value (so it is not
    // silently rewritten), but never let a child paint outside its current
    // parent. The root App itself remains free to define the canvas measure.
    ...(isRootNode && editorEnabled && !hasFixedHeight
      ? { paddingBottom: `calc(var(--dc-container-padding-bottom, 0px) + ${ROOT_DROP_RUNWAY}px)` }
      : {}),
  };

  return (
    <Resizable
      id={id}
      enable={handles(active && inNodeContext)}
      className={cx([{ 'm-auto': isRootNode, flex: true }])}
      ref={(instance) => {
        if (!instance) return;
        resizable.current = instance;
        connect(instance.resizable);
      }}
      size={internalDimensions}
      onResizeStart={startResize}
      onResize={handleResize}
      onResizeStop={stopResize}
      {...props}
      // A manually resized page uses its saved height; the page itself gets a
      // small, stable minimum rather than being pinned to its current height.
      minHeight={isRootNode && editorEnabled ? `${ROOT_MIN_HEIGHT}px` : props.minHeight}
      maxWidth={isRootNode ? props.maxWidth : (props.maxWidth || '100%')}
      style={style}
    >
      {children}

      {active && (
        <Indicators $bound={fillSpace === 'yes' ? parentDirection : false}>
          <span />
          <span />
          <span />
          <span />
        </Indicators>
      )}
    </Resizable>
  );
};
