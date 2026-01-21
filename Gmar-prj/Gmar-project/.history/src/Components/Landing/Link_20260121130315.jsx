import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import ContentEditable from 'react-contenteditable';
import { LinkSettings } from './LinkSettings';

const LinkDiv = ({ enabled }) => `
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
  href = props.href || 'google.com';
  variant = props.variant || 'body2';
  color = props.color || 'inherit';
  text = props.text || 'Link!';

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

Link.craft = {
  displayName: 'Link',
  props: {
    href: 'google.com',
    variant: 'body2',
    color: 'inherit',
    text: 'Link!',
    fontSize: '15',
    textAlign: 'left',
    fontWeight: '500',
    color: { r: 92, g: 90, b: 90, a: 1 },
    margin: [0, 0, 0, 0],
    shadow: 0,
    text: 'Text',
  },
  related: {
    toolbar: LinkSettings,
  },
};
