  import React from 'react';
  import { useNode } from '@craftjs/core';
  import { Radio, FormControlLabel } from '@mui/material';
  import { ToolbarSection, ToolbarItem } from './Toolbar';

  export const VideoSettings = () => {
    const { actions: { setProp }, sourceType } = useNode((node) => ({
      sourceType: node.data.props.sourceType || 'youtube',
    }));

    return (
      <React.Fragment>
        <ToolbarSection title="Source">
          <ToolbarItem
            full={true}
            propKey="sourceType"
            type="radio"
            label="Type"
            onChange={(value) => {
              setProp((props) => {
                if (value === 'youtube') {
                  props.videoUrl = '';
                } else {
                  props.videoId = '';
                }
              }, 500);
              return value;
            }}
          >
            <FormControlLabel value="youtube" control={<Radio />} label="YouTube" />
            <FormControlLabel value="url" control={<Radio />} label="Video URL" />
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