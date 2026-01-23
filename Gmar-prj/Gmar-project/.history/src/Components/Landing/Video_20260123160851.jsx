  import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import YouTube from 'react-youtube';
  import styled from 'styled-components';
  import { VideoSettings } from './VideoSettings';

  const VideoWrapper = styled.div`
    width: 100%;
    height: 100%;
    min-height: 200px;
    position: relative;
    > div {
      height: 100%;
    }
    iframe, video {
      pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
    }
  `;

  const OverlayText = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    text-align: center;
    z-index: 2;
    background: rgba(0, 0, 0, 0.5);
    padding: 1rem;
    border-radius: 8px;
    pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
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

    const { videoId, videoUrl, text } = props;

    return (
      <VideoWrapper
        ref={(dom) => {
          connect(dom);
        }}
        $enabled={enabled}
      >
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : videoUrl ? (
          <>
            <video
              autoPlay
              loop
              muted
              src={videoUrl}
              controls
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'cover'
              }}
            />
            {text && (
              <OverlayText $enabled={enabled}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold'
  }}>{text}</h1>
              </OverlayText>
            )}
          </>
        ) : null}
      </VideoWrapper>
    );
  };

  Video.craft = {
    displayName: 'Video',
    props: {
      sourceType: 'youtube',
      videoId: 'IwzUs1IMdyQ',
      videoUrl: '',
      text: '',
    },
    related: {
      toolbar: VideoSettings,
    },
  };