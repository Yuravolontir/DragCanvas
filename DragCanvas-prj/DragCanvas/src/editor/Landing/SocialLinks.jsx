import React from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList } from './Toolbar/ToolbarRows';
import { useRowProp } from './Toolbar/useRowProp.js';
import {
  SOCIAL_PLATFORMS,
  emptySocialRow,
  readSocialRows,
  socialHref,
  socialPlatform,
} from '../../utils/socialPlatforms.js';

/**
 * Where else to find them.
 *
 * This used to render the word "Instagram" in a grey pill, on the reasoning
 * that a name is understood by everyone who can read. True, and still not what
 * anyone expects: every site on the web draws these as glyphs, so a row of
 * words read as something half-finished. Each row now names its network
 * explicitly and is drawn with that network's mark, with the name kept as the
 * accessible label so nothing is lost for a screen reader.
 */
export const SocialLinks = ({ items, color, background, size }) => {
  const { connectors: { connect } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const records = readSocialRows({ items });
  const box = Math.round((Number(size) || 14) * 2.3);

  return (
    <div
      ref={connect}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', width: '100%' }}
    >
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first social link in the panel on the right</p>
      ) : records.map((row, i) => {
        const href = socialHref(row);
        const live = !enabled && href;
        const style = {
          display: 'inline-grid',
          placeItems: 'center',
          width: box,
          height: box,
          borderRadius: '50%',
          textDecoration: 'none',
          background: background ? `rgba(${Object.values(background)})` : 'rgba(0,0,0,0.06)',
          color: color ? `rgba(${Object.values(color)})` : 'inherit',
        };
        const glyph = (
          <svg
            viewBox="0 0 24 24"
            width={Math.round(box * 0.58)}
            height={Math.round(box * 0.58)}
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d={row.icon} />
          </svg>
        );

        return live ? (
          <a key={i} href={live} target="_blank" rel="noopener noreferrer" aria-label={row.label} title={row.label} style={style}>
            {glyph}
          </a>
        ) : (
          <span key={i} role="img" aria-label={row.label} title={row.label} style={style}>
            {glyph}
          </span>
        );
      })}
    </div>
  );
};

const SocialLinksSettings = () => {
  const { rows, replace, add, remove, move } = useRowProp('items', readSocialRows, emptySocialRow);

  const choosePlatform = (index, id) => {
    const platform = SOCIAL_PLATFORMS.find((entry) => entry.id === id) || SOCIAL_PLATFORMS[0];
    const previous = rows[index];
    // The label is what a screen reader announces. It follows the platform
    // unless somebody has written their own, which is why the old label is
    // only replaced when it was the previous platform's name.
    const wasDefault = !previous.label || previous.label === socialPlatform(previous).label;
    replace(index, {
      platform: platform.id,
      label: wasDefault ? platform.label : previous.label,
      href: previous.href,
    });
  };

  return (
    <React.Fragment>
      <ToolbarHelp title="Social links" icon="share">
        One row per account. Pick the network and paste the address of your
        page there — each row is drawn with that network's own mark. Links open
        in a new tab, so visitors keep your page open behind them.
      </ToolbarHelp>

      <ToolbarSection title="Accounts">
        <RowList empty="No accounts yet." addLabel="Add social link" onAdd={add}>
          {rows.map((row, index) => {
            const platform = socialPlatform(row);
            return (
              <RowCard
                key={index}
                title={platform.label}
                index={index}
                count={rows.length}
                onMove={move}
                onRemove={remove}
                removeLabel={`Remove the ${platform.label} link`}
              >
                <RowField
                  label="Network"
                  kind="select"
                  value={platform.id}
                  onChange={(e) => choosePlatform(index, e.target.value)}
                  options={SOCIAL_PLATFORMS.map((entry) => ({ value: entry.id, label: entry.label }))}
                />
                <RowField
                  label={platform.id === 'email' ? 'Email address' : 'Address of your page'}
                  placeholder={platform.placeholder}
                  value={row.href}
                  onChange={(e) => replace(index, { ...row, href: e.target.value })}
                />
                <RowField
                  label="Name read aloud"
                  placeholder={platform.label}
                  hint="What a screen reader announces for this icon."
                  value={row.label}
                  onChange={(e) => replace(index, { ...row, label: e.target.value })}
                />
              </RowCard>
            );
          })}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="background" type="bg" label="Circle colour" />
        <ToolbarItem full={true} propKey="color" type="color" label="Icon colour" />
        <ToolbarItem full={true} propKey="size" type="slider" label="Icon size" min={11} max={20} />
      </ToolbarSection>
    </React.Fragment>
  );
};

SocialLinks.craft = {
  displayName: 'SocialLinks',
  props: {
    items: [
      { platform: 'instagram', label: 'Instagram', href: 'https://instagram.com/' },
      { platform: 'facebook', label: 'Facebook', href: 'https://facebook.com/' },
    ],
    background: { r: 0, g: 0, b: 0, a: 0.06 },
    color: { r: 26, g: 28, b: 28, a: 1 },
    size: '14',
  },
  related: { toolbar: SocialLinksSettings },
};
