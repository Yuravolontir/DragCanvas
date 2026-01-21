import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import styled from 'styled-components';
  import { LinkSettings } from './LinkSettings';

  const LinkDiv = styled.a`
    pointer-events: ${(props) => (props.$enabled ? 'none' : 'auto')};
  `;

  export const Link = (props) => {
    const {
      connectors: { connect },
    } = useNode();
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { href, text } = props;

    return (
      <LinkDiv
        ref={(dom) => {
          connect(dom);
        }}
        $enabled={enabled}
        href={href}
      >
        {text}
      </LinkDiv>
    );
  };

  Link.craft = {
    displayName: 'Link',
    props: {
      href: 'https://google.com',
      text: 'Link!',
    },
    related: {
      toolbar: LinkSettings,
    },
  };