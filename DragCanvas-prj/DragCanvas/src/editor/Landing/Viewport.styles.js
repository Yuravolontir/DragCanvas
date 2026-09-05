import styled from 'styled-components';

/** The read-only notice a phone gets instead of the editor chrome. */
export const PreviewBanner = styled.div`
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

export const ViewportDiv = styled.div`
  /*
   * The insets are the sensor housing and the home indicator, which the page
   * now extends under because index.html asks for viewport-fit=cover. They are
   * 0 on everything without a housing, so this is a no-op on a desktop.
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
   * which sits at 30 (drawers) and 40 (the phone panel bar), so adding a navbar
   * to the page hid the Elements panel and the panel bar behind it. The
   * isolation property confines those numbers to the page they belong to and
   * costs no layout, so sticky keeps working exactly as it did.
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

/** Tapping the canvas beside an open drawer should close it, as every drawer does. */
export const Scrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 25;
  background: color-mix(in oklab, var(--paper, #000) 35%, transparent);
`;

/** The Elements / Properties switch shown under a tablet-sized editor. */
export const PanelBar = styled.nav``;
