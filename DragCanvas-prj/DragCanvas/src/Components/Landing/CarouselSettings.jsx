
  import React from 'react';
  import { ToolbarSection, ToolbarItem } from './Toolbar';

  export const CarouselSettings = () => {
    return (
      <React.Fragment>
        <ToolbarSection title="Slide 1">
          <ToolbarItem full={true} propKey="src1" type="text"
  label="Image URL" />
          <ToolbarItem full={true} propKey="heading1" type="text"
  label="Heading" />
          <ToolbarItem full={true} propKey="label1" type="text"
  label="Label" />
          <ToolbarItem full={true} propKey="p1" type="text"
  label="Description" />
        </ToolbarSection>
        <ToolbarSection title="Slide 2">
          <ToolbarItem full={true} propKey="src2" type="text"
  label="Image URL" />
          <ToolbarItem full={true} propKey="heading2" type="text"
  label="Heading" />
          <ToolbarItem full={true} propKey="label2" type="text"
  label="Label" />
          <ToolbarItem full={true} propKey="p2" type="text"
  label="Description" />
        </ToolbarSection>
        <ToolbarSection title="Slide 3">
          <ToolbarItem full={true} propKey="src3" type="text"
  label="Image URL" />
          <ToolbarItem full={true} propKey="heading3" type="text"
  label="Heading" />
          <ToolbarItem full={true} propKey="label3" type="text"
  label="Label" />
          <ToolbarItem full={true} propKey="p3" type="text"
  label="Description" />
        </ToolbarSection>
      </React.Fragment>
    );
  };