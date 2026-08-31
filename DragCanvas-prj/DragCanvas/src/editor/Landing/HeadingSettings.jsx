import React from 'react';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarRadio } from './Toolbar/ToolbarRadio';

export const HeadingSettings = () => {
  return (
    <React.Fragment>
      <ToolbarSection title="Heading">
        <ToolbarItem full={true} propKey="text" type="text" label="Text" />
        {/*
          The level is the semantic one, not the size. A page should have a single
          level 1, and the levels below it should not skip - that is what a screen
          reader reads as an outline and what a search engine reads as structure.
          Size is set separately, so a level 2 can look small without lying about
          what it is.
        */}
        <ToolbarItem propKey="level" type="radio" label="Level">
          <ToolbarRadio value="1" label="H1" />
          <ToolbarRadio value="2" label="H2" />
          <ToolbarRadio value="3" label="H3" />
          <ToolbarRadio value="4" label="H4" />
        </ToolbarItem>
      </ToolbarSection>
      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="fontSize" type="slider" label="Size" />
        <ToolbarItem propKey="fontWeight" type="radio" label="Weight">
          <ToolbarRadio value="500" label="Medium" />
          <ToolbarRadio value="700" label="Bold" />
          <ToolbarRadio value="800" label="Heavy" />
        </ToolbarItem>
        <ToolbarItem propKey="textAlign" type="radio" label="Align">
          <ToolbarRadio value="left" label="Left" />
          <ToolbarRadio value="center" label="Center" />
          <ToolbarRadio value="right" label="Right" />
        </ToolbarItem>
      </ToolbarSection>
      <ToolbarSection title="Colour" props={['color']}
        summary={({ color }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 14, height: 14, borderRadius: 3,
              background: color ? `rgba(${Object.values(color)})` : '#000',
            }} />
          </div>
        )}
      >
        <ToolbarItem full={true} propKey="color" type="color" label="Text" />
      </ToolbarSection>
    </React.Fragment>
  );
};
