import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarRadio } from './Toolbar/ToolbarRadio';

/**
 * A real list.
 *
 * Built out of Texts this is several separate paragraphs that happen to start
 * with a dash - which reads as a list to a person looking at it and as unrelated
 * sentences to anything else. A `<ul>` says "these belong together and there are
 * four of them", which is what a screen reader announces and what survives being
 * restyled.
 */
export const List = ({ items, ordered, fontSize, color, gap }) => {
  const { connectors: { connect } } = useNode();
  const entries = Array.isArray(items) ? items : [];
  const Tag = ordered === 'yes' ? 'ol' : 'ul';

  return (
    <Tag
      ref={connect}
      style={{
        margin: 0,
        paddingLeft: '1.4em',
        listStyle: ordered === 'yes' ? 'decimal' : 'disc',
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap || 8}px`,
        fontSize: `${fontSize || 16}px`,
        color: color ? `rgba(${Object.values(color)})` : undefined,
        lineHeight: 1.6,
      }}
    >
      {entries.length === 0
        ? <li style={{ opacity: 0.5 }}>Add items in the panel</li>
        : entries.map((item, i) => <li key={i}>{item}</li>)}
    </Tag>
  );
};

const ListSettings = () => (
  <React.Fragment>
    <ToolbarSection title="List">
      {/* One item per line: a textarea is the only control here that does not
          need a repeater, and a repeater is a lot of machinery for four lines. */}
      <ToolbarItem full={true} propKey="items" type="lines" label="Items, one per line" />
      <ToolbarItem propKey="ordered" type="radio" label="Style">
        <ToolbarRadio value="no" label="Bulleted" />
        <ToolbarRadio value="yes" label="Numbered" />
      </ToolbarItem>
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="fontSize" type="slider" label="Size" />
      <ToolbarItem full={true} propKey="gap" type="slider" label="Gap" min={0} max={32} />
      <ToolbarItem full={true} propKey="color" type="color" label="Colour" />
    </ToolbarSection>
  </React.Fragment>
);

List.craft = {
  displayName: 'List',
  props: {
    items: ['First item', 'Second item', 'Third item'],
    ordered: 'no',
    fontSize: '16',
    gap: '8',
    color: { r: 67, g: 70, b: 86, a: 1 },
  },
  related: { toolbar: ListSettings },
};
