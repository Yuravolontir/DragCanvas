  import React from 'react';
  import { ToolbarSection, ToolbarItem } from './Toolbar';
  import { useNode } from '@craftjs/core';

  export const VideoSettings = () => {
    const { actions } = useNode();

    const handleYoutubeChange = (value) => {
      actions.setProp((props) => {
        props.videoId = value;
        props.videoUrl = '';
      }, 500);
      return value;
    };

    const handleUrlChange = (value) => {
      actions.setProp((props) => {
        props.videoUrl = value;
        props.videoId = '';
      }, 500);
      return value;
    };

    return (
      <>
        <ToolbarSection title="YouTube">
          <ToolbarItem
            full
            propKey="videoId"
            type="text"
            label="YouTube Video ID"
            onChange={handleYoutubeChange}
          />
        </ToolbarSection>

        <ToolbarSection title="Video URL (mp4, webm)">
          <ToolbarItem
            full
            propKey="videoUrl"
            type="text"
            label="Video URL"
            onChange={handleUrlChange}
          />
        </ToolbarSection>
      </>
    );
  };