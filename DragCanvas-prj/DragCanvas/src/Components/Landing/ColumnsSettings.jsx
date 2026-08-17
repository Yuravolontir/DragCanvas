import React from 'react';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarRadio } from './Toolbar/ToolbarRadio';

export const ColumnsSettings = () => {
  return (
    <React.Fragment>
      <ToolbarSection title="Layout">
        <ToolbarItem propKey="count" type="radio" label="Columns">
          <ToolbarRadio value="2" label="2" />
          <ToolbarRadio value="3" label="3" />
          <ToolbarRadio value="4" label="4" />
        </ToolbarItem>
        <ToolbarItem full={true} propKey="gap" type="slider" label="Gap" min={0} max={80} />
        <ToolbarItem propKey="align" type="radio" label="Align">
          <ToolbarRadio value="flex-start" label="Top" />
          <ToolbarRadio value="center" label="Middle" />
          <ToolbarRadio value="stretch" label="Fill" />
        </ToolbarItem>
      </ToolbarSection>
      <ToolbarSection title="On a phone">
        {/*
          Columns that keep their width on a 375px screen are the single most
          common way a built page breaks, so stacking is the default and turning
          it off is the deliberate choice.
        */}
        <ToolbarItem propKey="stack" type="radio" label="Stack">
          <ToolbarRadio value="yes" label="Stack" />
          <ToolbarRadio value="no" label="Keep side by side" />
        </ToolbarItem>
      </ToolbarSection>
    </React.Fragment>
  );
};
