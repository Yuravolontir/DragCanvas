import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import { Resizer } from './Resizer';
  import { LinkSettings } from './LinkSettings';

  export const Link = (props) => {
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { href, text, fontSize } = props;

    return (
      <Resizer
        propKey={{ width: 'width', height: 'height' }}
        style={{ width: 'fit-content', display: 'block' }}
      >
        <a
          href={href}
          style={{
            pointerEvents: enabled ? 'none' : 'auto',
            width: '100%',
            display: 'block',
            textDecoration: 'none',
            boxSizing: 'border-box',
            fontSize: fontSize ? `${fontSize}px` : 'inherit',
          }}
        >
          {text}
        </a>
      </Resizer>
    );
  };

  Link.craft = {
    displayName: 'Link',
    props: {
      href: 'https://google.com',
      text: 'Link!',
      width: 'auto',
      height: 'auto',
      maxWidth: '100%',
    },
    related: {
      toolbar: LinkSettings,
    },
  };