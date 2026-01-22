import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import { Resizer } from './Resizer';
  import { ImageSettings } from './ImageSettings';

  export const Image = (props) => {
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { src, radius } = props;

    return (
      <Resizer
        propKey={{ width: 'width', height: 'height' }}
        style={{ width: 'fit-content', display: 'block' }}
      >
        <img
          src={src}
          style={{
            pointerEvents: enabled ? 'none' : 'auto',
            width: '100%',
            display: 'block',
            textDecoration: 'none',
            boxSizing: 'border-box',
            borderRadius: radius ? `${radius}px` : '0px',
          }}
        >
        </img>
      </Resizer>
    );
  };

  Image.craft = {
    displayName: 'Image',
    props: {
      src: 'https://via.placeholder.com/150',
      radius: 0,
      width: 'auto',
      height: 'auto',
      maxWidth: '100%',
    },
    related: {
      toolbar: ImageSettings,
    },
  };