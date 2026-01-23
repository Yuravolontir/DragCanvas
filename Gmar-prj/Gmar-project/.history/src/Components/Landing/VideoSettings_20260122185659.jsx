import React from 'react';

import { ToolbarSection, ToolbarItem } from './Toolbar';

export const VideoSettings = () => {
  
  return (
    <React.Fragment>
      <ToolbarSection title="Youtube">
        <ToolbarItem
          full={true}
          propKey="videoId"
          type="text"
          label="Video ID"
        />
      </ToolbarSection>
        <ToolbarSection title="Other source">
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
