import React from 'react';
  import { ToolbarSection } from './Toolbar';
  import { useNode } from '@craftjs/core';
  import { GridLegacy, TextField } from '@mui/material';

  export const VideoSettings = () => {
    const { actions, videoId, videoUrl, text } = useNode((node) => ({
      actions: node.actions,
      videoId: node.data.props.videoId,
      videoUrl: node.data.props.videoUrl,
      text: node.data.props.text,
    }));

    const handleYoutubeChange = (e) => {
      const value = e.target.value;
      actions.setProp((props) => {
        props.videoId = value;
        if (value) {
          props.videoUrl = '';
        }
      });
    };

    const handleUrlChange = (e) => {
      const value = e.target.value;
      actions.setProp((props) => {
        props.videoUrl = value;
        if (value) {
          props.videoId = '';
        }
      });
    };
    const handleTextChange = (e) => {
      const value = e.target.value;
      actions.setProp((props) => {
        props.text = value;
      });
    };


    return (
      <>
        <ToolbarSection title="YouTube">
          <GridLegacy item xs={12}>
            <div className="mb-2">
              <h4 className="text-sm text-light-gray-2">YouTube Video ID</h4>
              <TextField
                fullWidth
                value={videoId || ''}
                onChange={handleYoutubeChange}
                size="small"
              />
            </div>
          </GridLegacy>
        </ToolbarSection>

        <ToolbarSection title="URL">
          <GridLegacy item xs={12}>
            <div className="mb-2">
              <h4 className="text-sm text-light-gray-2">Video URL (mp4, webm)</h4>
              <TextField
                fullWidth
                value={videoUrl || ''}
                onChange={handleUrlChange}
                size="small"
              />
            </div>
                        <div className="mb-2">
              <h4 className="text-sm text-light-gray-2">Set text Above</h4>
              <TextField
                fullWidth
                value={text || ''}
                onChange={handleTextChange}
                size="small"
              />
            </div>
          </GridLegacy>
        </ToolbarSection>
      </>
    );
  };