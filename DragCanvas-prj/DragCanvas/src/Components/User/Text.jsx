import React from 'react';
import { Typography } from '@mui/material';
import { useNode } from '@craftjs/core';

export const Text = ({ text, fontSize }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref) => connect(drag(ref))}>
      <p style={{ fontSize: `${fontSize}px` }}>{text}</p>
    </div>
  );
};

Text.craft = {
  props: {
    text: 'Hi',
    fontSize: 20,
  },
};
