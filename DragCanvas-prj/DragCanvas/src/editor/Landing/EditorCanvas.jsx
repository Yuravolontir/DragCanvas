import { useEditor } from '@craftjs/core';

import AIAssistant from '../../AIAssistant';
import { pageSlugFromHref } from '../../utils/projectPages.js';

/** The width every page in this editor is authored at. */
const AUTHORING_WIDTH = '800px';

/**
 * Follow a link between the user's own pages instead of leaving the editor.
 *
 * A generated navbar links to `/about` and friends. In the editor those are not
 * routes, they are pages of the project, so the click is turned into the event
 * the page switcher listens for.
 */
function interceptPageLinks(event) {
  const link = event.target.closest?.('a[href]');
  if (!link) return;

  const slug = pageSlugFromHref(link.getAttribute('href'));
  if (!slug) return;

  event.preventDefault();
  event.stopPropagation();
  window.dispatchEvent(new CustomEvent('dragcanvas:page-navigate', { detail: { slug } }));
}

/**
 * Connect the scroll area to Craft, so clicking empty space deselects.
 *
 * React calls a ref callback with null as the element goes away, and these
 * connectors answer that by asking Craft to set an event on a node that has
 * just been removed - "Invariant failed: Node does not exist". It was
 * survivable while this canvas only ever unmounted with the whole editor;
 * switching `enabled` rebuilds the tree underneath it, which is what started
 * surfacing it.
 */
function connectCanvas(connectors) {
  return (element) => {
    if (!element) return;
    connectors.select(connectors.hover(element, null), null);
  };
}

/**
 * The scrolling area that holds the user's page.
 *
 * @param {string} deviceMode        'mobile' | 'tablet' | 'desktop', measured by the Viewport
 * @param {boolean} withAiAssistant  show the generator panel above the page
 * @param {React.ReactNode} children the Craft frame with the page itself
 */
export default function EditorCanvas({ deviceMode, withAiAssistant, children }) {
  const { enabled, connectors } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  /*
   * Which way the outer box is sized depends on what it holds.
   *
   * Editing, the canvas is a fixed 800px. `min-content` is what lets it stay
   * 800px in a narrower window and be scrolled to, rather than being squeezed
   * and misreporting the width the page is authored at.
   *
   * Previewing, the canvas is `width: 100%` - and 100% of a box sized by
   * `min-content` is the content's minimum, not the screen. The page came out
   * as narrow as its widest word would allow and then `items-center` put that
   * column in the middle: on a phone, a site rendered across about half the
   * screen. Preview asks for the full width instead, which is what a fluid
   * canvas was supposed to mean.
   */
  const sizingStyle = enabled ? { minWidth: 'min-content' } : { width: '100%' };

  const pageStyle = {
    // Editing uses the same stable measure as the AI generator and the starter
    // canvas. Preview is deliberately fluid, like the published site.
    width: enabled ? AUTHORING_WIDTH : '100%',
    maxWidth: enabled ? 'none' : '100%',
    minHeight: '100%',
  };

  return (
    <div
      // `paper` is not decoration: what is rendered below is the user's own
      // website, drawn by the components that will draw it once published.
      // Letting the editor's dark palette reach it would mean designing against
      // one set of colours and shipping another.
      className="craftjs-renderer paper flex-1 h-full w-full transition pb-8 overflow-auto"
      style={{ background: enabled ? 'var(--surface-dim, #f7f4ec)' : 'transparent' }}
      onClickCapture={interceptPageLinks}
      ref={connectCanvas(connectors)}
    >
      <div className="relative flex-col flex items-center pt-8" style={sizingStyle}>
        <div
          className="device-canvas"
          data-device={deviceMode}
          aria-label={`${deviceMode} responsive preview`}
          style={pageStyle}
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
            * do. A half-typed prompt lives in that component's state, and so
            * does a generation already in flight - dropping either one because
            * somebody wanted to look at their page would be a worse bug than
            * the one being fixed.
            */}
          {withAiAssistant && (
            <div hidden={!enabled} aria-hidden={!enabled}>
              <AIAssistant />
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
