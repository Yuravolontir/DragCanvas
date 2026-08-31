import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/**
 * Deliberate empty space.
 *
 * Without one, space is made by putting margins on whatever happens to be next to
 * the gap, which means the gap belongs to an element that has nothing to do with
 * it and disappears when that element is deleted.
 */
export const Spacer = ({ height }) => {
  const { connectors: { connect } } = useNode();

  return (
    <div
      ref={connect}
      style={{ width: '100%', height: `${height || 48}px`, flexShrink: 0 }}
      aria-hidden="true"
    />
  );
};

const SpacerSettings = () => (
  <ToolbarSection title="Space">
    <ToolbarItem full={true} propKey="height" type="slider" label="Height" min={8} max={200} />
  </ToolbarSection>
);

Spacer.craft = {
  displayName: 'Spacer',
  props: { height: '48' },
  related: { toolbar: SpacerSettings },
};
