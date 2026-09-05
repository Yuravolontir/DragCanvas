import React from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList } from './Toolbar/ToolbarRows';
import { useRowProp } from './Toolbar/useRowProp.js';
import { readTeamRows, emptyTeamRow, safeHref, opensNewTab } from '../../utils/elementRows.js';

/**
 * The people behind the thing.
 *
 * A missing photo falls back to the person's initial rather than a broken
 * image — a team page with three grey squares looks worse than one with three
 * letters.
 *
 * A member can carry a link, which is what people expect when they click a
 * face: a profile, a portfolio, an email. It is a real link only outside the
 * editor, so clicking a photograph on the canvas still selects the element
 * instead of navigating the author off their own page.
 */
export const TeamGrid = ({ people, columns, accent, color }) => {
  const { connectors: { connect } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const records = readTeamRows({ people });

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
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first team member in the panel on the right</p>
      ) : records.map((person, i) => {
        const face = person.photo ? (
          <img src={person.photo} alt={person.name || ''} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{
            width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: accent ? `rgba(${Object.values(accent)})` : '#eef0ff',
            fontSize: 32, fontWeight: 700,
          }}>
            {(person.name || '?').trim().charAt(0).toUpperCase()}
          </span>
        );
        const href = safeHref(person.href);
        const live = !enabled && href;

        return (
          <figure key={i} style={{ margin: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {live ? (
              <a
                href={live}
                target={opensNewTab(live) ? '_blank' : undefined}
                rel={opensNewTab(live) ? 'noopener noreferrer' : undefined}
                style={{ display: 'block', lineHeight: 0 }}
              >
                {face}
              </a>
            ) : face}
            <figcaption style={{ color: color ? `rgba(${Object.values(color)})` : undefined }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 16 }}>{person.name}</span>
              <span style={{ display: 'block', fontSize: 13, opacity: 0.65 }}>{person.role}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
};

const TeamGridSettings = () => {
  const { rows, update, add, remove, move } = useRowProp('people', readTeamRows, emptyTeamRow);

  return (
    <React.Fragment>
      <ToolbarHelp title="People" icon="groups">
        One card per person. A photo is optional — leave the address empty and
        the person's initial is shown in a circle instead. Give somebody a link
        and their photo becomes clickable on the published page.
      </ToolbarHelp>

      <ToolbarSection title="People">
        <RowList empty="Nobody added yet." addLabel="Add person" onAdd={add}>
          {rows.map((row, index) => (
            <RowCard
              key={index}
              title={row.name || `Person ${index + 1}`}
              index={index}
              count={rows.length}
              onMove={move}
              onRemove={remove}
              removeLabel="Remove this person"
            >
              <RowField
                label="Name"
                placeholder="Dana Levi"
                value={row.name}
                onChange={(e) => update(index, 'name', e.target.value)}
              />
              <RowField
                label="Role"
                placeholder="Head baker"
                value={row.role}
                onChange={(e) => update(index, 'role', e.target.value)}
              />
              <RowField
                label="Photo address (optional)"
                placeholder="https://example.com/dana.jpg"
                hint="Leave empty to show the first letter of the name instead."
                value={row.photo}
                onChange={(e) => update(index, 'photo', e.target.value)}
              />
              <RowField
                label="Link (optional)"
                placeholder="https://linkedin.com/in/dana"
                hint="Where clicking the photo takes a visitor. An email address works too."
                value={row.href}
                onChange={(e) => update(index, 'href', e.target.value)}
              />
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="columns" type="slider" label="Columns" min={2} max={5} />
        <ToolbarItem full={true} propKey="accent" type="bg" label="Initial circle" />
        <ToolbarItem full={true} propKey="color" type="color" label="Text colour" />
      </ToolbarSection>
    </React.Fragment>
  );
};

TeamGrid.craft = {
  displayName: 'TeamGrid',
  props: {
    people: [
      { name: 'Dana Levi', role: 'Head baker', photo: '', href: '' },
      { name: 'Omer Katz', role: 'Pastry', photo: '', href: '' },
      { name: 'Noa Bar', role: 'Front of house', photo: '', href: '' },
    ],
    columns: '3',
    accent: { r: 238, g: 240, b: 255, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
  },
  related: { toolbar: TeamGridSettings },
};
