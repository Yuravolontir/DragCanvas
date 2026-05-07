import React from 'react';
import { ToolbarSection, ToolbarItem } from './Toolbar';

export const MapSettings = () => {
  return (
    <React.Fragment>
      <ToolbarSection title="Location">
        <ToolbarItem full={true} propKey="label" type="text" label="Label" />
        <ToolbarItem full={true} propKey="lat" type="number" label="Latitude" />
        <ToolbarItem full={true} propKey="lng" type="number" label="Longitude" />
      </ToolbarSection>
      <ToolbarSection title="View">
        <ToolbarItem full={true} propKey="zoom" type="slider" label="Zoom" min={1} max={18} />
      </ToolbarSection>
    </React.Fragment>
  );
};
