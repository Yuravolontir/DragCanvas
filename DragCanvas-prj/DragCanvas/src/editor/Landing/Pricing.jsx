import React from 'react';
import { readableInkCss } from '../../utils/readableInk.js';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowInlineField, RowList, RowMiniButton, RowToggle } from './Toolbar/ToolbarRows';
import { useRowProp } from './Toolbar/useRowProp.js';
import { readPricingRows, emptyPricingRow, safeHref, opensNewTab } from '../../utils/elementRows.js';

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
 * A plan is a record now — name, price, billing period, button, its link, its
 * features — rather than five anonymous lines and a separate index saying which
 * one stands out. Plans saved in the old shape are still read.
 */
export const Pricing = ({ tiers, featured, accent, background, color }) => {
  const { connectors: { connect } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const records = readPricingRows({ tiers, featured });

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
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first plan in the panel on the right</p>
      ) : records.map((tier, i) => {
        const isFeatured = tier.featured;
        const href = safeHref(tier.href);
        // On the canvas the button is inert: one click on a real link here and
        // the author leaves their own page. In preview and once published it is
        // a link again, which is what makes the plan sellable.
        const live = !enabled && href;
        const cta = (
          <span style={{
            display: 'block',
            textAlign: 'center',
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
            background: isFeatured && accent ? `rgba(${Object.values(accent)})` : 'transparent',
            color: isFeatured ? readableInkCss(accent) : (accent ? `rgba(${Object.values(accent)})` : undefined),
            border: `2px solid ${accent ? `rgba(${Object.values(accent)})` : 'currentColor'}`,
          }}>
            {tier.cta}
          </span>
        );

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
            <span style={{ fontSize: 15, fontWeight: 600 }}>{tier.name}</span>
            <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6 }}>
              {tier.price}
            </span>
            <span style={{ fontSize: 13 }}>{tier.period}</span>

            <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              {tier.features.map((f, j) => (
                <li key={j}>{f}</li>
              ))}
            </ul>

            {/* Pushed down so every button sits on the same line, whatever the
                tier above it says */}
            <span style={{ marginTop: 'auto', paddingTop: 20 }}>
              {tier.cta
                ? (live ? (
                  <a
                    href={live}
                    target={opensNewTab(live) ? '_blank' : undefined}
                    rel={opensNewTab(live) ? 'noopener noreferrer' : undefined}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    {cta}
                  </a>
                ) : cta)
                : null}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const PricingSettings = () => {
  const { rows, update, replace, add, remove, move, write } = useRowProp(
    'tiers',
    readPricingRows,
    emptyPricingRow
  );

  /* Featured is one plan, not several: turning one on turns the others off. */
  const setFeatured = (index, on) =>
    write(rows.map((row, i) => ({ ...row, featured: on && i === index })));

  const setFeature = (index, position, value) =>
    replace(index, {
      ...rows[index],
      features: rows[index].features.map((feature, i) => (i === position ? value : feature)),
    });

  return (
    <React.Fragment>
      <ToolbarHelp title="Plans" icon="payments">
        One card per plan. Every card lines up with the others however much each
        one says, and the plan marked as featured is the one visitors look at
        first. The button opens the address you give it — leave that empty and
        the button is shown without a link.
      </ToolbarHelp>

      <ToolbarSection title="Plans">
        <RowList empty="No plans yet." addLabel="Add plan" onAdd={add}>
          {rows.map((row, index) => (
            <RowCard
              key={index}
              title={row.name || `Plan ${index + 1}`}
              index={index}
              count={rows.length}
              onMove={move}
              onRemove={remove}
              removeLabel="Remove this plan"
            >
              <RowField
                label="Plan name"
                placeholder="Studio"
                value={row.name}
                onChange={(e) => update(index, 'name', e.target.value)}
              />
              <RowField
                label="Price"
                placeholder="$49"
                value={row.price}
                onChange={(e) => update(index, 'price', e.target.value)}
              />
              <RowField
                label="Billed"
                placeholder="per month"
                hint="The small line under the price — “per month”, “one off”, “forever”."
                value={row.period}
                onChange={(e) => update(index, 'period', e.target.value)}
              />

              <RowField
                label="Button text"
                placeholder="Choose Studio"
                value={row.cta}
                onChange={(e) => update(index, 'cta', e.target.value)}
              />
              <RowField
                label="Button link (optional)"
                placeholder="https://buy.example.com/studio"
                hint="Your checkout page, a contact page, or anything else. Opens in a new tab."
                value={row.href}
                onChange={(e) => update(index, 'href', e.target.value)}
              />

              <RowToggle
                label="Highlight this plan"
                checked={!!row.featured}
                onChange={(e) => setFeatured(index, e.target.checked)}
              />

              {row.features.map((feature, position) => (
                <RowInlineField
                  key={position}
                  label={position === 0 ? 'What is included' : undefined}
                  placeholder="Custom domain"
                  value={feature}
                  removeLabel="Remove this feature"
                  onChange={(e) => setFeature(index, position, e.target.value)}
                  onRemove={() =>
                    replace(index, {
                      ...row,
                      features: row.features.filter((_, i) => i !== position),
                    })
                  }
                />
              ))}
              <RowMiniButton
                onClick={() => replace(index, { ...row, features: [...row.features, ''] })}
              >
                Add feature
              </RowMiniButton>
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="accent" type="color" label="Highlight colour" />
        <ToolbarItem full={true} propKey="background" type="bg" label="Card colour" />
        <ToolbarItem full={true} propKey="color" type="color" label="Text colour" />
      </ToolbarSection>
    </React.Fragment>
  );
};

Pricing.craft = {
  displayName: 'Pricing',
  props: {
    tiers: [
      {
        name: 'Starter',
        price: '$0',
        period: 'forever',
        cta: 'Start free',
        href: '',
        features: ['One site', 'Community support', 'DragCanvas subdomain'],
        featured: false,
      },
      {
        name: 'Studio',
        price: '$49',
        period: 'per month',
        cta: 'Choose Studio',
        href: '',
        features: ['Ten sites', 'Custom domain', 'Email support', 'No badge'],
        featured: true,
      },
      {
        name: 'Agency',
        price: '$149',
        period: 'per month',
        cta: 'Talk to us',
        href: '',
        features: ['Unlimited sites', 'Client accounts', 'Priority support'],
        featured: false,
      },
    ],
    featured: 2,
    accent: { r: 0, g: 64, b: 224, a: 1 },
    background: { r: 255, g: 255, b: 255, a: 1 },
    color: { r: 26, g: 28, b: 28, a: 1 },
  },
  related: { toolbar: PricingSettings },
};
