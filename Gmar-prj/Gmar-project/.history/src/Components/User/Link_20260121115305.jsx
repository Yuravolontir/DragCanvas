import React from 'react'
import Link from '@mui/material/Link';
import { useNode } from '@craftjs/core';

export const Link= ({ href, variant, color, text }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <Link ref={(ref) => connect(drag(ref))} size={size} variant={variant} color={color}>
      {children || text}
    </Link>
  );
};

Link.craft = {
  props: {
    size: 'small',
    variant: 'contained',
    color: 'inherit',
    text: 'Click me',
  },
};
