import React from 'react';
import { CardMedia } from '@mui/material';
import { useNode } from '@craftjs/core';
import { VideoSettings } from './VideoSettings';

export const Video = ({ src, rounded, width, height }) => {
        const { connectors: { connect, drag } } = useNode();
        
        return (
  <CardMedia
    component="video"
    src={src}
    controls
    sx={{
      borderRadius: rounded ? `${rounded}px` : 0,
      width: width || '100%',
      height: height || 'auto'
    }}
  />        );
      };  


      Video.craft = {
    displayName: 'Video',
    props: {
      src: 'https://www.istockphoto.com/video/green-karst-cliffs-of-cat-ba-in-ha-long-bay-and-lan-ha-in-china-sea-asia-north-gm1406358441-457934795?utm_source=pixabay&utm_medium=affiliate&utm_campaign=sponsored_video&utm_content=srp_topbanner_media&utm_term=bay.com/video.mp4',
      width: 100,
      height: 100,
    },
    related: {
      toolbar: VideoSettings,
    },
  };