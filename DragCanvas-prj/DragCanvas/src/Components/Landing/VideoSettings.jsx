import React from 'react';
  import { ToolbarSection } from './Toolbar/ToolbarSection';
  import { useNode } from '@craftjs/core';
  import { GridLegacy, TextField } from '@mui/material';
  import { BackgroundVideoSettings } from './BackgroundVideoSettings';

  export const VideoSettings = () => {
    const { actions, sourceType, videoId, videoUrl, text } = useNode((node) => ({
      actions: node.actions,
      sourceType: node.data.props.sourceType,
      videoId: node.data.props.videoId,
      videoUrl: node.data.props.videoUrl,
      text: node.data.props.text,
    }));

    const handleTypeChange = (e) => {
      const value = e.target.value;
      actions.setProp((props) => {
        props.sourceType = value;
        if (value === 'background' && !props.src && props.videoUrl) props.src = props.videoUrl;
      });
    };

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
        <ToolbarSection title="Video type">
          <GridLegacy item xs={12}>
            <TextField select fullWidth value={sourceType || (videoId ? 'youtube' : 'file')} onChange={handleTypeChange} size="small" SelectProps={{ native: true }}>
              <option value="youtube">YouTube embed</option>
              <option value="file">Video file</option>
              <option value="background">Background video</option>
            </TextField>
          </GridLegacy>
        </ToolbarSection>

        {sourceType === 'background' ? <BackgroundVideoSettings /> : null}

        {(sourceType || (videoId ? 'youtube' : 'file')) === 'youtube' ?
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
        : null}

        {(sourceType || (videoId ? 'youtube' : 'file')) === 'file' ?
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
              <h4 className="text-sm text-light-gray-2">Overlay text</h4>
              <TextField
                fullWidth
                value={text || ''}
                onChange={handleTextChange}
                size="small"
              />
            </div>
          </GridLegacy>
        </ToolbarSection>
        : null}
      </>
    );
  };
