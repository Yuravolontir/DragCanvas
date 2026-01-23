 import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import YouTube from 'react-youtube';
  import styled from 'styled-components';
  import { VideoSettings } from './VideoSettings';

  const VideoWrapper = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    > div {
      height: 100%;
    }
    iframe, video {
      pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
    }
  `;

  const VideoContainer = styled.div`
    width: 100%;
    flex: 1;
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
      <VideoWrapper
        ref={connect}
        $enabled={enabled}
      >
        {children}
        <VideoContainer>
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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </VideoContainer>
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