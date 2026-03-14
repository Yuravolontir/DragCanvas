import React from 'react';
import { Carousel as BootstrapCarousel } from 'react-bootstrap/Carousel';
import { useNode } from '@craftjs/core';
import { CarouselSettings } from './ImageSettings';


export const Carousel = ({ src, rounded, width, height }) => {
        const { connectors: { connect, drag } } = useNode();
        
        return (
          <BootstrapImage  ref={(ref) => connect(drag(ref))} src={src} rounded={rounded} width={width} height={height} />
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