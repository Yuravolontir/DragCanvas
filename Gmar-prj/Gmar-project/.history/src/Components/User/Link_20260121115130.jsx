import React from 'react'
import Link from '@mui/material/Link';
import { useNode } from '@craftjs/core';

export const Link= ({ size, variant, color, children, text }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <Link ref={(ref) => connect(drag(ref))} size={size} variant={variant} color={color}>
      {children || text}
    </Link>
  );
};

Button.craft = {
  props: {
    size: 'small',
    variant: 'contained',
    color: 'primary',
    text: 'Click me',
  },
};
