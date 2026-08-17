import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/**
 * A row of logos, all the same height.
 *
 * Logos arrive at wildly different aspect ratios, so the one thing that has to be
 * fixed is the height - matching widths instead makes a wide wordmark tower over
 * a square badge. Muted by default and full colour on hover: a row of competing
 * brand colours pulls attention away from the page it is meant to support.
 */
export const LogoStrip = ({ logos, height, gap, grayscale }) => {
  const { connectors: { connect } } = useNode();
  const items = Array.isArray(logos) ? logos : [];

  return (
    <div
      ref={connect}
      className={grayscale === 'no' ? 'dc-logos' : 'dc-logos dc-logos--muted'}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${gap || 40}px`,
        width: '100%',
      }}
    >
      {items.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add logo URLs in the panel</p>
      ) : items.map((src, i) => (
        <img key={i} src={src} alt="" style={{ height: `${height || 32}px`, width: 'auto', display: 'block' }} />
      ))}
    </div>
  );
};

const LogoStripSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Logos">
      <ToolbarItem full={true} propKey="logos" type="lines" label="One image URL per line" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="height" type="slider" label="Height" min={16} max={80} />
      <ToolbarItem full={true} propKey="gap" type="slider" label="Gap" min={12} max={96} />
    </ToolbarSection>
  </React.Fragment>
);

LogoStrip.craft = {
  displayName: 'LogoStrip',
  props: { logos: [], height: '32', gap: '40', grayscale: 'yes' },
  related: { toolbar: LogoStripSettings },
};
