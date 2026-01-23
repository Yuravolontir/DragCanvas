  import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import YouTube from 'react-youtube';
  import styled from 'styled-components';
  import { VideoSettings } from './VideoSettings';

  const VideoWrapper = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const VideoContent = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  `;

  const VideoMedia = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    iframe, video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
    }
  `;

  export const Video = (props) => {
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));
    const {
      connectors: { connect },
    } = useNode();

    const { videoId, videoUrl, children } = props;

    return (
      <VideoWrapper ref={connect}>
        <VideoMedia $enabled={enabled}>
          {videoId ? (
            <YouTube
              videoId={videoId}
              opts={{
                width: '100%',
                height: '100%',
              }}
            />
          ) : videoUrl ? (
            <video
              src={videoUrl}
              controls
              loop
              autoPlay
              muted
            />
          ) : null}
        </VideoMedia>
        {children && (
          <VideoContent>
            {children}
          </VideoContent>
        )}
      </VideoWrapper>
    );
  };

  Video.craft = {
    displayName: 'Video',
    props: {
      sourceType: 'youtube',
      videoId: 'IwzUs1IMdyQ',
      videoUrl: '',
    },
    rules: {
      canDrag: () => true,
    },
    related: {
      toolbar: VideoSettings,
    },
  };