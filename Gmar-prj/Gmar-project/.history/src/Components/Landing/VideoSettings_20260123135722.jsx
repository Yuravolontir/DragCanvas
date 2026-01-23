import React, { useState } from 'react';
import { ToolbarSection, ToolbarItem } from './Toolbar';
import { useNode } from '@craftjs/core';

export const VideoSettings = () => {

const handleSourceChange = (e) => {
  const value = e.target.value;

  setProp((props) => {
    props.sourceType = value;
    props.videoId = '';
    props.videoUrl = '';
  });
};

const handleValueChange = (e) => {
  const value = e.target.value;

  setProp((props) => {
    if (props.sourceType === 'youtube') {
      props.videoId = value;
      props.videoUrl = '';
    } else {
      props.videoUrl = value;
      props.videoId = '';
    }
  });
};

  return (
    <>
      <ToolbarSection title="Source">
        <ToolbarItem
          full
          propKey="sourceType"
          type="radio"
          label="Type"
          value={sourceType}
          onChange={handleSourceChange}
        >
          <option value="youtube">YouTube</option>
          <option value="url">Video URL</option>
        </ToolbarItem>
      </ToolbarSection>

      {sourceType === 'youtube' ? (
        <ToolbarSection title="YouTube">
          <ToolbarItem
            full
            propKey="videoId"
            type="text"
            label="Video ID"
            value={videoId}
            onChange={handleValueChange}
          />
        </ToolbarSection>
      ) : (
        <ToolbarSection title="Other Source">
          <ToolbarItem
            full
            propKey="videoUrl"
            type="text"
            label="Video URL"
            value={videoUrl}
            onChange={handleValueChange}
          />
        </ToolbarSection>
      )}
    </>
  );
};
