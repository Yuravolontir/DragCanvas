import { useEditor } from '@craftjs/core';
import { useEffect, useRef, useState } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toolbox } from './Toolbox';
import EditorCanvas from './EditorCanvas.jsx';
import { PanelBar, PreviewBanner, Scrim, ViewportDiv } from './Viewport.styles.js';

import { DeviceModeProvider } from '../../DeviceModeProvider.jsx';
import { useMediaQuery } from '../../useMediaQuery.js';
import { deviceModeForWidth } from '../../utils/deviceModes.js';
import { installTouchDrag } from '../../utils/touchDragBridge.js';
import { editingOverride } from '../editingOverride.js';

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

/** The two drawers a tablet-sized editor can open, one at a time. */
const PANELS = [
  { name: 'toolbox', icon: 'widgets', label: 'Elements' },
  { name: 'sidebar', icon: 'tune', label: 'Properties' },
];

/** Why a phone gets a read-only page instead of the editor. */
function PhoneNotice() {
  return (
    <PreviewBanner role="status">
      <strong>
        <span className="material-symbols-outlined" aria-hidden="true">tablet_mac</span>
        Editing needs a tablet or a computer
      </strong>

      {/*
        Not "this is your published site". The canvas keeps the width the page
        was authored at, while the exporter gives a published page a fitted,
        centred layout - so wide sections scroll here that would not scroll
        there. Saying otherwise would make this screen lie about the one thing
        it is for.
      */}
      The elements and settings panels each need the full width of a phone, which
      leaves nothing of the page to edit against. From a tablet upwards they open
      as drawers over a canvas you can still see. Below is your page, read-only —
      the editor canvas rather than the published layout, so wide sections scroll
      sideways here.

      <span className="preview-banner__links">
        <a href="/my-projects">My projects</a>
        <a href="/inspire-me">Browse templates</a>
      </span>
    </PreviewBanner>
  );
}

/** The bar that opens either drawer on a tablet-sized editor. */
function PanelSwitcher({ activePanel, onToggle }) {
  return (
    <PanelBar className="dc-mobile-editor-bar" aria-label="Editor panels">
      {PANELS.map((panel) => (
        <button
          key={panel.name}
          type="button"
          aria-pressed={activePanel === panel.name}
          onClick={() => onToggle(panel.name)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">{panel.icon}</span>
          {panel.label}
        </button>
      ))}
    </PanelBar>
  );
}

/**
 * The editor shell: elements on the left, the page in the middle, settings on
 * the right - and the two narrower layouts those three collapse into.
 */
export const Viewport = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState(() => deviceModeForWidth(window.innerWidth));
  const [openPanel, setOpenPanel] = useState(null);
  const pageRef = useRef(null);

  const drawers = useMediaQuery(DRAWERS);
  // The query re-runs on rotation and on resize, and nothing is unmounted on
  // the way - a project open in Craft's store survives a phone being turned or
  // a laptop window being dragged narrow and back.
  const phone = useMediaQuery(PHONE);

  const { actions, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  /*
   * A phone cannot edit, so the flag comes down - but it is not this
   * component's flag. The Preview button owns it too, and the rule for sharing
   * it lives in editingOverride, where it can be read and tested rather than
   * inferred from an effect.
   */
  const forcedOff = useRef(false);
  useEffect(() => {
    const next = editingOverride({ phone, enabled, forcedOff: forcedOff.current });
    if (!next) return;

    forcedOff.current = next.forcedOff;
    actions.setOptions((options) => {
      options.enabled = next.enabled;
    });
  }, [phone, enabled, actions]);

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
   * Closing rather than making the scrim transparent: with the panel still open
   * it covers the part of the canvas nearest the block being dragged, which is
   * exactly where someone is most likely to aim.
   */
  useEffect(() => {
    const closeDrawer = () => setOpenPanel(null);
    window.addEventListener('dragstart', closeDrawer, true);
    return () => window.removeEventListener('dragstart', closeDrawer, true);
  }, []);

  /** Keep the responsive preview label honest about how wide the page area is. */
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const measure = () => setDeviceMode(deviceModeForWidth(page.getBoundingClientRect().width));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  /*
   * Derived rather than reset in an effect: above 1024 the panels are columns,
   * so "which drawer is open" is not a question that has an answer, and an
   * effect that cleared it would render the wrong layout for one frame first.
   */
  const activePanel = drawers ? openPanel : null;

  const togglePanel = (panel) => setOpenPanel((open) => (open === panel ? null : panel));

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
              <PhoneNotice />
              <EditorCanvas deviceMode={deviceMode}>{children}</EditorCanvas>
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
                onTogglePanel={drawers ? togglePanel : null}
              />
              <EditorCanvas deviceMode={deviceMode} withAiAssistant>{children}</EditorCanvas>
            </div>

            <Sidebar offCanvas={drawers && activePanel !== 'sidebar'} />

            {activePanel && (
              <Scrim
                className="dc-drawer-scrim"
                onClick={() => setOpenPanel(null)}
                aria-hidden="true"
              />
            )}

            {drawers && enabled && (
              <PanelSwitcher activePanel={activePanel} onToggle={togglePanel} />
            )}
          </div>
        </div>
      </ViewportDiv>
    </DeviceModeProvider>
  );
};
