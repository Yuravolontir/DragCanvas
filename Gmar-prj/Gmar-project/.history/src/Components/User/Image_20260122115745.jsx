import React from 'react';
import { Image as BootstrapImage } from 'react-bootstrap/Image';
import { useNode } from '@craftjs/core';
import { ImageSettings } from './ImageSettings';

export const Image = ({ src, rounded, width, height }) => {
        const { connectors: { connect, drag } } = useNode();
        return (
          <BootstrapImage ref={(ref) => connect(drag(ref))} src={src} rounded={rounded} width={width} height={height} />
        );
      };  
      Image.craft = {
    displayName: 'Image',
    props: {
      src: '',
      rounded: false,
      width: 100,
      height: 100,
    },
    related: {
      toolbar: ImageSettings,
    },
  };
