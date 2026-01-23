import React, { useState } from 'react';
import { ToolbarSection, ToolbarItem } from './Toolbar';
import { useNode } from '@craftjs/core';

export const VideoSettings = () => {

  const [sourceType, setSourceType] = useState('youtube');
  const [videoId, setVideoId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleSourceChange = (e) => {
    setSourceType(e.target.value);
    setVideoId('');
    setVideoUrl('');
  };

  const handleValueChange = (e) => {
    if (sourceType === 'youtube') {
      setVideoId(e.target.value);
    } else {
      setVideoUrl(e.target.value);
    }
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
