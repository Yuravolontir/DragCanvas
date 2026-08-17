import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { groupLines } from '../../utils/elementData.js';

/**
 * Tiers, in columns that line up.
 *
 * This is the section hand-assembly does worst. Built from Containers, three
 * tiers with different amounts of text come out different heights, the buttons
 * land at different places, and the one that is supposed to stand out only does
 * so until somebody edits it. Here the columns are one grid, the buttons are
 * pushed to a shared baseline, and "featured" is a property rather than a
 * remembered set of overrides.
 *
 * Each tier is four lines plus its features: name, price, period, button, then
 * the features separated by a semicolon. Flat, because a nested repeater in the
 * settings panel is a great deal of machinery for three tiers.
 */
export const Pricing = ({ tiers, featured, accent, background, color }) => {
  const { connectors: { connect } } = useNode();
  const records = groupLines(tiers, 5);
  const highlight = Number(featured);

  return (
    <div
      ref={connect}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(records.length, 1)}, minmax(0, 1fr))`,
        gap: 20,
        width: '100%',
        alignItems: 'stretch',
      }}
    >
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add tiers in the panel</p>
      ) : records.map(([name, price, period, cta, features], i) => {
        const isFeatured = i + 1 === highlight;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 26,
              borderRadius: 14,
              background: background ? `rgba(${Object.values(background)})` : '#ffffff',
              color: color ? `rgba(${Object.values(color)})` : undefined,
              border: `2px solid ${isFeatured && accent ? `rgba(${Object.values(accent)})` : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isFeatured ? '0 18px 40px -20px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, opacity: 0.7 }}>{name}</span>
            <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6 }}>
              {price}
            </span>
            <span style={{ fontSize: 13, opacity: 0.6 }}>{period}</span>

            <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              {String(features || '').split(';').filter(Boolean).map((f, j) => (
                <li key={j}>{f.trim()}</li>
              ))}
            </ul>

            {/* Pushed down so every button sits on the same line, whatever the
                tier above it says */}
            <span style={{ marginTop: 'auto', paddingTop: 20 }}>
              <span style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px 20px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                background: isFeatured && accent ? `rgba(${Object.values(accent)})` : 'transparent',
                color: isFeatured ? '#fff' : (accent ? `rgba(${Object.values(accent)})` : undefined),
                border: `2px solid ${accent ? `rgba(${Object.values(accent)})` : 'currentColor'}`,
              }}>
                {cta}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

const PricingSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Tiers">
      <ToolbarItem full={true} propKey="tiers" type="lines"
        label="Per tier: name, price, period, button, features separated by ;" />
      <ToolbarItem full={true} propKey="featured" type="number" label="Which tier stands out (1, 2, 3)" />
    </ToolbarSection>
    <ToolbarSection title="Appearance">
      <ToolbarItem full={true} propKey="accent" type="color" label="Accent" />
      <ToolbarItem full={true} propKey="background" type="bg" label="Card" />
      <ToolbarItem full={true} propKey="color" type="color" label="Text" />
    </ToolbarSection>
  </React.Fragment>
);

Pricing.craft = {
  displayName: 'Pricing',
  props: {
    tiers: [
      'Starter', '₪0', 'forever', 'Start free', 'One site; Community support; DragCanvas subdomain',
      'Studio', '₪49', 'per month', 'Choose Studio', 'Ten sites; Custom domain; Email support; No badge',
      'Agency', '₪149', 'per month', 'Talk to us', 'Unlimited sites; Client accounts; Priority support',
    ],
    featured: 2,
    accent: { r: 0, g: 64, b: 224, a: 1 },
    background: { r: 255, g: 255, b: 255, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
  },
  related: { toolbar: PricingSettings },
};
