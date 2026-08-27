import { useEditor } from '@craftjs/core';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toolbox } from './Toolbox';

import  AIAssistant  from
  '../../AIAssistant';
import { pageSlugFromHref } from '../../utils/projectPages.js';
import { deviceModeForWidth } from '../../utils/deviceModes.js';
import { DeviceModeProvider } from '../../DeviceModeProvider.jsx';
import { useMediaQuery } from '../../useMediaQuery.js';
import { installTouchDrag } from '../../utils/touchDragBridge.js';

/*
 * Three bands, and the numbers are measured rather than chosen. The shell is
 * Toolbox 104px + Sidebar 300px, so it needs 404px of chrome before the canvas
 * gets a pixel:
 *
 *     window 390   row.scrollWidth 806   sidebar entirely off-screen
 *     window 768   row.scrollWidth 806   sidebar 38px off-screen
 *     window 1024  row.scrollWidth 1024  fits
 *
 * and `overflow-x: hidden` on the row meant the clipped part could not be
 * scrolled to. So: >=1024 unchanged, 768-1023 the panels become overlays,
 * below 768 there is no pretence of editing.
 */
const DRAWERS = '(max-width: 1023px)';
const PREVIEW = '(max-width: 767px)';

  const ViewportDiv = styled.div`
    /*
     * The insets are the sensor housing and the home indicator, which the page
     * now extends under because index.html asks for viewport-fit=cover. They
     * are 0 on everything without a housing, so this is a no-op on a desktop.
     * Defined in responsive.css so a check can override them.
     */
    .viewport {
      position: fixed;
      top: 56px;
      left: var(--safe-left, 0px);
      right: var(--safe-right, 0px);
      bottom: var(--safe-bottom, 0px);
    }

    .device-canvas {
      container-type: inline-size;
      container-name: editor-canvas;
    }

    @container editor-canvas (max-width: 767px) {
      .dc-columns:not(.dc-columns--hold) {
        grid-template-columns: 1fr !important;
      }
    }
  `;

const PreviewBanner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 12px 16px;
  background: var(--surface-container-low, var(--surface-dim));
  border-bottom: 1px solid var(--outline-light);
  color: var(--on-surface-variant);
  font-size: 13px;
  line-height: 1.45;

  strong {
    display: block;
    width: 100%;
    color: var(--on-surface);
    font-size: 14px;
  }

  a {
    color: var(--primary);
    font-weight: 700;
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    text-decoration: underline;
  }
`;

/* Tapping the canvas beside an open drawer should close it, as every drawer does. */
const Scrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 25;
  background: color-mix(in oklab, var(--paper, #000) 35%, transparent);
`;

