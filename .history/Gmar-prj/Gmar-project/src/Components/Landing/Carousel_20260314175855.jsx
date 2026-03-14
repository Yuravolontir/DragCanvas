import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import { Resizer } from './Resizer';
  import { CarouselSettings } from './CarouselSettings';

  export const Carousel = (props) => {
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { src, radius } = props;

    return (
  <Resizer
    propKey={{ width: 'width', height: 'height' }}
    style={{
      width: 'fit-content',
      display: 'block',
      overflow: 'hidden',
    }}
  >
  <img
    src={src}
    style={{
      pointerEvents: enabled ? 'none' : 'auto',
      width: '100%',
      height: '100%',
      display: 'block',
      boxSizing: 'border-box',
      borderRadius: radius ? `${radius}px` : '0px',
      objectFit: 'cover',
    }}
  />
      </Resizer>
    );
  };

  Image.craft = {
    displayName: 'Image',
    props: {
      src: 'https://imgs.search.brave.com/RCCorhr7zXPhrX1kLp0jyhqkw62Yd9BmsiP6bZIqcPQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9saDMu/Z29vZ2xldXNlcmNv/bnRlbnQuY29tL212/OWJONnBpY00yX0pI/VmhVUzZDWktMaUJ1/b05CQmxEYzRrQlYz/OXplWnpIYWhBWUJt/MkpBUDVhRktkam8x/YWZtWEhhTHA3cVcx/aHJhMGpnNURiN0dP/MW1GbndkSVd3REF2/dFZhNDR6VEE9dzE0/NDAtaDgxMC1uLW51',
      radius: 0,
      width: 'auto',
      height: 'auto',
      maxWidth: '100%',
    },
    related: {
      toolbar: ImageSettings,
    },
  };