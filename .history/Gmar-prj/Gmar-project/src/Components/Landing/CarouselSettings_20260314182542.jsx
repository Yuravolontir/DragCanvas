  import React from 'react';
  import { ToolbarSection, ToolbarItem} from './Toolbar';

  export const CarouselSettings = () => {
    return (
      <React.Fragment>
        <ToolbarSection title="Content">
            <ToolbarItem full={true} propKey="src1" type="text" label="Image URL" />
             <ToolbarItem full={true} propKey="src2" type="text" label="Image URL" />
              <ToolbarItem full={true} propKey="src3" type="text" label="Image URL" />
              <ToolbarItem full={true} propKey="heading1" type="text" label="Heading" />
                <ToolbarItem full={true} propKey="heading2" type="text" label="Heading" />
                  <ToolbarItem full={true} propKey="text" type="text" label="Heading" />
        </ToolbarSection>
      </React.Fragment>
    );
  };