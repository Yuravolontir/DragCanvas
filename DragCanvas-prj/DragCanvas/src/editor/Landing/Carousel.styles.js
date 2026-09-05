import styled from 'styled-components';

/**
 * Every box the carousel is drawn from.
 *
 * The strip is plain CSS scroll-snap, which is what the exported page uses
 * too - so the editor and the published site cannot drift apart.
 */

export const Region = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const Track = styled.div`
  --per-view: ${(p) => p.$perView};
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  border-radius: 12px;
  &::-webkit-scrollbar {
    display: none;
  }
  /* the count lives in CSS on both sides; no breakpoint logic in JS */
  @container editor-canvas (max-width: 900px) {
    --per-view: ${(p) => p.$perViewTablet};
  }
  @container editor-canvas (max-width: 600px) {
    --per-view: ${(p) => p.$perViewMobile};
  }
`;

export const Slide = styled.div`
  position: relative;
  flex: 0 0 calc(100% / var(--per-view));
  height: 100%;
  scroll-snap-align: start;
  overflow: hidden;
`;

export const SlideLink = styled.a`
  display: block;
  width: 100%;
  height: 100%;
  color: inherit;
  text-decoration: none;
`;

export const SlideImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/* Absolutely positioned, so a long caption can never make the strip taller. */
/*
 * The scrim starts at 60%, not at transparent.
 *
 * The slide's heading is the topmost line in this box, so a gradient starting
 * at transparent put it straight onto the photograph - white on a bright frame
 * measures 1:1. Every carousel in the gallery captions its slides, which made
 * twenty-one headings depend on which picture somebody happened to choose.
 * White over 60% black clears 5.74:1 against pure white, so the caption reads
 * whatever is behind it.
 */
export const Caption = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px 32px;
  color: #fff;
  background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.9));
  h3 {
    margin: 0 0 4px;
  }
  p {
    margin: 0;
    font-size: 14px;
  }
`;

export const Pill = styled.span`
  display: inline-block;
  padding: 2px 10px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
`;

export const Arrow = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => (p.$side === 'prev' ? 'left: 10px;' : 'right: 10px;')}
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.65);
  }
  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
`;

export const Dots = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
`;

export const Dot = styled.button`
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.45)')};
  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
`;

export const Empty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 1px dashed var(--outline-light, #c4c5d9);
  border-radius: 12px;
  color: var(--muted, #8f99b2);
  font-size: 13px;
`;
