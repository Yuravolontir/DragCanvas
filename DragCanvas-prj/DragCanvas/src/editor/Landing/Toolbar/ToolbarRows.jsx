import { Children } from 'react';

import {
  AddButton,
  Card,
  CardHead,
  CardTitle,
  EmptyNote,
  FieldLabel,
  FieldWrap,
  Hint,
  IconButton,
  InlineRow,
  Input,
  MiniButton,
  Panel,
  Select,
  TextArea,
  ToggleRow,
} from './ToolbarRows.styles.js';

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
 * hand-rolled repeaters would drift from each other by the third one.
 *
 * The list itself is read and written through `useRowProp`, next door.
 */

/** A material icon, which is always decoration next to a real label. */
function Icon({ name }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

/** The box a field is typed into: one line, a paragraph, or a menu. */
function FieldControl({ kind, options, ...rest }) {
  if (kind === 'textarea') return <TextArea {...rest} />;

  if (kind === 'select') {
    return (
      <Select {...rest}>
        {(options || []).map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </Select>
    );
  }

  return <Input type={kind} {...rest} />;
}

/** One named box. `kind` picks between a line, a paragraph and a menu. */
export const RowField = ({ label, hint, kind = 'text', options, ...rest }) => (
  <FieldWrap>
    <FieldLabel>{label}</FieldLabel>
    <FieldControl kind={kind} options={options} {...rest} />
    {hint && <Hint>{hint}</Hint>}
  </FieldWrap>
);

/**
 * A named box with its own Remove beside it.
 *
 * For the lists inside a list — the features under a pricing plan — where a
 * whole card per entry would be more furniture than the entry deserves.
 */
export const RowInlineField = ({ label, removeLabel, onRemove, hint, ...rest }) => (
  <FieldWrap as="div">
    {label && <FieldLabel>{label}</FieldLabel>}
    <InlineRow>
      <Input {...rest} />
      <IconButton
        type="button"
        $danger
        title={removeLabel}
        aria-label={removeLabel}
        onClick={onRemove}
      >
        <Icon name="close" />
      </IconButton>
    </InlineRow>
    {hint && <Hint>{hint}</Hint>}
  </FieldWrap>
);

/** A small secondary action inside a card, for adding to a nested list. */
export const RowMiniButton = ({ icon = 'add', children, ...rest }) => (
  <MiniButton type="button" {...rest}>
    <Icon name={icon} />
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

/** The up and down arrows that reorder one record. */
function MoveButtons({ title, index, count, onMove }) {
  return (
    <>
      <IconButton
        type="button"
        title="Move up"
        aria-label={`Move ${title} up`}
        disabled={index === 0}
        onClick={() => onMove(index, -1)}
      >
        <Icon name="arrow_upward" />
      </IconButton>
      <IconButton
        type="button"
        title="Move down"
        aria-label={`Move ${title} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, 1)}
      >
        <Icon name="arrow_downward" />
      </IconButton>
    </>
  );
}

/** One record, with its move and remove controls. */
export const RowCard = ({ title, index, count, onMove, onRemove, removeLabel, children }) => (
  <Card>
    <CardHead>
      <CardTitle>{title}</CardTitle>

      {onMove && (
        <MoveButtons title={title} index={index} count={count} onMove={onMove} />
      )}

      {onRemove && (
        <IconButton
          type="button"
          $danger
          title={removeLabel || 'Remove'}
          aria-label={removeLabel || `Remove ${title}`}
          onClick={() => onRemove(index)}
        >
          <Icon name="delete" />
        </IconButton>
      )}
    </CardHead>

    {children}
  </Card>
);

/** The list itself: the cards, an explanation when there are none, and Add. */
export const RowList = ({ empty, addLabel, onAdd, children }) => {
  const isEmpty = Children.count(children) === 0;

  return (
    <Panel>
      {isEmpty && empty && <EmptyNote>{empty}</EmptyNote>}
      {children}

      <AddButton type="button" onClick={onAdd}>
        <Icon name="add" />
        {addLabel}
      </AddButton>
    </Panel>
  );
};

/** A plain block inside a ToolbarSection, for controls that are not a list. */
export const RowPanel = ({ children }) => <Panel>{children}</Panel>;
