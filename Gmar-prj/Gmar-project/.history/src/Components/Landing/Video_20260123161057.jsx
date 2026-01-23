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

    const { videoId, videoUrl, text} = props;

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
          <div style={{position: 'relative', width: '100%', paddingTop: '56.25%', overflow:
  'hidden'}}>
          <video
            autoPlay
            loop
            muted
            src={videoUrl}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',color: 'white', textAlign: 'center' ,fontSize: '2rem', fontWeight: 'bold' ,zIndex: 2,background: 'rgba(0, 0, 0, 0.5)', padding: '1rem'}}>
            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>{text}</h1>
          </div>
          </div>
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