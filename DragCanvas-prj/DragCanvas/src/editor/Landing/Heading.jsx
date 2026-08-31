import { useNode } from '@craftjs/core';
import React from 'react';
import ContentEditable from 'react-contenteditable';

import { HeadingSettings } from './HeadingSettings';

/**
 * A title that is a title.
 *
 * Everything on a page used to be a Text, and the exporter published all of it as
 * <h2> - so a page had thirty second-level headings and no <h1>. This carries a
 * level, which is what makes an outline: one level 1 saying what the page is
 * about, and the rest nested under it.
 *
 * Level and size are separate on purpose. A section title can be small and still
 * be a level 2; tying the two together is how pages end up choosing their
 * structure by how big they wanted the letters.
 */
export const Heading = ({ text, level, fontSize, fontWeight, textAlign, color, margin }) => {
  const {
    connectors: { connect },
    actions: { setProp },
  } = useNode();

  const Tag = `h${Math.min(Math.max(Number(level) || 2, 1), 6)}`;

  return (
    <ContentEditable
      innerRef={connect}
      html={text || ''}
      onChange={(e) => setProp((props) => {
        props.text = e.target.value.replace(/<\/?[^>]+(>|$)/g, '');
      }, 500)}
      tagName={Tag}
      style={{
        margin: `${margin?.[0] || 0}px ${margin?.[1] || 0}px ${margin?.[2] || 0}px ${margin?.[3] || 0}px`,
        color: color ? `rgba(${Object.values(color)})` : undefined,
        fontSize: `${fontSize || 32}px`,
        fontWeight: fontWeight || '700',
        textAlign: textAlign || 'left',
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}
    />
  );
};

Heading.craft = {
  displayName: 'Heading',
  props: {
    text: 'Heading',
    level: '2',
    fontSize: '32',
    fontWeight: '700',
    textAlign: 'left',
    color: { r: 26, g: 28, b: 28, a: 1 },
    margin: [0, 0, 0, 0],
  },
  related: {
    toolbar: HeadingSettings,
  },
};
