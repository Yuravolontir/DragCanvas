import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import styled from 'styled-components';
import { Resizer } from './Resizer';
import { VideoSettings } from './VideoSettings';
import { BackgroundVideoView } from './BackgroundVideo';
import { videoMode, youTubeId } from '../../utils/elementData.js';

/*
 * One element, three jobs, and for a long time one panel that did not say which
 * was which: a YouTube id, a file address and a background hero all lived
 * behind the same "Video type" dropdown.
 *
 * YouTube is its own element in the toolbox now. This one is the plain video
 * player - a file the owner hosts, with a loop and an optional line of text
 * across the middle - and it keeps rendering the other two modes so that every
 * project already saved under them still opens, still edits and still
 * publishes exactly as before.
 */

const Frame = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 10px;
  background: #0d1220;
  /* The canvas must be able to hear a click meant for the element, not for the
     player inside it. Selecting, dragging and deleting all depend on this. */
  iframe,
  video {
    pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
  }
`;

const Media = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Embed = styled.iframe`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
`;

/* Exactly centred, and never in the way of a click on the video itself. */
const Caption = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  pointer-events: none;
  text-align: center;
  z-index: 2;
  span {
    padding: 12px 18px;
    border-radius: 10px;
    background: rgb(0 0 0 / 0.35);
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
  }
`;

/*
 * An element with nothing in it yet still has to be visible.
 *
 * A video with no address rendered as nothing at all, which left an element on
 * the page that could not be seen, selected or deleted - the only way out was
 * the layers panel.
 */
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

export const Video = (props) => {
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  const {
    connectors: { connect },
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const { videoId, videoUrl, text, children, loop = true } = props;
  const mode = videoMode(props);

  if (mode === 'background') {
    return <BackgroundVideoView connect={connect} {...props}>{children}</BackgroundVideoView>;
  }

  const embedId = mode === 'youtube' ? youTubeId(videoId || videoUrl) : '';
  const source = String(videoUrl || '').trim();

  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{ display: 'block', overflow: 'hidden' }}
    >
      <Frame $enabled={enabled}>
        {mode === 'youtube' && embedId ? (
          <Embed
            src={`https://www.youtube.com/embed/${embedId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : source ? (
          <>
            <Media
              src={source}
              autoPlay
              muted
              playsInline
              controls
              loop={loop !== false}
            />
            {text ? (
              <Caption>
                <span>{text}</span>
              </Caption>
            ) : null}
          </>
        ) : (
          <Placeholder>
            <span className="material-symbols-outlined" aria-hidden="true">
              movie
            </span>
            Add the address of your video file in Properties, on the right.
          </Placeholder>
        )}
      </Frame>
    </Resizer>
  );
};

Video.craft = {
  displayName: 'Video',
  props: {
    // Plain video file by default. A YouTube link belongs to the YouTube
    // element; the mode survives here only for projects saved before it did.
    sourceType: 'file',
    videoId: '',
    videoUrl: '',
    text: '',
    src: '',
    poster: '',
    overlay: 40,
    position: 'center',
    minHeight: '420px',
    loop: true,
    // The same 16:9 measure the Image and YouTube elements insert at, so a
    // page built from several of them lines up on the 800px canvas.
    width: '560px',
    height: '315px',
  },
  related: {
    toolbar: VideoSettings,
  },
};
