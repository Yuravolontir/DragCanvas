import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import YouTube from 'react-youtube';
import styled from 'styled-components';
import { VideoSettings } from './VideoSettings';

const YoutubeDiv = styled.div`
  width: 100%;
  height: 100%;
  > div {
    height: 100%;
  }
  iframe {
    pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
  }
`;
const VideoDiv = styled.div`
  width: 100%;
  height: 100%;
  > div {
    height: 100%;
  }
  iframe {
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

  const { videoId , videoUrl } = props;
  if (videoId) {
    
    return (
       <YoutubeDiv
      ref={(dom) => {
        connect(dom);
      }}
      $enabled={enabled}
    >
      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '100%',
        }}
      />
    </YoutubeDiv>
  );
  }
if (videoUrl) {
    return (
       <VideoDiv
      ref={(dom) => {
        connect(dom);
      }}
      $enabled={enabled}
    >
      <iframe
        width="100%"
        height="100%"
        src={videoUrl}
        title="Video Player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </VideoDiv>
  );
  }
  return null;

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