export const Viewport = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState(() => deviceModeForWidth(window.innerWidth));
  const [openPanel, setOpenPanel] = useState(null);
  const pageRef = useRef(null);
  const drawers = useMediaQuery(DRAWERS);
  const preview = useMediaQuery(PREVIEW);
  const {
    enabled,
    connectors,
    actions: { setOptions },
  } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  useEffect(() => {
    if (!window) {
      return;
    }

    window.requestAnimationFrame(() => {
      setTimeout(() => {
        setOptions((options) => {
          // Below 768 this is a preview, so Craft stays off: no drag, no drop,
          // no selection. It is also written as `!preview` rather than skipped
          // so that resizing *out* of the preview turns editing back on without
          // a reload.
          options.enabled = !preview;
        });
      }, 200);
    });
  }, [setOptions, preview]);

  /*
   * Craft has no touch drag of its own. Called from here rather than at module
   * scope so the listeners are tied to a mounted editor and torn down with it -
   * a side effect on import would be invisible to whoever reads this later.
   */
  useEffect(() => installTouchDrag(), []);

  /*
   * Close the drawer the moment a drag begins.
   *
   * Found by measuring, and it was a bug in the drawer band from the day it
   * shipped: the scrim that closes a panel on a tap outside also sits over the
   * canvas, so a block dragged out of the panel was dropped onto the scrim and
   * nothing happened. Mouse and finger alike - at 1440 a drag added a node, at
   * 900 with a panel open it did not. Tap-to-insert is why nobody noticed.
   *
   * Closing rather than making the scrim transparent: with the panel still
   * open it covers the part of the canvas nearest the block being dragged,
   * which is exactly where someone is most likely to aim.
   */
  useEffect(() => {
    const onDragStart = () => setOpenPanel(null);
    window.addEventListener('dragstart', onDragStart, true);
    return () => window.removeEventListener('dragstart', onDragStart, true);
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;
    const update = () => setDeviceMode(deviceModeForWidth(page.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(page);
    return () => observer.disconnect();
  }, [preview]);

  /*
   * Derived rather than reset in an effect: above 1024 the panels are columns,
   * so "which drawer is open" is not a question that has an answer, and an
   * effect that cleared it would render the wrong layout for one frame first.
   */
  const activePanel = drawers ? openPanel : null;

  const canvas = (assistant) => (
    <div
      // `paper` is not decoration: what is rendered below is the user's own
      // website, drawn by the components that will draw it once published.
      // Letting the editor's dark palette reach it would mean designing
      // against one set of colours and shipping another.
      className={`craftjs-renderer paper flex-1 h-full w-full transition pb-8 overflow-auto ${enabled ? '' : ''}`}
      onClickCapture={(event) => {
        if (enabled) return;
        const link = event.target.closest?.('a[href]');
        if (!link) return;
        const slug = pageSlugFromHref(link.getAttribute('href'));
        if (!slug) return;
        event.preventDefault();
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent('dragcanvas:page-navigate', { detail: { slug } }));
      }}
      style={{ background: enabled ? 'var(--surface-dim, #f7f4ec)' : 'transparent' }}
      ref={(ref) => {
        connectors.select(connectors.hover(ref, null), null);
      }}
    >
      <div
        className="relative flex-col flex items-center pt-8"
        style={{ minWidth: 'min-content' }}
      >
        <div
          className="device-canvas"
          data-device={deviceMode}
          aria-label={`${deviceMode} responsive preview`}
          style={{
            width: '100%',
            maxWidth: '100%',
            minHeight: '100%',
          }}
        >
          {assistant ? <AIAssistant/> : null}
          {children}
        </div>
      </div>
    </div>
  );

  /*
   * Below 768: the real project, read-only, at the phone's real width. Not a
   * dead end and not a shrunken editor — no Header means no save control, and
   * there is no autosave in this codebase, so a phone cannot overwrite a
   * project even by accident.
   */
  if (preview) {
    return (
      <DeviceModeProvider value={deviceMode}>
        <ViewportDiv>
          <div className="viewport">
            <div ref={pageRef} className="flex h-full flex-col w-full">
              <PreviewBanner role="status">
                <strong>Editing needs a wider screen</strong>
                {/*
                  Not "this is your published site". The canvas keeps the width
                  the page was authored at, while the exporter gives a published
                  page a fitted, centred layout — so wide sections scroll here
                  that would not scroll there. Saying otherwise would make this
                  screen lie about the one thing it is for.
                */}
                The elements and settings panels need about 1024px beside the
                canvas, and there is nowhere to put them here. Below is your page,
                read-only — the editor canvas rather than the published layout, so
                wide sections scroll sideways here.{' '}
                <a href="/my-projects">Back to My Projects</a>
              </PreviewBanner>
              {canvas(false)}
            </div>
          </div>
        </ViewportDiv>
      </DeviceModeProvider>
    );
  }

  return (
    <DeviceModeProvider value={deviceMode}>
    <ViewportDiv>
      <div className="viewport" data-panel={activePanel || undefined}>
        <div className="dc-editor-row flex h-full overflow-hidden flex-row w-full">
          <Toolbox offCanvas={drawers && activePanel !== 'toolbox'} />
          <div ref={pageRef} className="page-container flex flex-1 h-full flex-col">
            <Header
              openPanel={activePanel}
              onTogglePanel={drawers ? (panel) => setOpenPanel((open) => (open === panel ? null : panel)) : null}
            />
            {canvas(true)}
          </div>

          <Sidebar offCanvas={drawers && activePanel !== 'sidebar'} />

          {activePanel && (
            <Scrim className="dc-drawer-scrim" onClick={() => setOpenPanel(null)} aria-hidden="true" />
          )}
        </div>
      </div>
    </ViewportDiv>
    </DeviceModeProvider>
  );
};
