import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { groupLines } from '../../utils/elementData.js';

/**
 * A row of numbers worth saying out loud.
 *
 * Two lines per statistic: the value, then what it counts. The value is set large
 * and the label small, which is the whole trick - a number without a label is
 * decoration, and a label without a number is a sentence.
 */
export const Stats = ({ items, accent, color, align }) => {
  const { connectors: { connect } } = useNode();
  const records = groupLines(items, 2);

  return (
    <div
      ref={connect}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(records.length, 1)}, minmax(0, 1fr))`,
        gap: 24,
        width: '100%',
        textAlign: align || 'center',
      }}
    >
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add a value and a label in the panel</p>
      ) : records.map(([value, label], i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: accent ? `rgba(${Object.values(accent)})` : undefined,
          }}>
            {value}
          </span>
          <span style={{
            fontSize: 14,
            opacity: 0.7,
            color: color ? `rgba(${Object.values(color)})` : undefined,
          }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

const StatsSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Numbers">
      <ToolbarItem full={true} propKey="items" type="lines"
        label="Value on one line, what it counts on the next" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="accent" type="color" label="Numbers" />
      <ToolbarItem full={true} propKey="color" type="color" label="Labels" />
    </ToolbarSection>
  </React.Fragment>
);

Stats.craft = {
  displayName: 'Stats',
  props: {
    items: ['1,200+', 'sites published', '4 min', 'from prompt to live', '99.9%', 'uptime last year'],
    align: 'center',
    accent: { r: 0, g: 64, b: 224, a: 1 },
    color: { r: 67, g: 70, b: 86, a: 1 },
  },
  related: { toolbar: StatsSettings },
};
