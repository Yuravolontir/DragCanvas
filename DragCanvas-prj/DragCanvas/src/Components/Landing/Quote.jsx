import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/**
 * A pull quote.
 *
 * Distinct from Testimonial: that one is a person vouching for a product and
 * carries a face and a job title. This is a sentence lifted out of the copy for
 * emphasis, and publishes as a `<blockquote>` because that is what it is.
 */
export const Quote = ({ text, attribution, fontSize, color, accent, align }) => {
  const { connectors: { connect } } = useNode();

  return (
    <blockquote
      ref={connect}
      style={{
        margin: 0,
        padding: `4px 0 4px ${align === 'center' ? '0' : '20px'}`,
        borderLeft: align === 'center' ? 'none' : `3px solid ${accent ? `rgba(${Object.values(accent)})` : '#0040e0'}`,
        textAlign: align || 'left',
        fontSize: `${fontSize || 20}px`,
        lineHeight: 1.5,
        fontStyle: 'italic',
        color: color ? `rgba(${Object.values(color)})` : undefined,
      }}
    >
      {text}
      {attribution ? (
        <footer style={{ marginTop: 10, fontSize: '0.72em', fontStyle: 'normal', opacity: 0.7 }}>
          — {attribution}
        </footer>
      ) : null}
    </blockquote>
  );
};

const QuoteSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Quote">
      <ToolbarItem full={true} propKey="text" type="text" label="Text" />
      <ToolbarItem full={true} propKey="attribution" type="text" label="Attribution" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="fontSize" type="slider" label="Size" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
      <ToolbarItem full={true} propKey="accent" type="color" label="Rule" />
    </ToolbarSection>
  </React.Fragment>
);

Quote.craft = {
  displayName: 'Quote',
  props: {
    text: 'A sentence worth pulling out of the paragraph it came from.',
    attribution: '',
    fontSize: '20',
    align: 'left',
    color: { r: 26, g: 28, b: 28, a: 1 },
    accent: { r: 0, g: 64, b: 224, a: 1 },
  },
  related: { toolbar: QuoteSettings },
};
