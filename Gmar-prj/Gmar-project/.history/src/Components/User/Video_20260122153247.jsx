import React from 'react';
import { Box } from '@mui/material';
import { useNode } from '@craftjs/core';
import { VideoSettings } from './VideoSettings';

export const Video = ({ src, rounded, width, height }) => {
        const { connectors: { connect, drag } } = useNode();
        
        return (
 <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        '& video': {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }
      }}
    >   
           
          </Box>
        );
      };  


      Image.craft = {
    displayName: 'Image',
    props: {
      src: 'https://imgs.search.brave.com/RCCorhr7zXPhrX1kLp0jyhqkw62Yd9BmsiP6bZIqcPQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9saDMu/Z29vZ2xldXNlcmNv/bnRlbnQuY29tL212/OWJONnBpY00yX0pI/VmhVUzZDWktMaUJ1/b05CQmxEYzRrQlYz/OXplWnpIYWhBWUJt/MkpBUDVhRktkam8x/YWZtWEhhTHA3cVcx/aHJhMGpnNURiN0dP/MW1GbndkSVd3REF2/dFZhNDR6VEE9dzE0/NDAtaDgxMC1uLW51',
      rounded: false,
      width: 100,
      height: 100,
    },
    related: {
      toolbar: ImageSettings,
    },
  };