import React from 'react';

import { ToolbarSection, ToolbarItem } from './Toolbar';

export const VideoSettings = () => {
  let videoId, videoUrl, sourceType;
  
  const fnc=(e) => {
    sourceType = e.target.value;
  }
    return (
      <React.Fragment>
        <ToolbarSection title="Source">
          <ToolbarItem full={true} propKey="sourceType" type="radio" label="Type" >
            <option onChange={fnc} value="youtube">YouTube</option>
            <option onChange={fnc} value="url">Video URL</option>
          </ToolbarItem>
        </ToolbarSection>

        {sourceType === 'youtube' ? (
          <ToolbarSection title="YouTube">
            <ToolbarItem
              full={true}
              propKey="videoId"
              type="text"
              label="Video ID"
              value={videoId}
            />
          </ToolbarSection>
        ) : (
          <ToolbarSection title="Other Source">
            <ToolbarItem
              full={true}
              propKey="videoUrl"
              type="text"
              label="Video URL"
              value={videoUrl}
            />
          </ToolbarSection>
        )}
      </React.Fragment>
    );
  };
