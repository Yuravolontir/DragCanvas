import React from 'react';
import { CardMedia } from '@mui/material';
import { useNode } from '@craftjs/core';
import { VideoSettings } from './VideoSettings';

export const Video = ({ src, rounded, width, height }) => {
        const { connectors: { connect, drag } } = useNode();
        
        return (
            <CardMedia ref={(ref) => connect(drag(ref))} src={src} rounded={rounded} width={width} height={height} />

        );
      };  


      Video.craft = {
    displayName: 'Video',
    props: {
      src: 'https://example.com/video.mp4',
      width: 100,
      height: 100,
    },
    related: {
      toolbar: VideoSettings,
    },
  };