import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/**
 * Somebody vouching for the thing.
 *
 * Distinct from Quote, which is a sentence lifted out of the copy for emphasis.
 * This one has a person attached, and the person is the point: the face and the
 * job title are what make it evidence rather than decoration.
 */
export const Testimonial = ({ quote, author, role, avatar, background, color, accent, align }) => {
  const { connectors: { connect } } = useNode();
  const centred = align === 'center';

  return (
    <figure
      ref={connect}
      style={{
        margin: 0,
        padding: 28,
        borderRadius: 14,
        background: background ? `rgba(${Object.values(background)})` : '#ffffff',
        color: color ? `rgba(${Object.values(color)})` : undefined,
        border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: centred ? 'center' : 'flex-start',
        textAlign: centred ? 'center' : 'left',
        gap: 18,
        width: '100%',
      }}
    >
      <blockquote style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>
        {quote}
      </blockquote>

      <figcaption style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {avatar ? (
          <img
            src={avatar}
            alt=""
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{
            width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: accent ? `rgba(${Object.values(accent)})` : '#eef0ff',
            fontWeight: 700,
          }}>
            {(author || '?').trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{author}</span>
          <span style={{ fontSize: 13, opacity: 0.65 }}>{role}</span>
        </span>
      </figcaption>
    </figure>
  );
};

const TestimonialSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Testimonial">
      <ToolbarItem full={true} propKey="quote" type="text" label="Quote" />
      <ToolbarItem full={true} propKey="author" type="text" label="Name" />
      <ToolbarItem full={true} propKey="role" type="text" label="Role" />
      <ToolbarItem full={true} propKey="avatar" type="text" label="Photo URL" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="background" type="bg" label="Card" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
      <ToolbarItem full={true} propKey="accent" type="bg" label="Initial circle" />
    </ToolbarSection>
  </React.Fragment>
);

Testimonial.craft = {
  displayName: 'Testimonial',
  props: {
    quote: 'We had a site up the same afternoon, and it looked like we paid for it.',
    author: 'Dana Levi',
    role: 'Owner, Lehem Bakery',
    avatar: '',
    align: 'left',
    background: { r: 255, g: 255, b: 255, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
    accent: { r: 238, g: 240, b: 255, a: 1 },
  },
  related: { toolbar: TestimonialSettings },
};
