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

/*
 * A phone does not edit, in either orientation.
 *
 * Both panels run the full width of the shell. Upright that width is ~400px:
 * the open drawer covers the canvas completely, so every insert is made blind
 * and the settings panel edits something nobody can see. Turned sideways the
 * drawer is wide enough, but the canvas it leaves is under 400px tall - a strip
 * two elements deep, with the keyboard taking half of it the moment any text is
 * touched. Neither is editing; one is just worse at admitting it.
 *
 * Two bounds, because a phone lies about its width when it is turned: 767px
 * catches it upright, and a viewport shorter than 600px catches it sideways. A
 * tablet is 768x1024 and clears both, so it keeps the editor, with the panels
 * as drawers.
 */
const PHONE = '(max-width: 767px), (max-height: 599px) and (orientation: landscape)';

const PreviewBanner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px calc(14px + var(--safe-bottom, 0px));
  border-bottom: 1px solid var(--outline-light, #dce2ec);
  background: var(--surface, #fff);
  color: var(--on-surface-variant, #3f4a5f);
  font: 500 13px/1.45 'Plus Jakarta Sans', sans-serif;
  strong {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--on-surface, #1b2333);
    font-size: 15px;
  }
  .material-symbols-outlined {
    font-size: 20px;
  }
  a {
    color: var(--primary, #4e5ba6);
    font-weight: 700;
  }
  .preview-banner__links {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 8px;
  }
`;

  const ViewportDiv = styled.div`
    /*
     * The insets are the sensor housing and the home indicator, which the page
     * now extends under because index.html asks for viewport-fit=cover. They
     * are 0 on everything without a housing, so this is a no-op on a desktop.
     * Defined in responsive.css so a check can override them.
     */
    .viewport {
      position: fixed;
      top: var(--app-nav-height, 56px);
      left: var(--safe-left, 0px);
      right: var(--safe-right, 0px);
      bottom: var(--safe-bottom, 0px);
    }

    /*
     * The canvas gets a stacking context of its own.
     *
     * What is rendered inside it is the user's website, and it is allowed to
     * carry any z-index it likes - a sticky navbar ships with 1000. Without a
     * context here that number competed directly with the editor's own chrome,
     * which sits at 30 (drawers) and 40 (the phone panel bar), so adding a
     * navbar to the page hid the Elements panel and the panel bar behind it.
     * The isolation property confines those numbers to the page they belong
     * to and costs no layout, so sticky keeps working exactly as it did.
     */
    .craftjs-renderer {
      isolation: isolate;
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

/* Tapping the canvas beside an open drawer should close it, as every drawer does. */
const Scrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 25;
  background: color-mix(in oklab, var(--paper, #000) 35%, transparent);
`;

const MobilePanelBar = styled.nav``;

export const Viewport = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState(() => deviceModeForWidth(window.innerWidth));
  const [openPanel, setOpenPanel] = useState(null);
  const pageRef = useRef(null);
  const drawers = useMediaQuery(DRAWERS);
  // The query re-runs on rotation and on resize, and nothing is unmounted on
  // the way - a project open in Craft's store survives a phone being turned or
  // a laptop window being dragged narrow and back.
  const phone = useMediaQuery(PHONE);
  const {
    enabled,
    connectors,
  } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

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
  }, []);

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
            // Editing uses the same stable measure as the AI generator and the
            // starter canvas. Preview is deliberately fluid, like the site.
            width: enabled ? '800px' : '100%',
            maxWidth: enabled ? 'none' : '100%',
            minHeight: '100%',
          }}
        >
          {/*
            * Preview is the page, and nothing but the page.
            *
            * The elements and properties panels collapse themselves when the
            * editor is switched off; this one sits inside the canvas and did
            * not, so pressing Preview left a generator panel printed above the
            * user's own hero.
            *
            * Hidden rather than unmounted, which is also what those two panels
            * do. A half-typed prompt lives in this component's state, and so
            * does a generation already in flight — dropping either one because
            * somebody wanted to look at their page would be a worse bug than
            * the one being fixed.
            */}
          {assistant ? (
            <div hidden={!enabled} aria-hidden={!enabled}>
              <AIAssistant />
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );

  /*
   * A phone: the real project, read-only, at the phone's real width.
   *
   * Not a dead end and not a shrunken editor - no Header means no save control,
   * and there is no autosave in this codebase, so a phone cannot overwrite a
   * project even by accident. Somebody who arrived here on a phone still has
   * somewhere to go: their own work, and the gallery, both of which read
   * perfectly at this width.
   */
  if (phone) {
    return (
      <DeviceModeProvider value={deviceMode}>
        <ViewportDiv>
          <div className="viewport">
            <div ref={pageRef} className="flex h-full flex-col w-full">
              <PreviewBanner role="status">
                <strong>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    tablet_mac
                  </span>
                  Editing needs a tablet or a computer
                </strong>
                {/*
                  Not "this is your published site". The canvas keeps the width
                  the page was authored at, while the exporter gives a published
                  page a fitted, centred layout — so wide sections scroll here
                  that would not scroll there. Saying otherwise would make this
                  screen lie about the one thing it is for.
                */}
                The elements and settings panels each need the full width of a
                phone, which leaves nothing of the page to edit against. From a
                tablet upwards they open as drawers over a canvas you can still
                see. Below is your page, read-only — the editor canvas rather
                than the published layout, so wide sections scroll sideways here.
                <span className="preview-banner__links">
                  <a href="/my-projects">My projects</a>
                  <a href="/inspire-me">Browse templates</a>
                </span>
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
          <Toolbox drawer={drawers} offCanvas={drawers && activePanel !== 'toolbox'} />
          <div ref={pageRef} className="page-container flex flex-1 h-full min-w-0 flex-col">
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

          {drawers && enabled && (
            <MobilePanelBar className="dc-mobile-editor-bar" aria-label="Editor panels">
              <button
                type="button"
                aria-pressed={activePanel === 'toolbox'}
                onClick={() => setOpenPanel((open) => (open === 'toolbox' ? null : 'toolbox'))}
              >
                <span className="material-symbols-outlined" aria-hidden="true">widgets</span>
                Elements
              </button>
              <button
                type="button"
                aria-pressed={activePanel === 'sidebar'}
                onClick={() => setOpenPanel((open) => (open === 'sidebar' ? null : 'sidebar'))}
              >
                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                Properties
              </button>
            </MobilePanelBar>
          )}
        </div>
      </div>
    </ViewportDiv>
    </DeviceModeProvider>
  );
};
