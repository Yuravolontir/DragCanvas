import React from 'react'
import { Link as MuiLink } from '@mui/material/Link';
import { useNode } from '@craftjs/core';

  export const Link = ({ href, variant, color, text }) => {
    const { connectors: { connect, drag } } = useNode();
    return (
      <MuiLink ref={(ref) => connect(drag(ref))} href={href} variant={variant} color={color}>
        {text}
      </MuiLink>
    );
  };

Link.craft = {
  props: {
    href: '#',
    variant: 'body2',
    color: 'inherit',
    text: 'Link!',
  },
};
