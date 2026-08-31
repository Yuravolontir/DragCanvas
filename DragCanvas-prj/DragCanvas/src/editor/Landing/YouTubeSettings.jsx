import React from 'react';
import { useNode } from '@craftjs/core';
import { GridLegacy, TextField } from '@mui/material';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { youTubeId } from '../../utils/elementData.js';

export const YouTubeSettings = () => {
  const { actions, video } = useNode((node) => ({
    video: node.data.props.video,
  }));

  const typed = String(video || '').trim();
  const id = youTubeId(typed);

  return (
    <React.Fragment>
      <ToolbarHelp
        title="YouTube video"
        icon="smart_display"
        examples={[
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          'https://youtu.be/dQw4w9WgXcQ',
          'dQw4w9WgXcQ',
        ]}
      >
        Open the video on YouTube and copy the address from the browser, or use
        the Share button. Paste it below — any of these forms works.
      </ToolbarHelp>

      <ToolbarSection title="The video">
        <GridLegacy item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="YouTube link"
            placeholder="https://youtu.be/dQw4w9WgXcQ"
            value={video || ''}
            onChange={(event) => {
              const value = event.target.value;
              actions.setProp((draft) => {
                draft.video = value;
              });
            }}
            InputLabelProps={{ shrink: true }}
            error={!!typed && !id}
            helperText={
              typed && !id
                ? 'That does not look like a YouTube link yet — check it for a typo.'
                : 'The video appears on the canvas as soon as the link is recognised.'
            }
          />
        </GridLegacy>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="radius" type="slider" label="Rounded corners" max={40} />
      </ToolbarSection>
    </React.Fragment>
  );
};
