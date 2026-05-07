import React from 'react';
import { Paper } from '@mui/material';
import { useNode } from '@craftjs/core';

export const Container = ({ background, padding = 0, children }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <Paper ref={(ref) => connect(drag(ref))} style={{ margin: '5px 0', background, padding: `${padding}px` }}>
      {children}
    </Paper>
  );
};

export const ContainerDefaultProps = {
  background: '#ffffff',
  padding: 3,
};

Container.craft = {
  props: ContainerDefaultProps,
};
