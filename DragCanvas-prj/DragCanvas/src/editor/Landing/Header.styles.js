import styled from 'styled-components';

import { APP_NAV_Z_INDEX } from '../../utils/appNavigation.js';

export const HeaderDiv = styled.div`
  width: 100%;
  min-height: 56px;
  z-index: 99999;
  position: relative;
  padding: 0 12px;
  background: color-mix(in oklab, var(--surface) 96%, transparent);
  border-bottom: 1px solid var(--outline-light, var(--outline-light));
  box-shadow: 0 2px 12px color-mix(in oklab, var(--paper) 7%, transparent);
  display: flex;
`;

export const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  color: 'var(--on-primary)';
  font-size: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  text-decoration: none;
  border: 0;
  transition: all 0.15s ease;
  gap: 5px;
  white-space: nowrap;
  .material-symbols-outlined {
    font-size: 15px;
    color: 'var(--on-primary)';
  }
  &:hover {
    filter: brightness(1.08);
  }
`;

export const Item = styled.a`
  margin-right: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 20px;
    color: var(--muted);
    transition: color 0.15s ease;
  }
  &:hover {
    background: #e3f2fd;
    .material-symbols-outlined {
      color: var(--primary, var(--primary));
    }
  }
  ${(props) =>
    props.$disabled &&
    `
    opacity:0.5;
    cursor: not-allowed;
    pointer-events: none;
  `}
`;

export const Divider = styled.span`
  width: 1px;
  height: 26px;
  background: var(--outline-light, var(--outline-light));
  margin: 0 4px;
