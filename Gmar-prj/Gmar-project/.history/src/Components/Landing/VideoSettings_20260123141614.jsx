import React from 'react';
import { ToolbarSection, ToolbarItem } from './Toolbar';
import { useNode } from '@craftjs/core';

export const VideoSettings = () => {
  const {
    actions: { setProp },
    videoId,
    videoUrl,
  } = useNode((node) => ({
    videoId: node.data.props.videoId,
    videoUrl: node.data.props.videoUrl,
  }));

const handleYoutubeChange = (value) => {
  setProp((props) => {
    props.videoId = value;
    if (value) props.videoUrl = '';
  });
};

const handleUrlChange = (value) => {
  setProp((props) => {
    props.videoUrl = value;
    if (value) props.videoId = '';
  });
};

  return (
    <>
      <ToolbarSection title="YouTube">
        <ToolbarItem
          full
          propKey="videoId"
          type="text"
          label="YouTube Video ID"
          value={videoId}
          onChange={handleYoutubeChange}
        />
      </ToolbarSection>

      <ToolbarSection title="Video URL">
        <ToolbarItem
          full
          propKey="videoUrl"
          type="text"
          label="Video URL"
          value={videoUrl}
          onChange={handleUrlChange}
        />
      </ToolbarSection>
    </>
  );
};
