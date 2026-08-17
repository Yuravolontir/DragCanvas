import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/**
 * The ask, on a band of its own.
 *
 * A page usually earns its keep in one place, and that place should not look like
 * the paragraph above it. The band is the whole point: it interrupts.
 */
export const CTABanner = ({ title, text, cta, href, background, color, buttonBackground, buttonColor, radius }) => {
  const { connectors: { connect } } = useNode();

  return (
    <div
      ref={connect}
      style={{
        width: '100%',
        padding: '48px 32px',
        borderRadius: `${radius ?? 16}px`,
        background: background ? `rgba(${Object.values(background)})` : '#0040e0',
        color: color ? `rgba(${Object.values(color)})` : '#ffffff',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
        {title}
      </span>
      {text ? <span style={{ fontSize: 16, opacity: 0.85, maxWidth: '46ch' }}>{text}</span> : null}
      <a
        href={href || '#'}
        style={{
          marginTop: 12,
          display: 'inline-block',
          padding: '14px 30px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 16,
          textDecoration: 'none',
          background: buttonBackground ? `rgba(${Object.values(buttonBackground)})` : '#ffffff',
          color: buttonColor ? `rgba(${Object.values(buttonColor)})` : '#0040e0',
        }}
      >
        {cta}
      </a>
    </div>
  );
};

const CTABannerSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Message">
      <ToolbarItem full={true} propKey="title" type="text" label="Headline" />
      <ToolbarItem full={true} propKey="text" type="text" label="Supporting line" />
      <ToolbarItem full={true} propKey="cta" type="text" label="Button" />
      <ToolbarItem full={true} propKey="href" type="text" label="Button link" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="background" type="bg" label="Band" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
      <ToolbarItem full={true} propKey="buttonBackground" type="bg" label="Button" />
      <ToolbarItem full={true} propKey="buttonColor" type="color" label="Button text" />
      <ToolbarItem full={true} propKey="radius" type="slider" label="Roundness" min={0} max={32} />
    </ToolbarSection>
  </React.Fragment>
);

CTABanner.craft = {
  displayName: 'CTABanner',
  props: {
    title: 'Ready to start?',
    text: 'It takes a sentence. You can change everything afterwards.',
    cta: 'Get started',
    href: '#',
    background: { r: 0, g: 64, b: 224, a: 1 },
    color: { r: 255, g: 255, b: 255, a: 1 },
    buttonBackground: { r: 255, g: 255, b: 255, a: 1 },
    buttonColor: { r: 0, g: 64, b: 224, a: 1 },
    radius: 16,
  },
  related: { toolbar: CTABannerSettings },
};
