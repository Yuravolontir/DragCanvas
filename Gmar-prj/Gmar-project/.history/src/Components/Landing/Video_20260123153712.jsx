 import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import YouTube from 'react-youtube';
  import styled from 'styled-components';
  import { VideoSettings } from './VideoSettings';

  const VideoWrapper = styled.div`
    width: 100%;
    height: 100%;
    > div {
      height: 100%;
    }
    iframe, video {
      pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
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

    const { videoId, videoUrl } = props;

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
          <video
            autoPlay
            loop
            muted
            src={videoUrl}
            controls
            style={{ width: '100%', height: '100%' }}
          />
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
    },
    related: {
      toolbar: VideoSettings,
    },
  };