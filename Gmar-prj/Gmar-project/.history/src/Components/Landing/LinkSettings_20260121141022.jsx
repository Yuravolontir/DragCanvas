  import React from 'react';
  import { ToolbarSection, ToolbarItem, ToolbarRadio} from '../Landing/Toolbar';

  export const LinkSettings = () => {
    return (
      <React.Fragment>
        <ToolbarSection title="Content">
                  <ToolbarItem
                    full={true}
                    propKey="fontSize"
                    type="slider"
                    label="Font Size"
                  />
          <ToolbarItem propKey="fontWeight" type="radio" label="Weight">
                            <ToolbarRadio value="400" label="Regular" />
                            <ToolbarRadio value="500" label="Medium" />
                            <ToolbarRadio value="700" label="Bold" />
          </ToolbarItem>
          <ToolbarItem full={true} propKey="text" type="text" label="Text" />
          <ToolbarItem full={true} propKey="href" type="text" label="URL" />
        </ToolbarSection>
      </React.Fragment>
    );
  };