`;

export const PagePicker = styled.label`
  display: grid;
  grid-template-columns: 22px minmax(92px, 1fr);
  grid-template-rows: 13px 18px;
  column-gap: 7px;
  align-items: center;
  min-width: 150px;
  height: 42px;
  padding: 4px 9px;
  border: 1px solid var(--outline-light, #dce2ec);
  border-radius: 10px;
  background: var(--surface, #fff);
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
  color: var(--on-surface, #1b2333);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: var(--primary, #0060ac);
  }

  &:focus-within {
    border-color: var(--primary, #0060ac);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary, #0060ac) 18%, transparent);
  }

  > .material-symbols-outlined {
    grid-row: 1 / 3;
    color: var(--primary, #0060ac);
    font-size: 19px;
  }
`;

export const PagePickerLabel = styled.span`
  color: var(--muted, #667085);
  font: 700 9px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const PageSelect = styled.select`
  min-width: 0;
  padding: 0 20px 0 0;
  border: 0;
  outline: 0;
  background-color: transparent;
  color: var(--on-surface, #1b2333);
  cursor: pointer;
  font: 700 13px/18px 'Plus Jakarta Sans', sans-serif;

  option {
    background: #fff;
    color: #1b2333;
  }
`;

/*
 * Only rendered below 1024, where Toolbox and Sidebar are overlays rather than
 * columns. A real <button>, unlike `Item` above, because this one toggles state
 * rather than navigating.
 */
export const PanelToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-right: 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: ${(props) => (props.$on ? 'var(--primary-light, #e3f2fd)' : 'transparent')};
  cursor: pointer;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 20px;
    color: ${(props) => (props.$on ? 'var(--primary)' : 'var(--muted)')};
  }
  &:hover {
    background: var(--primary-light, #e3f2fd);
  }
`;

/*
 * ── The Publish dialog ────────────────────────────────────────
 *
 * Two things this markup is careful about.
 *
 * Height. The card is centred, and a centred flex child taller than its
 * container overflows in both directions - the top half then cannot be reached
 * by scrolling at all. So the scrollbar lives on the body row, the card is
 * capped in `dvh` (the visible height, which `vh` is not on a phone with a
 * retracting URL bar), and the head and foot stay put while the middle moves.
 *
 * Where it renders. The dialog is portalled to <body>. Its markup sits inside
 * the editor header, a flex row that on small screens becomes a horizontally
 * scrolling rail - not somewhere a dialog can be laid out sanely, whatever its
 * position value.
 *
 * The copy is deliberately long: this dialog is where somebody meets the words
 * "SEO", "webhook" and "DNS" for the first time, so every control explains
 * itself. The sections are closed by default, and anyone who already knows what
 * they are doing sees only two radio buttons and a Publish button.
 */
export const PublishOverlay = styled.div`
  position: fixed;
  inset: 0;
  /*
   * Above the app NavBar, which is fixed at APP_NAV_Z_INDEX. Below that number
   * the bar paints over the head of the dialog, and on a short screen the part
   * it covers is the title and the first line of the explanation.
   */
  z-index: ${APP_NAV_Z_INDEX + 100};
  display: grid;
  place-items: center;
  padding: clamp(12px, 3vw, 28px);
  background: rgb(5 7 13 / 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: dc-publish-fade 0.18s ease;

  @keyframes dc-publish-fade {
    from { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const PublishCard = styled.div`
  display: flex;
  flex-direction: column;
  width: min(540px, 100%);
  max-height: 92vh;
  max-height: 92dvh;
  overflow: hidden;
  border: 1px solid var(--outline-light);
  border-radius: var(--radius-xl, 24px);
  background: var(--surface);
  color: var(--on-surface);
  box-shadow: 0 32px 80px rgb(0 0 0 / 0.35);
  font-family: 'Plus Jakarta Sans', sans-serif;
  animation: dc-publish-rise 0.22s cubic-bezier(0.22, 1, 0.36, 1);

  @keyframes dc-publish-rise {
    from { opacity: 0; transform: translateY(12px) scale(0.985); }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const PublishHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--outline-light);

  .dc-publish-badge {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--primary-light);
    color: var(--primary);
  }
  h3 {
    margin: 0 0 2px;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.3;
  }
  p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.55;
    color: var(--hint);
  }

  /* A phone in landscape has ~400px of height in total. The introduction is
     the one thing here that can go without taking a control with it. */
  @media (max-height: 540px) {
    padding: 16px 18px 12px;
    p { display: none; }
  }
`;

export const PublishClose = styled.button`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin: -4px -6px 0 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--surface-dim);
    color: var(--on-surface);
  }
  .material-symbols-outlined { font-size: 20px; }
`;

export const PublishBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 22px;
  scrollbar-width: thin;
`;

export const PublishFoot = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px 18px;
  border-top: 1px solid var(--outline-light);
  background: var(--surface);

  @media (max-width: 460px) {
    flex-wrap: wrap;
    > * { flex: 1 1 auto; }
  }
`;

export const SectionLabel = styled.div`
  margin: ${(props) => (props.$spaced ? '22px 0 10px' : '0 0 10px')};
  font-size: 0.9rem;
  font-weight: 700;

  span {
    display: block;
    margin-top: 3px;
    font-size: 0.76rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--hint);
  }
`;

/* A radio rendered as a card: the whole block is the hit area. */
export const TargetCard = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid ${(props) => (props.$active ? 'var(--primary)' : 'var(--outline-light)')};
  border-radius: 14px;
  background: ${(props) => (props.$active ? 'var(--primary-light)' : 'var(--surface)')};
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: var(--primary);
  }
  input[type='radio'] {
    margin-top: 2px;
    accent-color: var(--primary);
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
  }
  .dc-target-name {
    display: block;
    font-size: 0.88rem;
    font-weight: 600;
  }
`;

/* One collapsed explainer section. The chevron replaces the default marker. */
export const PublishSection = styled.details`
  margin-bottom: 10px;
  border: 1px solid var(--outline-light);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;

  &[open] {
    background: color-mix(in oklab, var(--on-surface) 3%, var(--surface));
  }
  > summary {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.4;
    cursor: pointer;
    list-style: none;
    transition: background 0.15s ease;
  }
  > summary::-webkit-details-marker { display: none; }
  > summary:hover { background: var(--surface-dim); }
  > summary .material-symbols-outlined {
    margin-left: auto;
    font-size: 20px;
    color: var(--muted);
    transition: transform 0.18s ease;
  }
  &[open] > summary .material-symbols-outlined { transform: rotate(180deg); }
  .dc-section-inner { padding: 0 14px 16px; }
`;

export const Explainer = styled.p`
  margin: 0 0 4px;
  padding: 11px 13px;
  border: 1px solid var(--outline-light);
  border-radius: 11px;
  background: var(--surface-container, var(--surface-dim));
  font-size: 0.78rem;
  line-height: 1.65;
  color: var(--on-surface-variant, var(--on-surface));
`;

/* For the two places where the behaviour would otherwise catch people out. */
export const Note = styled.p`
  display: flex;
  gap: 9px;
  margin: 10px 0 0;
  padding: 11px 13px;
  border: 1px solid var(--primary);
  border-radius: 11px;
  background: var(--primary-light);
  font-size: 0.78rem;
  line-height: 1.6;

  .material-symbols-outlined {
    flex: 0 0 auto;
    font-size: 18px;
    color: var(--primary);
  }
`;

export const Field = styled.label`
  display: block;
  margin-top: 14px;
  font-size: 0.8rem;
  font-weight: 600;

  input,
  select {
    display: block;
    width: 100%;
    margin-top: 6px;
    padding: 10px 12px;
    border: 1px solid var(--outline-light);
    border-radius: 11px;
    background: var(--surface-container-high, var(--surface-dim));
    color: var(--on-surface);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 400;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  input::placeholder { color: var(--hint); }
  input:focus,
  select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }
`;

export const CheckField = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  input[type='checkbox'] {
    margin-top: 2px;
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    accent-color: var(--primary);
  }
`;

export const Hint = styled.small`
  display: block;
  margin-top: 6px;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.6;
  color: var(--hint);

  a { color: var(--primary); }
`;

export const TestResult = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0 0;
  padding: 10px 12px;
  border: 1px solid ${(props) => (props.$ok ? 'var(--success, #4caf6a)' : 'var(--error, #e5484d)')};
  border-radius: 11px;
  background: color-mix(in oklab, ${(props) => (props.$ok ? 'var(--success, #4caf6a)' : 'var(--error, #e5484d)')} 12%, transparent);
  font-size: 0.78rem;
  line-height: 1.6;

  .material-symbols-outlined {
    flex: 0 0 auto;
    font-size: 18px;
    color: ${(props) => (props.$ok ? 'var(--success, #4caf6a)' : 'var(--error, #e5484d)')};
  }
`;

export const Steps = styled.ol`
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: dc-step;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--hint);

  li {
    counter-increment: dc-step;
    display: grid;
    grid-template-columns: 20px 1fr;
    gap: 8px;
    padding: 5px 0;
  }
  li::before {
    content: counter(dc-step);
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.7rem;
    font-weight: 700;
  }
  strong { color: var(--on-surface); font-weight: 600; }
  a { color: var(--primary); }
`;

export const PublishPrimary = styled.button`
  flex: 1 1 auto;
  padding: 11px 18px;
  border: 0;
  border-radius: var(--radius-full, 9999px);
  background: var(--primary);
  color: var(--on-primary);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;

  &:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export const PublishGhost = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 16px;
  border: 1px solid ${(props) => (props.$quiet ? 'var(--outline-light)' : 'var(--primary)')};
  border-radius: var(--radius-full, 9999px);
  background: transparent;
  color: ${(props) => (props.$quiet ? 'var(--muted)' : 'var(--primary)')};
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${(props) => (props.$quiet ? 'var(--surface-dim)' : 'var(--primary-light)')};
    color: ${(props) => (props.$quiet ? 'var(--on-surface)' : 'var(--primary)')};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  .material-symbols-outlined { font-size: 18px; }
`;
