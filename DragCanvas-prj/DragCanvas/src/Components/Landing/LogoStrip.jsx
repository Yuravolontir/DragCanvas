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
 *
 * A line that is not a URL is set as a wordmark instead of being loaded as an
 * image. Nobody building a page has the customers' logo files to hand, and the
 * alternative people reach for - a stock photograph standing in for a logo -
 * renders as a postage stamp of somebody's office and looks worse than no strip
 * at all. A name in type is what a logo mostly is.
 */

/** A URL, a data URI or a site-root path. Anything else is a name. */
const isImageSource = value => /^(https?:\/\/|data:|\/)/i.test(String(value).trim());
export const LogoStrip = ({ logos, height, gap, grayscale, color }) => {
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
        // Wordmarks are type, so they take the colour of whatever they sit in
        // unless told otherwise - and a strip inherited from a dark hero came
        // out near-invisible. Worth its own prop rather than a parent's accident.
        ...(color ? { color: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})` } : {}),
      }}
    >
      {items.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add a name or an image URL per line</p>
      ) : items.map((entry, i) => (isImageSource(entry) ? (
        <img key={i} src={entry} alt="" style={{ height: `${height || 32}px`, width: 'auto', display: 'block' }} />
      ) : (
        <span
          key={i}
          style={{
            // Sized off the strip height so names and image logos sit on the
            // same line rather than one dwarfing the other.
            fontSize: `${Math.round((Number(height) || 32) * 0.62)}px`,
            fontWeight: 700,
            opacity: grayscale === 'no' ? 1 : 0.75,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {entry}
        </span>
      )))}
    </div>
  );
};

const LogoStripSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Logos">
      <ToolbarItem full={true} propKey="logos" type="lines" label="One name or image URL per line" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="color" type="color" label="Wordmark colour" />
      <ToolbarItem full={true} propKey="height" type="slider" label="Height" min={16} max={80} />
      <ToolbarItem full={true} propKey="gap" type="slider" label="Gap" min={12} max={96} />
    </ToolbarSection>
  </React.Fragment>
);

LogoStrip.craft = {
  displayName: 'LogoStrip',
  props: { logos: [], height: '32', gap: '40', grayscale: 'yes', color: null },
  related: { toolbar: LogoStripSettings },
};
