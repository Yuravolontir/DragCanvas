  import React from 'react';
  import { useNode } from '@craftjs/core';
  import { Radio, FormControlLabel } from '@mui/material';
  import { ToolbarSection, ToolbarItem } from './Toolbar';

  export const VideoSettings = () => {


    return (
      <React.Fragment>



          <ToolbarSection title="YouTube">
            <ToolbarItem
              full={true}
              propKey="videoId"
              type="text"
              label="Video ID"
            />
          </ToolbarSection>
     
          <ToolbarSection title="Other Source">
            <ToolbarItem
              full={true}
              propKey="videoUrl"
              type="text"
              label="Video URL"
            />
          </ToolbarSection>
        
      </React.Fragment>
    );
  };