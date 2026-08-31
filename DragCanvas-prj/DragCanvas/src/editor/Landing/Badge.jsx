import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/** A small pill of text: "New", "Most popular", "Sold out". */
export const Badge = ({ text, background, color, radius }) => {
  const { connectors: { connect } } = useNode();

  return (
    <span
      ref={connect}
      style={{
        display: 'inline-block',
        padding: '5px 12px',
        borderRadius: `${radius ?? 999}px`,
        background: background ? `rgba(${Object.values(background)})` : '#eef0ff',
        color: color ? `rgba(${Object.values(color)})` : '#0040e0',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {text || 'Badge'}
    </span>
  );
};

const BadgeSettings = () => (
  <ToolbarSection title="Badge">
    <ToolbarItem full={true} propKey="text" type="text" label="Text" />
    <ToolbarItem full={true} propKey="background" type="bg" label="Background" />
    <ToolbarItem full={true} propKey="color" type="color" label="Text colour" />
    <ToolbarItem full={true} propKey="radius" type="slider" label="Roundness" min={0} max={999} />
  </ToolbarSection>
);

Badge.craft = {
  displayName: 'Badge',
  props: {
    text: 'New',
    background: { r: 238, g: 240, b: 255, a: 1 },
    color: { r: 0, g: 64, b: 224, a: 1 },
    radius: 999,
  },
  related: { toolbar: BadgeSettings },
};
