import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { groupLines } from '../../utils/elementData.js';

/**
 * Where else to find them.
 *
 * Two lines each: a label and the address. Labels rather than brand icons, because
 * shipping a set of logos means keeping them current and licensed, and a page that
 * says "Instagram" is understood by everyone who can read.
 */
export const SocialLinks = ({ items, color, background, size }) => {
  const { connectors: { connect } } = useNode();
  const records = groupLines(items, 2);

  return (
    <div
      ref={connect}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', width: '100%' }}
    >
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add a name and an address in the panel</p>
      ) : records.map(([label, href], i) => (
        <a
          key={i}
          href={href || '#'}
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: `${size || 14}px`,
            fontWeight: 600,
            textDecoration: 'none',
            background: background ? `rgba(${Object.values(background)})` : 'rgba(0,0,0,0.06)',
            color: color ? `rgba(${Object.values(color)})` : 'inherit',
          }}
        >
          {label}
        </a>
      ))}
    </div>
  );
};

const SocialLinksSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Links">
      <ToolbarItem full={true} propKey="items" type="lines"
        label="Name on one line, address on the next" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="background" type="bg" label="Pill" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
      <ToolbarItem full={true} propKey="size" type="slider" label="Size" min={11} max={20} />
    </ToolbarSection>
  </React.Fragment>
);

SocialLinks.craft = {
  displayName: 'SocialLinks',
  props: {
    items: ['Instagram', 'https://instagram.com/', 'Facebook', 'https://facebook.com/'],
    background: { r: 0, g: 0, b: 0, a: 0.06 },
    color: { r: 26, g: 28, b: 28, a: 1 },
    size: '14',
  },
  related: { toolbar: SocialLinksSettings },
};
