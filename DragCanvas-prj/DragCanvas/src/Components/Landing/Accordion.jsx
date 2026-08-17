import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { pairUp } from '../../utils/elementData.js';

/**
 * Questions that open and close.
 *
 * The only element here that needs behaviour, and the only one that cannot be
 * built out of the existing set at all. It publishes as `<details>/<summary>`,
 * which opens and closes with no JavaScript: a page that needs no script is a
 * page that cannot break because a script failed to load.
 *
 * Questions and answers are edited as alternating lines rather than through a
 * repeater - the same trade as the List element, and the same reasoning.
 */
export const Accordion = ({ items, background, color, radius }) => {
  const { connectors: { connect } } = useNode();
  const entries = pairUp(items);

  return (
    <div ref={connect} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add a question and an answer in the panel</p>
      ) : entries.map(([question, answer], i) => (
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

const AccordionSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Questions">
      {/* Question, then its answer, then the next question. Stated in the label
          because a list of alternating lines is not self-evident. */}
      <ToolbarItem full={true} propKey="items" type="lines"
        label="One line per question, answer on the line below" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="background" type="bg" label="Panel" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
      <ToolbarItem full={true} propKey="radius" type="slider" label="Roundness" min={0} max={24} />
    </ToolbarSection>
  </React.Fragment>
);

Accordion.craft = {
  displayName: 'Accordion',
  props: {
    items: [
      'How long does delivery take?',
      'Two to three working days, anywhere in the country.',
      'Can I change my order?',
      'Until it ships. After that, send it back and we will refund it.',
    ],
    background: { r: 244, g: 243, b: 242, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
    radius: 10,
  },
  related: { toolbar: AccordionSettings },
};
