import { useNode } from '@craftjs/core';
import React from 'react';
import styled from 'styled-components';

/**
 * The repeater the list elements are edited through.
 *
 * Nine elements hold a list of small records, and every one of them used to be
 * edited as a block of alternating lines in a textarea, explained by a label
 * that said something like "Per person: name, role, photo URL — three lines
 * each". That is a format, not an interface: nothing says which line you are
 * on, deleting a line shifts every record after it, and adding a person means
 * counting.
 *
 * This is the shared alternative: a card per record, a named box per field, and
 * visible Add and Remove buttons. It is written once here because nine
 * hand-rolled repeaters would drift from each other by the third one, and
 * because the Properties panel has a look that a raw <input> does not have.
 */

const Panel = styled.div`
  width: 100%;
  padding: 0 8px 6px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const Card = styled.div`
  margin-bottom: 8px;
  padding: 9px 10px 10px;
  border: 1px solid var(--outline-light, #dce2ec);
  border-radius: 10px;
  background: var(--surface, #fff);
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 7px;
`;

const CardTitle = styled.span`
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

const IconButton = styled.button`
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

const FieldLabel = styled.span`
  display: block;
  margin-bottom: 3px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--muted, #68748a);
`;

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

const Input = styled.input`
  ${controlCss}
`;

const TextArea = styled.textarea`
  ${controlCss}
  resize: vertical;
  min-height: 54px;
`;

const Select = styled.select`
  ${controlCss}
  cursor: pointer;
`;

const FieldWrap = styled.label`
  display: block;
  margin-bottom: 7px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const Hint = styled.span`
  display: block;
  margin-top: 3px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--muted, #68748a);
`;

const AddButton = styled.button`
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

const EmptyNote = styled.p`
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted, #68748a);
`;

const ToggleRow = styled.label`
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

/** One named box. `as` picks between a line, a paragraph and a menu. */
export const RowField = ({ label, hint, kind = 'text', options, ...rest }) => (
  <FieldWrap>
    <FieldLabel>{label}</FieldLabel>
    {kind === 'textarea' ? (
      <TextArea {...rest} />
    ) : kind === 'select' ? (
      <Select {...rest}>
        {(options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    ) : (
      <Input type={kind} {...rest} />
    )}
    {hint ? <Hint>{hint}</Hint> : null}
  </FieldWrap>
);

const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * A named box with its own Remove beside it.
 *
 * For the lists inside a list — the features under a pricing plan — where a
 * whole card per entry would be more furniture than the entry deserves.
 */
export const RowInlineField = ({ label, removeLabel, onRemove, hint, ...rest }) => (
  <FieldWrap as="div">
    {label ? <FieldLabel>{label}</FieldLabel> : null}
    <InlineRow>
      <Input {...rest} />
      <IconButton type="button" $danger title={removeLabel} aria-label={removeLabel} onClick={onRemove}>
        <span className="material-symbols-outlined" aria-hidden="true">close</span>
      </IconButton>
    </InlineRow>
    {hint ? <Hint>{hint}</Hint> : null}
  </FieldWrap>
);

const MiniButton = styled.button`
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

/** A small secondary action inside a card, for adding to a nested list. */
export const RowMiniButton = ({ icon = 'add', children, ...rest }) => (
  <MiniButton type="button" {...rest}>
    <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
    {children}
  </MiniButton>
);

/** A checkbox that reads as a sentence rather than as a property. */
export const RowToggle = ({ label, ...rest }) => (
  <ToggleRow>
    <input type="checkbox" {...rest} />
    {label}
  </ToggleRow>
);

/** One record, with its move and remove controls. */
export const RowCard = ({
  title,
  index,
  count,
  onMove,
  onRemove,
  removeLabel,
  children,
}) => (
  <Card>
    <CardHead>
      <CardTitle>{title}</CardTitle>
      {onMove ? (
        <React.Fragment>
          <IconButton
            type="button"
            title="Move up"
            aria-label={`Move ${title} up`}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
          </IconButton>
          <IconButton
            type="button"
            title="Move down"
            aria-label={`Move ${title} down`}
            disabled={index === count - 1}
            onClick={() => onMove(index, 1)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_downward</span>
          </IconButton>
        </React.Fragment>
      ) : null}
      {onRemove ? (
        <IconButton
          type="button"
          $danger
          title={removeLabel || 'Remove'}
          aria-label={removeLabel || `Remove ${title}`}
          onClick={() => onRemove(index)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">delete</span>
        </IconButton>
      ) : null}
    </CardHead>
    {children}
  </Card>
);

/** The list itself: the cards, an explanation when there are none, and Add. */
export const RowList = ({ empty, addLabel, onAdd, children }) => (
  <Panel>
    {React.Children.count(children) === 0 && empty ? <EmptyNote>{empty}</EmptyNote> : null}
    {children}
    <AddButton type="button" onClick={onAdd}>
      <span className="material-symbols-outlined" aria-hidden="true">add</span>
      {addLabel}
    </AddButton>
  </Panel>
);

/** A plain block inside a ToolbarSection, for controls that are not a list. */
export const RowPanel = ({ children }) => <Panel>{children}</Panel>;

/**
 * Read a list prop as records and write it back as records.
 *
 * The write is what converts a legacy node: whatever shape the list was stored
 * in, the first edit here replaces it with the object form the reader prefers,
 * so a node stops being legacy the moment somebody touches it.
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared hook for the row editor components above
export const useRowProp = (propKey, read, blank) => {
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props }));

  const rows = read(props || {});

  const write = (next) =>
    setProp((draft) => {
      draft[propKey] = next;
    });

  return {
    props: props || {},
    rows,
    setProp,
    update: (index, key, value) =>
      write(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row))),
    replace: (index, row) => write(rows.map((existing, i) => (i === index ? row : existing))),
    add: () => write([...rows, blank()]),
    remove: (index) => write(rows.filter((_, i) => i !== index)),
    move: (index, direction) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      write(next);
    },
    write,
  };
};
