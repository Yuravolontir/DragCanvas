import React from 'react';
  import { ToolbarSection, ToolbarItem } from './Toolbar';
  import { useNode } from '@craftjs/core';

  export const VideoSettings = () => {
    const { actions, videoId, videoUrl } = useNode((node) => ({
      actions: node.actions,
      videoId: node.data.props.videoId,
      videoUrl: node.data.props.videoUrl,
    }));

    const handleYoutubeChange = (value) => {
      actions.setProp((props) => {
        props.videoId = value;
        if (value) props.videoUrl = '';
      }, 500);
    };

    const handleUrlChange = (value) => {
      actions.setProp((props) => {
        props.videoUrl = value;
        if (value) props.videoId = '';
      }, 500);
    };

    return (
      <>
        <ToolbarSection title="YouTube">
          <ToolbarItem
            full
            type="text"
            label="YouTube Video ID"
            value={videoId}
            onChange={handleYoutubeChange}
          />
        </ToolbarSection>

        <ToolbarSection title="Video URL (mp4, webm)">
          <ToolbarItem
            full
            type="text"
            label="Video URL"
            value={videoUrl}
            onChange={handleUrlChange}
          />
        </ToolbarSection>
      </>
    );
  };