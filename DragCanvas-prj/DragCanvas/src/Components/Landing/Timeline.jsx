import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { groupLines } from '../../utils/elementData.js';

/**
 * Steps in order, or a history.
 *
 * Three lines each: the marker (a number, a year, a time), a title, and a line of
 * detail. The connecting rule is drawn between the markers rather than around
 * them, so a list of three and a list of ten both look deliberate.
 */
export const Timeline = ({ steps, accent, color }) => {
  const { connectors: { connect } } = useNode();
  const records = groupLines(steps, 3);
  const line = accent ? `rgba(${Object.values(accent)})` : '#0040e0';

  return (
    <div ref={connect} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add marker, title and detail in the panel</p>
      ) : records.map(([marker, title, detail], i) => (
        <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: line, color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {marker}
            </span>
            {/* No tail after the last one: a line running into nothing reads as a
                step somebody forgot to write */}
            {i < records.length - 1 && (
              <span style={{ flex: 1, width: 2, background: line, opacity: 0.25, minHeight: 24 }} />
            )}
          </div>
          <div style={{ paddingBottom: i < records.length - 1 ? 28 : 0, color: color ? `rgba(${Object.values(color)})` : undefined }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 17 }}>{title}</span>
            <span style={{ display: 'block', fontSize: 14, opacity: 0.7, lineHeight: 1.6, marginTop: 4 }}>{detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const TimelineSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Steps">
      <ToolbarItem full={true} propKey="steps" type="lines"
        label="Per step: marker, title, detail — three lines each" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="accent" type="bg" label="Markers" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
    </ToolbarSection>
  </React.Fragment>
);

Timeline.craft = {
  displayName: 'Timeline',
  props: {
    steps: [
      '1', 'Describe it', 'One sentence is enough to get a full layout.',
      '2', 'Make it yours', 'Move blocks, change the words, swap the pictures.',
      '3', 'Publish', 'One click deploys it and hands you the address.',
    ],
    accent: { r: 0, g: 64, b: 224, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
  },
  related: { toolbar: TimelineSettings },
};
