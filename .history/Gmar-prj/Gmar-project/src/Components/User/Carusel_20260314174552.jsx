import React from 'react';
import { Carousel as BootstrapCarousel } from 'react-bootstrap/Carousel';
import { useNode } from '@craftjs/core';
import { CarouselSettings } from './ImageSettings';


export const Carousel = ({ src1,src2,src3,heading1,heading2,heading3,label1,label2,label3,p1,p2,p3, width, height }) => {
        const { connectors: { connect, drag } } = useNode();
        
        return (
          <BootstrapCarousel  ref={(ref) => connect(drag(ref))} src1={src1}src2={src2}src3={src3}heading1={heading1}heading2={heading2}heading3={heading3}label1={label1}label2={label2}label3={label3}p1={p1}p2={p2}p3={p3} width={width} height={height} />
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