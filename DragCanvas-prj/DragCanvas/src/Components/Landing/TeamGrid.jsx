import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { groupLines } from '../../utils/elementData.js';

/**
 * The people behind the thing.
 *
 * Three lines each: name, role, photo URL. A missing photo falls back to the
 * initial rather than a broken image - a team page with three grey squares looks
 * worse than one with three letters.
 */
export const TeamGrid = ({ people, columns, accent, color }) => {
  const { connectors: { connect } } = useNode();
  const records = groupLines(people, 3);

  return (
    <div
      ref={connect}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Number(columns) || 3}, minmax(0, 1fr))`,
        gap: 24,
        width: '100%',
      }}
    >
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add name, role and photo in the panel</p>
      ) : records.map(([name, role, photo], i) => (
        <figure key={i} style={{ margin: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {photo ? (
            <img src={photo} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span style={{
              width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: accent ? `rgba(${Object.values(accent)})` : '#eef0ff',
              fontSize: 32, fontWeight: 700,
            }}>
              {(name || '?').trim().charAt(0).toUpperCase()}
            </span>
          )}
          <figcaption style={{ color: color ? `rgba(${Object.values(color)})` : undefined }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 16 }}>{name}</span>
            <span style={{ display: 'block', fontSize: 13, opacity: 0.65 }}>{role}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
};

const TeamGridSettings = () => (
  <React.Fragment>
    <ToolbarSection title="People">
      <ToolbarItem full={true} propKey="people" type="lines"
        label="Per person: name, role, photo URL — three lines each" />
      <ToolbarItem full={true} propKey="columns" type="slider" label="Columns" min={2} max={5} />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="accent" type="bg" label="Initial circle" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
    </ToolbarSection>
  </React.Fragment>
);

TeamGrid.craft = {
  displayName: 'TeamGrid',
  props: {
    people: ['Dana Levi', 'Head baker', '', 'Omer Katz', 'Pastry', '', 'Noa Bar', 'Front of house', ''],
    columns: '3',
    accent: { r: 238, g: 240, b: 255, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
  },
  related: { toolbar: TeamGridSettings },
};
