import styled from 'styled-components';
/**
 * The look of the row editor in the Properties panel.
 *
 * One place for all of it, because the panel has a house style that a raw
 * <input> does not have, and nine element editors share these boxes.
 */

export const Panel = styled.div`
  width: 100%;
  padding: 0 8px 6px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

export const Card = styled.div`
  margin-bottom: 8px;
  padding: 9px 10px 10px;
  border: 1px solid var(--outline-light, #dce2ec);
  border-radius: 10px;
  background: var(--surface, #fff);
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 7px;
`;

export const CardTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--on-surface-variant, #3f4a5f);
`;

export const IconButton = styled.button`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: ${(p) => (p.$danger ? '#b42318' : 'var(--muted, #68748a)')};
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  &:hover:not(:disabled) {
    background: ${(p) => (p.$danger ? '#fdeaea' : 'var(--surface-container, #eef1f7)')};
    color: ${(p) => (p.$danger ? '#b42318' : 'var(--primary, #0060ac)')};
  }
  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid var(--primary, #0060ac);
    outline-offset: 1px;
  }
  .material-symbols-outlined {
    font-size: 16px;
  }
`;

export const FieldLabel = styled.span`
  display: block;
  margin-bottom: 3px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--muted, #68748a);
`;

/** Shared by every text box, paragraph box and menu below. */
const controlCss = `
  width: 100%;
  box-sizing: border-box;
  padding: 7px 9px;
  border: 1px solid var(--outline-light, #dce2ec);
  border-radius: 8px;
  background: var(--surface-dim, #f7f9fc);
  color: var(--on-surface, #1b2333);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  &:focus-visible {
    outline: none;
    border-color: var(--primary, #0060ac);
    box-shadow: 0 0 0 3px rgb(0 96 172 / 0.14);
  }
`;

export const Input = styled.input`
  ${controlCss}
`;

export const TextArea = styled.textarea`
  ${controlCss}
  resize: vertical;
  min-height: 54px;
`;

export const Select = styled.select`
  ${controlCss}
  cursor: pointer;
`;

export const FieldWrap = styled.label`
  display: block;
  margin-bottom: 7px;
  &:last-child {
    margin-bottom: 0;
  }
`;

export const Hint = styled.span`
  display: block;
  margin-top: 3px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--muted, #68748a);
`;

export const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 8px;
  border: 1px dashed var(--outline-variant, #b9c2d4);
  border-radius: 10px;
  background: transparent;
  color: var(--primary, #0060ac);
  font: 600 12px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
  &:hover {
    background: var(--primary-light, #eef4fb);
    border-color: var(--primary, #0060ac);
  }
  &:focus-visible {
    outline: 2px solid var(--primary, #0060ac);
    outline-offset: 1px;
  }
  .material-symbols-outlined {
    font-size: 16px;
  }
`;

export const MiniButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid var(--outline-light, #dce2ec);
  border-radius: 999px;
  background: transparent;
  color: var(--primary, #0060ac);
  font: 600 11px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  &:hover {
    background: var(--primary-light, #eef4fb);
  }
  &:focus-visible {
    outline: 2px solid var(--primary, #0060ac);
    outline-offset: 1px;
  }
  .material-symbols-outlined {
    font-size: 14px;
  }
`;

export const EmptyNote = styled.p`
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted, #68748a);
`;

export const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 2px 0 7px;
  font-size: 11.5px;
  color: var(--on-surface-variant, #3f4a5f);
  cursor: pointer;
  input {
    accent-color: var(--primary, #0060ac);
    width: 14px;
    height: 14px;
  }
`;
