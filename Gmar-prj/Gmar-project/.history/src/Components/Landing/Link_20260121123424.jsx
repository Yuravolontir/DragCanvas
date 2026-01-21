import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import ContentEditable from 'react-contenteditable';
import { LinkSettings } from './LinkSettings';

const LikDiv = ({ enabled }) => `
  pointer-events: ${enabled ? 'none' : 'auto'};
`;
export const Link = (props) => {
  const {
    connectors: { connect },
    setProp,
  } = useNode();
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  // Default values
  href = href || 'google.com';
  variant = variant || 'body2';
  color = color || 'inherit';
  text = text || 'Link!';

  return (
   <LikDiv
      ref={(dom) => {
        connect(dom);
      }}
      $enabled={enabled}
    >
        <a href={href} variant={variant} color={color}>
      {text}
    </a>
    </LikDiv>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    fontSize: '15',
    textAlign: 'left',
    fontWeight: '500',
    color: { r: 92, g: 90, b: 90, a: 1 },
    margin: [0, 0, 0, 0],
    shadow: 0,
    text: 'Text',
  },
  related: {
    toolbar: TextSettings,
  },
};
