   src/Components/Landing/VideoSettings.jsx
  import React from 'react';
  import { useNode } from '@craftjs/core';
  import { ToolbarSection, ToolbarItem } from './Toolbar';
 
 
 
 
 
 
 
 return (
      <React.Fragment>
        <ToolbarSection title="Source">
          <ToolbarItem
            full={true}
            propKey="sourceType"
            type="select"
            label="Video Source"
            onChange={handleSourceChange}
          >
            <option value="youtube">YouTube</option>
            <option value="url">Video URL</option>
          </ToolbarItem>
        </ToolbarSection>

        {sourceType === 'youtube' ? (
          <ToolbarSection title="YouTube">
            <ToolbarItem
              full={true}
              propKey="videoId"
              type="text"
              label="Video ID"
            />
          </ToolbarSection>
        ) : (
          <ToolbarSection title="Other Source">
            <ToolbarItem
              full={true}
              propKey="videoUrl"
              type="text"
              label="Video URL"
            />
          </ToolbarSection>
        )}
      </React.Fragment>
    );
  };