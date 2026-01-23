 import React from 'react';
  import { useNode } from '@craftjs/core';
  import { ToolbarSection, ToolbarItem } from './Toolbar';

  export const VideoSettings = () => {
    const {
      actions: { setProp },
      sourceType,
    } = useNode((node) => ({
      sourceType: node.data.props.sourceType || 'youtube',
    }));

    const handleSourceChange = (value) => {
      setProp((props) => {
        props.sourceType = value;
        if (value === 'youtube') {
          props.videoUrl = '';
        } else {
          props.videoId = '';
        }
      }, 500);
    };

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