import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/**
 * One Material symbol.
 *
 * The font is already loaded for the interface, so an icon costs nothing beyond
 * the glyph. Named rather than picked from a list on purpose: the full set is
 * about three thousand symbols, and a picker for it is a project of its own.
 */
export const Icon = ({ name, size, color, background, padded }) => {
  const { connectors: { connect } } = useNode();
  const box = Number(size) || 32;

  return (
    <span
      ref={connect}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: padded === 'yes' ? `${box * 2}px` : 'auto',
        height: padded === 'yes' ? `${box * 2}px` : 'auto',
        borderRadius: padded === 'yes' ? '50%' : 0,
        background: padded === 'yes' && background ? `rgba(${Object.values(background)})` : 'transparent',
        color: color ? `rgba(${Object.values(color)})` : undefined,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: `${box}px` }}>
        {name || 'star'}
      </span>
    </span>
  );
};

const IconSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Icon">
      {/* The name is the Material symbol's own, e.g. bolt, schedule, verified */}
      <ToolbarItem full={true} propKey="name" type="text" label="Symbol name" />
      <ToolbarItem full={true} propKey="size" type="slider" label="Size" min={12} max={96} />
      <ToolbarItem full={true} propKey="color" type="color" label="Colour" />
    </ToolbarSection>
    <ToolbarSection title="Backdrop">
      <ToolbarItem full={true} propKey="background" type="bg" label="Circle" />
    </ToolbarSection>
  </React.Fragment>
);

Icon.craft = {
  displayName: 'Icon',
  props: {
    name: 'bolt',
    size: '32',
    padded: 'yes',
    color: { r: 0, g: 64, b: 224, a: 1 },
    background: { r: 238, g: 240, b: 255, a: 1 },
  },
  related: { toolbar: IconSettings },
};
