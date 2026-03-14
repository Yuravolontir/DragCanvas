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
                  <ToolbarItem full={true} propKey="heading3" type="text" label="Heading" />
                       <ToolbarItem full={true} propKey="label1" type="text" label="Label" />
                        <ToolbarItem full={true} propKey="label2" type="text" label="Label" />
                         <ToolbarItem full={true} propKey="label3" type="text" label="Label" />
                          <ToolbarItem full={true} propKey="p1" type="text" label="Text" />
                            <ToolbarItem full={true} propKey="p2" type="text" label="Text" />
                              <ToolbarItem full={true} propKey="p3" type="text" label="Text" />
        </ToolbarSection>
      </React.Fragment>
    );
  };