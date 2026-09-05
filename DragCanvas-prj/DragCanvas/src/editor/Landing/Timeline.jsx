import React from 'react';
import { readableInkCss } from '../../utils/readableInk.js';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList } from './Toolbar/ToolbarRows';
import { useRowProp } from './Toolbar/useRowProp.js';
import { readTimelineRows, emptyTimelineRow } from '../../utils/elementRows.js';

/**
 * Steps in order, or a history.
 *
 * Each entry has a marker — a number, a year, a time — a title and a line of
 * detail. The connecting rule is drawn between the markers rather than around
 * them, so a list of three and a list of ten both look deliberate.
 */
export const Timeline = ({ steps, accent, color }) => {
  const { connectors: { connect } } = useNode();
  const records = readTimelineRows({ steps });
  const line = accent ? `rgba(${Object.values(accent)})` : '#0040e0';

  return (
    <div ref={connect} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first step in the panel on the right</p>
      ) : records.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: line, color: readableInkCss(accent), fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {row.marker}
            </span>
            {/* No tail after the last one: a line running into nothing reads as a
                step somebody forgot to write */}
            {i < records.length - 1 && (
              <span style={{ flex: 1, width: 2, background: line, opacity: 0.25, minHeight: 24 }} />
            )}
          </div>
          <div style={{ paddingBottom: i < records.length - 1 ? 28 : 0, color: color ? `rgba(${Object.values(color)})` : undefined }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 17 }}>{row.title}</span>
            <span style={{ display: 'block', fontSize: 14, lineHeight: 1.6, marginTop: 4 }}>{row.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const TimelineSettings = () => {
  const { rows, update, add, remove, move } = useRowProp('steps', readTimelineRows, emptyTimelineRow);

  return (
    <React.Fragment>
      <ToolbarHelp title="Steps" icon="timeline" examples={['1 · 2019 · March · Day one']}>
        A list in order, drawn down the page with a line joining the markers. Use
        it for how something works, or for a history. The date or number sits in
        the circle, so keep it to a few characters.
      </ToolbarHelp>

      <ToolbarSection title="Steps">
        <RowList empty="No steps yet." addLabel="Add step" onAdd={add}>
          {rows.map((row, index) => (
            <RowCard
              key={index}
              title={row.title || `Step ${index + 1}`}
              index={index}
              count={rows.length}
              onMove={move}
              onRemove={remove}
              removeLabel="Remove this step"
            >
              <RowField
                label="Date or number"
                placeholder="2019"
                hint="What goes in the circle. A year, a step number or a month."
                value={row.marker}
                onChange={(e) => update(index, 'marker', e.target.value)}
              />
              <RowField
                label="Title"
                placeholder="We opened the first shop"
                value={row.title}
                onChange={(e) => update(index, 'title', e.target.value)}
              />
              <RowField
                label="Description"
                kind="textarea"
                placeholder="Six tables, one oven and a queue down the street."
                value={row.detail}
                onChange={(e) => update(index, 'detail', e.target.value)}
              />
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="accent" type="bg" label="Marker colour" />
        <ToolbarItem full={true} propKey="color" type="color" label="Text colour" />
      </ToolbarSection>
    </React.Fragment>
  );
};

Timeline.craft = {
  displayName: 'Timeline',
  props: {
    steps: [
      { marker: '1', title: 'Describe it', detail: 'One sentence is enough to get a full layout.' },
      { marker: '2', title: 'Make it yours', detail: 'Move blocks, change the words, swap the pictures.' },
      { marker: '3', title: 'Publish', detail: 'One click deploys it and hands you the address.' },
    ],
    accent: { r: 0, g: 64, b: 224, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
  },
  related: { toolbar: TimelineSettings },
};
