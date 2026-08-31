import React from 'react';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';

export const MapSettings = () => {
  return (
    <React.Fragment>
      <ToolbarHelp
        title="Map"
        icon="map"
        examples={['Latitude 32.0853', 'Longitude 34.7818']}
      >
        Shows one place with a pin on it. The label is the name visitors see.
        Latitude and longitude decide where the pin sits — you can copy both
        from the address bar after finding the spot on any map site.
      </ToolbarHelp>
      <ToolbarSection title="Location">
        <ToolbarItem full={true} propKey="label" type="text" label="Label" />
        <ToolbarItem full={true} propKey="address" type="text" label="Street address" />
        <ToolbarItem full={true} propKey="lat" type="number" label="Latitude" />
        <ToolbarItem full={true} propKey="lng" type="number" label="Longitude" />
      </ToolbarSection>
      <ToolbarSection title="View">
        <ToolbarItem full={true} propKey="zoom" type="slider" label="Zoom" min={1} max={18} />
      </ToolbarSection>
    </React.Fragment>
  );
};
