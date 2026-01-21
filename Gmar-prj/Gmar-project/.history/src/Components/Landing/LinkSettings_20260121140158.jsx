  import React from 'react';
  import { ToolbarSection, ToolbarItem } from '../Landing/Toolbar';

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
          <ToolbarItem full={true} propKey="text" type="text" label="Text" />
          <ToolbarItem full={true} propKey="href" type="text" label="URL" />
        </ToolbarSection>
      </React.Fragment>
    );
  };