import { useNode, useEditor } from '@craftjs/core';
import { ROOT_NODE } from '@craftjs/utils';
import * as React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useDeviceMode } from '../../useDeviceMode.js';
import { responsiveVisibility } from '../../utils/responsiveProps.js';
import { useRevealAnimation } from '../../useRevealAnimation.js';
import { DEFAULT_ANIMATION } from '../../utils/animation.js';

const IndicatorDiv = styled.div`
  height: 30px;
  margin-top: -29px;
  font-size: 12px;
  line-height: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  border-radius: 6px 6px 0 0;

  svg {
    fill: #fff;
    width: 15px;
    height: 15px;
  }
`;

const Btn = styled.button`
  padding: 0 0px;
  border: 0;
  color: inherit;
  background: transparent;
  opacity: 0.9;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: background 0.15s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  > div {
    position: relative;
    top: -50%;
    left: -50%;
  }

  /*
   * A 15px icon is a fine mouse target and a poor finger one - and the move
   * handle below is the only way to pick an element up, so on touch the drag
   * bridge could work perfectly and reordering would still be missed more often
   * than hit. 44px is the usual floor for a fingertip.
   *
   * Only on a coarse pointer: this toolbar is a small floating strip, and
   * inflating it for the mouse would push the other controls around for nothing.
   * The icons keep their size; the hit area grows around them.
   */
  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
  }
`;

export const RenderNode = ({ render }) => {
  const deviceMode = useDeviceMode();
  const { id } = useNode();
  const { actions, query, isActive, enabled } = useEditor((state, query) => ({
    isActive: query.getEvent('selected').contains(id),
    enabled: state.options.enabled,
  }));

  const {
    isHover,
    dom,
    name,
    moveable,
    deletable,
    connectors: { drag },
    parent,
    nodeProps,
    typeName,
  } = useNode((node) => ({
    isHover: node.events.hovered,
    dom: node.dom,
    name: node.data.custom.displayName || node.data.displayName,
    moveable: query.node(node.id).isDraggable(),
    deletable: query.node(node.id).isDeletable(),
    parent: node.data.parent,
    nodeProps: node.data.props,
    typeName: node.data.name || node.data.displayName,
  }));

  /*
   * Every element animates, and no element knows it does.
   *
   * This is the one place that already holds each node's DOM element, so the
   * entrance is driven from here rather than added to forty components — which
   * is also what keeps the canvas and the published page showing the same
   * thing, since both read the same table.
   *
   * A selected or hovered element is always shown. Otherwise an author who
   * clicks a section in the layer list, or drops a new element below the fold,
   * is looking at nothing at all and has no way to know why.
   */
  useRevealAnimation(dom, nodeProps, {
    fallback: id === ROOT_NODE ? 'none' : DEFAULT_ANIMATION[typeName] || 'none',
    forceVisible: enabled && (isActive || isHover),
    id,
  });

  const currentRef = React.useRef(null);

  React.useEffect(() => {
    if (dom) {
      if (isActive || isHover) dom.classList.add('component-selected');
      else dom.classList.remove('component-selected');
      const visible = responsiveVisibility(nodeProps, deviceMode);
      dom.classList.toggle('responsive-node-hidden', !visible && !enabled);
      dom.classList.toggle('responsive-node-hidden-editor', !visible && enabled);
    }
  }, [dom, isActive, isHover, nodeProps, deviceMode, enabled]);

  const getPos = React.useCallback((dom) => {
    const { top, left, bottom } = dom
      ? dom.getBoundingClientRect()
      : { top: 0, left: 0, bottom: 0 };
    return {
      top: `${top > 0 ? top : bottom}px`,
      left: `${left}px`,
    };
  }, []);

  const scroll = React.useCallback(() => {
    const { current: currentDOM } = currentRef;

    if (!currentDOM) {
      return;
    }

    const { top, left } = getPos(dom);
    currentDOM.style.top = top;
    currentDOM.style.left = left;
  }, [dom, getPos]);

  React.useEffect(() => {
    const renderer = document.querySelector('.craftjs-renderer');
    if (!renderer) return;

    renderer.addEventListener('scroll', scroll);

    return () => {
      renderer.removeEventListener('scroll', scroll);
    };
  }, [scroll]);

  return (
    <>
      {isHover || isActive
        ? ReactDOM.createPortal(
            <IndicatorDiv
              ref={currentRef}
              className="px-2 py-2 text-white fixed flex items-center"
              style={{
                left: getPos(dom).left,
                top: getPos(dom).top,
                zIndex: 9999,
                background: 'var(--primary)',
                borderRadius: '6px 6px 0 0',
                boxShadow: '0 2px 8px color-mix(in oklab, var(--primary) 40%, transparent)',
              }}
            >
              <h2 className="flex-1 mr-4">{name}</h2>
              {moveable ? (
                <Btn
                  type="button"
                  className="mr-2 cursor-move"
                  ref={(dom) => {
                    drag(dom);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--on-primary)' }}>open_with</span>
                </Btn>
              ) : null}
              {id !== ROOT_NODE && (
                <Btn
                  type="button"
                  className="mr-2 cursor-pointer"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    actions.selectNode(parent);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--on-primary)' }}>arrow_upward</span>
                </Btn>
              )}
              {deletable ? (
                <Btn
                  type="button"
                  className="cursor-pointer"
                  aria-label={`Delete ${name}`}
                  onPointerDown={(event) => {
                    // In particular, do not let an iframe/video selection
                    // gesture reach Craft before the click deletes this node.
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    actions.delete(id);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--on-primary)' }}>delete</span>
                </Btn>
              ) : null}
            </IndicatorDiv>,
            document.querySelector('.page-container')
          )
        : null}
      {render}
    </>
  );
};
