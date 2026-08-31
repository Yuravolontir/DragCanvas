import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/** A rule between two things. */
export const Divider = ({ thickness, color, inset, spacing }) => {
  const { connectors: { connect } } = useNode();

  return (
    <div
      ref={connect}
      style={{ width: '100%', padding: `${spacing || 24}px ${inset || 0}px` }}
    >
      <hr
        style={{
          border: 'none',
          borderTop: `${thickness || 1}px solid ${color ? `rgba(${Object.values(color)})` : 'rgba(0,0,0,0.12)'}`,
          margin: 0,
        }}
      />
    </div>
  );
};

const DividerSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Rule">
      <ToolbarItem full={true} propKey="thickness" type="slider" label="Thickness" min={1} max={8} />
      <ToolbarItem full={true} propKey="color" type="color" label="Colour" />
    </ToolbarSection>
    <ToolbarSection title="Spacing">
      <ToolbarItem full={true} propKey="spacing" type="slider" label="Above and below" min={0} max={96} />
      <ToolbarItem full={true} propKey="inset" type="slider" label="Inset" min={0} max={200} />
    </ToolbarSection>
  </React.Fragment>
);

Divider.craft = {
  displayName: 'Divider',
  props: { thickness: '1', color: { r: 0, g: 0, b: 0, a: 0.12 }, inset: '0', spacing: '24' },
  related: { toolbar: DividerSettings },
};
