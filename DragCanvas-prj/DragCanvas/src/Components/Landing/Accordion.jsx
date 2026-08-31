import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList, useRowProp } from './Toolbar/ToolbarRows';
import { readAccordionRows, emptyAccordionRow } from '../../utils/elementRows.js';

/**
 * Questions that open and close.
 *
 * The only element here that needs behaviour, and the only one that cannot be
 * built out of the existing set at all. It publishes as `<details>/<summary>`,
 * which opens and closes with no JavaScript: a page that needs no script is a
 * page that cannot break because a script failed to load.
 *
 * Questions and answers used to be edited as alternating lines in one box. They
 * are a list of records now, edited a question at a time; the old shape is
 * still read, so nothing saved under it lost its FAQ.
 */
export const Accordion = ({ items, background, color, radius }) => {
  const { connectors: { connect } } = useNode();
  const entries = readAccordionRows({ items });

  return (
    <div ref={connect} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first question in the panel on the right</p>
      ) : entries.map(({ question, answer }, i) => (
        <details
          key={i}
          style={{
            background: background ? `rgba(${Object.values(background)})` : '#f4f3f2',
            borderRadius: `${radius ?? 10}px`,
            padding: '14px 18px',
            color: color ? `rgba(${Object.values(color)})` : undefined,
          }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 600, listStyle: 'revert' }}>
            {question}
          </summary>
          <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>{answer}</div>
        </details>
      ))}
    </div>
  );
};

const AccordionSettings = () => {
  const { rows, update, add, remove, move } = useRowProp('items', readAccordionRows, emptyAccordionRow);

  return (
    <React.Fragment>
      <ToolbarHelp title="Questions and answers" icon="expand_circle_down">
        A list of questions visitors ask. Each one stays closed until it is
        clicked, so a long list still reads as a short section. Add as many as
        you need and use the arrows to put the most common one first.
      </ToolbarHelp>

      <ToolbarSection title="Questions">
        <RowList
          empty="No questions yet."
          addLabel="Add question"
          onAdd={add}
        >
          {rows.map((row, index) => (
            <RowCard
              key={index}
              title={`Question ${index + 1}`}
              index={index}
              count={rows.length}
              onMove={move}
              onRemove={remove}
              removeLabel="Remove this question"
            >
              <RowField
                label="Question"
                placeholder="How long does delivery take?"
                value={row.question}
                onChange={(e) => update(index, 'question', e.target.value)}
              />
              <RowField
                label="Answer"
                kind="textarea"
                placeholder="Two to three working days, anywhere in the country."
                value={row.answer}
                onChange={(e) => update(index, 'answer', e.target.value)}
              />
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="background" type="bg" label="Panel colour" />
        <ToolbarItem full={true} propKey="color" type="color" label="Text colour" />
        <ToolbarItem full={true} propKey="radius" type="slider" label="Rounded corners" min={0} max={24} />
      </ToolbarSection>
    </React.Fragment>
  );
};

Accordion.craft = {
  displayName: 'Accordion',
  props: {
    items: [
      {
        question: 'How long does delivery take?',
        answer: 'Two to three working days, anywhere in the country.',
      },
      {
        question: 'Can I change my order?',
        answer: 'Until it ships. After that, send it back and we will refund it.',
      },
    ],
    background: { r: 244, g: 243, b: 242, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
    radius: 10,
  },
  related: { toolbar: AccordionSettings },
};
