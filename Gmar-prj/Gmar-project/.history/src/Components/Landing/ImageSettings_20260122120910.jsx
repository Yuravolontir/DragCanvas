  import React from 'react';
  import { ToolbarSection, ToolbarItem} from '../Landing/Toolbar';
  import { ToolbarRadio } from './Toolbar/ToolbarRadio';

  export const ImageSettings = () => {
    return (
      <React.Fragment>
        <ToolbarSection title="Content">
            <ToolbarItem full={true} propKey="src" type="text" label="Image URL" />
            <ToolbarItem
          full={true}
          propKey="radius"
          type="slider"
          label="Radius"
        />
        </ToolbarSection>
      </React.Fragment>
    );
  };