import React from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

export const Newsletter = ({ heading, placeholder, buttonText, successMessage, accent, color }) => {
  const { enabled } = useEditor(state => ({ enabled: state.options.enabled }));
  const { connectors: { connect } } = useNode();
  const accentCss = accent ? `rgba(${Object.values(accent)})` : '#0060ac';
  const colorCss = color ? `rgba(${Object.values(color)})` : 'inherit';
  return <div ref={connect} style={{ width: '100%', color: colorCss }}>
    <strong style={{ display: 'block', marginBottom: 10 }}>{heading}</strong>
    <form onSubmit={event => event.preventDefault()} style={{ display: 'flex', gap: 8 }}>
      <input type="email" placeholder={placeholder} disabled={enabled} style={{ flex: 1, padding: 12, border: '1px solid #ccc', borderRadius: 8 }} />
      <button type="submit" disabled={enabled} style={{ padding: '12px 18px', border: 0, borderRadius: 8, background: accentCss, color: '#fff' }}>{buttonText}</button>
    </form>
    {enabled && <small style={{ opacity: .65 }}>{successMessage}</small>}
  </div>;
};

const NewsletterSettings = () => <>
  <ToolbarSection title="Content">
    <ToolbarItem full propKey="heading" type="text" label="Heading" />
    <ToolbarItem full propKey="placeholder" type="text" label="Email placeholder" />
    <ToolbarItem full propKey="buttonText" type="text" label="Button" />
    <ToolbarItem full propKey="successMessage" type="text" label="Success message" />
  </ToolbarSection>
  <ToolbarSection title="Appearance">
    <ToolbarItem full propKey="accent" type="bg" label="Button" />
    <ToolbarItem full propKey="color" type="color" label="Text" />
  </ToolbarSection>
</>;

Newsletter.craft = {
  displayName: 'Newsletter',
  props: { heading: 'Get updates', placeholder: 'you@example.com', buttonText: 'Subscribe', successMessage: 'Check your email to confirm.', accent: { r: 0, g: 96, b: 172, a: 1 }, color: { r: 28, g: 27, b: 31, a: 1 } },
  related: { toolbar: NewsletterSettings },
};
