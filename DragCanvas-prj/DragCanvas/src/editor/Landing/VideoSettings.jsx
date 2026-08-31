import React from 'react';
import { useNode } from '@craftjs/core';
import { GridLegacy, TextField } from '@mui/material';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { BackgroundVideoSettings } from './BackgroundVideoSettings';
import { videoMode } from '../../utils/elementData.js';

/*
 * Written for somebody who has a video and wants it on their page.
 *
 * The old panel asked for a "YouTube Video ID" and a "Video URL (mp4, webm)"
 * without saying where either comes from. YouTube has its own element now, so
 * this one leads with the single question that matters here - where is the
 * file - and names the other two modes in words rather than in jargon, which
 * is how projects saved before the split stay editable.
 */
export const VideoSettings = () => {
  const { actions, props } = useNode((node) => ({
    props: node.data.props,
  }));

  const mode = videoMode(props);

  const set = (key) => (event) => {
    const value = event.target.value;
    actions.setProp((draft) => {
      draft[key] = value;
    });
  };

  const changeMode = (event) => {
    const value = event.target.value;
    actions.setProp((draft) => {
      draft.sourceType = value;
      // Moving to a hero keeps the file that was already chosen.
      if (value === 'background' && !draft.src && draft.videoUrl) draft.src = draft.videoUrl;
    });
  };

  return (
    <>
      <ToolbarHelp
        title="Video"
        icon="movie"
        examples={['https://example.com/tour.mp4']}
      >
        Plays a video file that lives at a web address. Paste the address of an
        .mp4 or .webm file below. For a clip that is on YouTube, use the
        YouTube element instead — it takes the link straight from the browser.
      </ToolbarHelp>

      <ToolbarSection title="How this video is shown">
        <GridLegacy item xs={12}>
          <TextField
            select
            fullWidth
            size="small"
            label="Kind of video"
            value={mode}
            onChange={changeMode}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="file">A video file of my own</option>
            <option value="youtube">A YouTube video</option>
            <option value="background">Moving background behind text</option>
          </TextField>
        </GridLegacy>
      </ToolbarSection>

      {mode === 'background' ? <BackgroundVideoSettings /> : null}

      {mode === 'youtube' ? (
        <ToolbarSection title="YouTube video">
          <GridLegacy item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="YouTube link or video ID"
              helperText="For example https://youtu.be/dQw4w9WgXcQ"
              value={props.videoId || ''}
              onChange={set('videoId')}
              InputLabelProps={{ shrink: true }}
            />
          </GridLegacy>
        </ToolbarSection>
      ) : null}

      {mode === 'file' ? (
        <ToolbarSection title="The video">
          <GridLegacy item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Address of the video file"
              placeholder="https://example.com/tour.mp4"
              helperText="A direct link to an .mp4 or .webm file, not a page it is shown on."
              value={props.videoUrl || ''}
              onChange={set('videoUrl')}
              InputLabelProps={{ shrink: true }}
            />
          </GridLegacy>
          <GridLegacy item xs={12}>
            <TextField
              select
              fullWidth
              size="small"
              label="When it reaches the end"
              value={props.loop === false ? 'no' : 'yes'}
              onChange={(event) => {
                const again = event.target.value === 'yes';
                actions.setProp((draft) => {
                  draft.loop = again;
                });
              }}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="yes">Start again from the beginning</option>
              <option value="no">Stop on the last frame</option>
            </TextField>
          </GridLegacy>
          <GridLegacy item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Words across the middle (optional)"
              placeholder="Watch how it works"
              helperText="Shown centered over the video. Leave empty for none."
              value={props.text || ''}
              onChange={set('text')}
              InputLabelProps={{ shrink: true }}
            />
          </GridLegacy>
        </ToolbarSection>
      ) : null}
    </>
  );
};
