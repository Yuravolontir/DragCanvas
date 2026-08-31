import { useEditor } from '@craftjs/core';
import React from 'react';
import styled from 'styled-components';

import { Resizer } from './Resizer';
import { YouTubeSettings } from './YouTubeSettings';
import { youTubeId } from '../../utils/elementData.js';

/*
 * A YouTube clip, asked for the way a person has it.
 *
 * It used to be a mode of the Video element with one field labelled "YouTube
 * Video ID" - a thing nobody has. What people have is the address in the
 * browser, or the short link the Share button gives them. All of those are
 * accepted here and reduced to the id by youTubeId.
 */

const Frame = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: ${(props) => props.$radius}px;
  background: #0d1220;
  /* So a click on the canvas selects the element instead of the player. */
  iframe {
    pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
  }
`;

const Embed = styled.iframe`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
`;

const Placeholder = styled.div`
  display: grid;
  place-items: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  padding: 16px;
  border: 1px dashed var(--outline-light, #cbd3e1);
  border-radius: 10px;
  background: var(--surface-container, #f4f6fa);
  color: var(--muted, #68748a);
  font: 500 12px/1.5 'Plus Jakarta Sans', sans-serif;
  text-align: center;
  .material-symbols-outlined {
    font-size: 28px;
  }
`;

export const YouTube = ({ video, radius = 0 }) => {
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const id = youTubeId(video);

  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{ display: 'block', overflow: 'hidden' }}
    >
      <Frame $enabled={enabled} $radius={Number(radius) || 0}>
        {id ? (
          <Embed
            src={`https://www.youtube.com/embed/${id}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Placeholder>
            <span className="material-symbols-outlined" aria-hidden="true">
              smart_display
            </span>
            Paste a YouTube link in Properties, on the right.
          </Placeholder>
        )}
      </Frame>
    </Resizer>
  );
};

YouTube.craft = {
  displayName: 'YouTube',
  props: {
    video: '',
    radius: 0,
    // 560x315 is YouTube's own default embed size, and it fits the 800px
    // authoring canvas with room to spare.
    width: '560px',
    height: '315px',
  },
  related: {
    toolbar: YouTubeSettings,
  },
};
