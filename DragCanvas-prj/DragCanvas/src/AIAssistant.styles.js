import styled from 'styled-components';

/**
 * Every box of the AI panel, kept out of the component so the JSX shows the
 * structure of the panel rather than a wall of style objects.
 */

const UI_FONT = "'Plus Jakarta Sans', sans-serif";

export const Panel = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto 10px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--outline-light);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

/** The material icon that labels the whole panel. */
export const PanelIcon = styled.span`
  font-size: 18px;
  color: var(--haze);
`;

export const PanelTitle = styled.span`
  font-family: ${UI_FONT};
  font-size: 13px;
  font-weight: 700;
  color: var(--on-surface-variant);
`;

/** The little "Account required" pill next to the panel title. */
export const LockedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--surface-dim);
  color: var(--on-surface-variant);
  font-family: ${UI_FONT};
  font-size: 11px;
  font-weight: 600;

  .material-symbols-outlined {
    font-size: 13px;
  }
`;

export const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

/** Signed out, the box is read-only rather than disabled - see AIAssistant.jsx. */
export const PromptInput = styled.textarea`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--outline-light);
  border-radius: 10px;
  background: var(--surface-dim);
  font-family: ${UI_FONT};
  font-size: 13px;
  outline: none;
  resize: none;
  color: ${({ $locked }) => ($locked ? 'var(--hint)' : 'var(--on-surface)')};
  cursor: ${({ $locked }) => ($locked ? 'pointer' : 'text')};
`;

export const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  border: none;
  border-radius: 9999px;
  background: ${({ $locked }) => ($locked ? 'var(--outline-variant)' : 'var(--haze)')};
  color: var(--on-primary);
  font-family: ${UI_FONT};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  .material-symbols-outlined {
    font-size: 15px;
    color: var(--on-primary);
  }

  &:disabled {
    background: var(--outline-variant);
    cursor: not-allowed;
  }
`;

export const OptionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
`;

export const OptionsLabel = styled.span`
  font-family: ${UI_FONT};
  font-size: 11px;
  color: var(--muted);
`;

/** One of the Safe / Balanced / Bold choices; the picked one is filled in. */
export const StyleButton = styled.button`
  padding: 3px 10px;
  border-radius: 9999px;
  font-family: ${UI_FONT};
  font-size: 11px;
  cursor: pointer;
  font-weight: ${({ $selected }) => ($selected ? 700 : 500)};
  color: ${({ $selected }) => ($selected ? '#fff' : 'var(--muted)')};
  background: ${({ $selected }) => ($selected ? 'var(--haze)' : 'transparent')};
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--haze)' : 'var(--outline-light)')};

  &:disabled {
    cursor: not-allowed;
  }
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 8px;
  font-size: 11px;
  color: var(--muted);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
`;

export const RefineSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--surface-container);
`;

export const RefineHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;

  .material-symbols-outlined {
    font-size: 16px;
    color: var(--haze);
  }
`;

export const RefineTitle = styled.span`
  font-family: ${UI_FONT};
  font-size: 12px;
  font-weight: 700;
  color: var(--on-surface-variant);
`;

export const RefineInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--outline-light);
  border-radius: 10px;
  background: var(--surface-dim);
  color: var(--on-surface);
  font-family: ${UI_FONT};
  font-size: 13px;
  outline: none;
`;

export const ApplyButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 9999px;
  background: var(--on-surface-variant);
  color: var(--on-primary);
  font-family: ${UI_FONT};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    background: var(--outline-variant);
    cursor: not-allowed;
  }
`;

export const HistoryList = styled.div`
  margin-top: 8px;
  font-family: ${UI_FONT};
  font-size: 11px;
  color: var(--muted);
`;

export const HistoryItem = styled.div`
  padding: 2px 0;
`;

export const RefineNote = styled.p`
  margin: 8px 0 0;
  font-family: ${UI_FONT};
  font-size: 11px;
  color: #a09aa8;
`;

export const ErrorText = styled.p`
  margin-top: 5px;
  font-size: 12px;
  color: red;
`;
