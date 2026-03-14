  import React from 'react';
  import { ToolbarSection, ToolbarItem} from './Toolbar';

  export const CarouselSettings = () => {
    return (
      <React.Fragment>
        <ToolbarSection title="Content">
            <ToolbarItem full={true} propKey="src1" type="text" label="Image URL" />
             <ToolbarItem full={true} propKey="src2" type="text" label="Image URL" />
              <ToolbarItem full={true} propKey="src3" type="text" label="Image URL" />
            <ToolbarItem
          full={true}
          propKey="radius"
          type="slider"
          label="Radius"
          max={100}
        />
        </ToolbarSection>
      </React.Fragment>
    );
  };