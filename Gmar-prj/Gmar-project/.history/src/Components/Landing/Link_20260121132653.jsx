import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import styled from 'styled-components';
  import { Resizer } from './Resizer';
  import { LinkSettings } from './LinkSettings';

  const LinkA = styled.a`
    pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
  `;

  export const Link = (props) => {
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { href, text } = props;

    return (
      <Resizer
        propKey={{ width: 'width', height: 'height' }}
       
      >
        <LinkA $enabled={enabled} href={href}>
          {text}
        </LinkA>
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
    },
    related: {
      toolbar: LinkSettings,
    },
  };