import styled from 'styled-components';

/**
 * Every box of the elements panel. Kept beside the component rather than in it,
 * so the panel's JSX shows which parts it is built from.
 */

export const ToolboxDiv = styled.div`
  transition: 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  /* Switching the editor off folds the panel away instead of unmounting it. */
  ${({ $enabled }) => (!$enabled ? 'width: 0; opacity: 0;' : '')}
  background: var(--surface-container-low, var(--surface-dim));
  border-right: 1px solid var(--outline-light, var(--outline-light));
  box-shadow: 2px 0 14px color-mix(in oklab, var(--paper) 6%, transparent);
`;

/*
 * A real <button>, not a <div>. That is what makes the panel reachable: tab
 * order, Enter/Space and an accessible name all come with the element, so no
 * role or tabIndex is needed. The browser's default button styling has to be
 * reset first, or it fights the panel's own.
 */
export const Item = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 78px;
  min-height: 58px;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 8px 6px;
  background: none;
  font: inherit;
  color: inherit;
  text-align: center;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 24px;
    color: var(--muted, var(--muted));
    transition: color 0.15s ease;
  }
  .icon-label {
    font-size: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    color: var(--muted, var(--muted));
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  &:hover {
    background: var(--primary-light, var(--primary-light));
    border-color: var(--primary-container, #dde1ff);
    transform: translateY(-1px);
    .material-symbols-outlined {
      color: var(--primary, var(--primary));
    }
    .icon-label {
      color: var(--primary, var(--primary));
    }
  }
  /* focus-visible, not focus: a mouse drag must not leave a ring behind */
  &:focus-visible {
    outline: 2px solid var(--primary, #4e5ba6);
    outline-offset: 2px;
    background: var(--primary-light, var(--primary-light));
  }
  /* Every entry can also be dragged onto the canvas with a mouse. */
  cursor: move;
`;

export const PanelTitle = styled.div`
  width: 100%;
  padding: 16px 12px 10px;
  font: 700 11px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--on-surface-variant);
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

/*
 * Shown only on a coarse pointer. The panel says nothing about dragging, so
 * there is no false instruction to correct - what is missing is the true one.
 * Craft drags with HTML5 drag-and-drop, which a finger cannot start, so on a
 * touch device the only way in is the press these buttons already accept, and
 * nothing on screen says so.
 */
export const PanelHint = styled.p`
  width: 100%;
  margin: -4px 0 6px;
  padding: 0 12px;
  font: 500 10px/1.35 'Plus Jakarta Sans', sans-serif;
  color: var(--muted);
`;

/* Same type as PanelTitle, plus a disclosure arrow and a hit area. */
export const GroupHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  padding: 12px 10px 6px;
  border: 0;
  background: none;
  font: 700 11px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--on-surface-variant);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  &:hover {
    color: var(--primary, var(--primary));
  }
  &:focus-visible {
    outline: 2px solid var(--primary, #4e5ba6);
    outline-offset: -2px;
    border-radius: 6px;
  }
  .chevron {
    font-size: 16px;
    transition: transform 0.15s ease;
  }
  .chevron.collapsed {
    transform: rotate(-90deg);
  }
`;

export const SearchBox = styled.input`
  width: calc(100% - 16px);
  margin: 10px 8px 4px;
  padding: 6px 8px;
  border: 1px solid var(--outline-light, #d6d9e4);
  border-radius: 8px;
  background: var(--surface, var(--surface-dim));
  color: var(--on-surface, inherit);
  font: 500 11px/1.2 'Plus Jakarta Sans', sans-serif;
  &::placeholder {
    color: var(--muted, #8f99b2);
  }
  &:focus-visible {
    outline: 2px solid var(--primary, #4e5ba6);
    outline-offset: 1px;
  }
`;

export const Empty = styled.div`
  padding: 12px 10px;
  font: 500 10px/1.4 'Plus Jakarta Sans', sans-serif;
  color: var(--muted, #8f99b2);
  text-align: center;
`;
