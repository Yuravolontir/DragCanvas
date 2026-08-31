import { useEditor } from '@craftjs/core';
  import React from 'react';
  import { Resizer } from './Resizer';
  import { ImageSettings } from './ImageSettings';
  import { imageAltText } from '../../utils/elementData.js';

  export const Image = (props) => {
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { src, radius } = props;
    // Properties no longer asks for a description; anything an older project
    // already stored still wins, and the file name answers for the rest.
    const alt = imageAltText(props);

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
    alt={alt}
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
      alt: '',
      radius: 0,
      // A picture dropped on the 800px canvas should look like a picture on a
      // page, not like a wall. 560x315 is the same 16:9 the video elements
      // insert at, so a page built from both lines up. Both are resizable, and
      // the exporter turns a fixed px width into 100% on a phone.
      width: '560px',
      height: '315px',
      maxWidth: '100%',
    },
    related: {
      toolbar: ImageSettings,
    },
  };
