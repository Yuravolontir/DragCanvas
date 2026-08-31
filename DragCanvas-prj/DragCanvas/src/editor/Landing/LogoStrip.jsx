import React from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList, useRowProp } from './Toolbar/ToolbarRows';
import { readLogoRows, emptyLogoRow, safeHref, opensNewTab } from '../../utils/elementRows.js';

/**
 * A row of logos, all the same height.
 *
 * Logos arrive at wildly different aspect ratios, so the one thing that has to
 * be fixed is the height — matching widths instead makes a wide wordmark tower
 * over a square badge. Muted by default and full colour on hover: a row of
 * competing brand colours pulls attention away from the page it supports.
 *
 * A company with no image is set as a wordmark rather than as a broken image.
 * Nobody building a page has their customers' logo files to hand, and the
 * alternative people reach for — a stock photograph standing in for a logo —
 * renders as a postage stamp of somebody's office. A name in type is what a
 * logo mostly is.
 *
 * Each row used to be a single line of text that was read as an image address
 * or as a name depending on how it started, with no way to say both and no way
 * to say where it links. That guess is gone: a row now has its own image,
 * label and link boxes.
 */
export const LogoStrip = ({ logos, height, gap, grayscale, color }) => {
  const { connectors: { connect } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const items = readLogoRows({ logos });
  const size = Number(height) || 32;

  const draw = (row) => (row.src ? (
    <img
      src={row.src}
      alt={row.label || ''}
      style={{ height: `${size}px`, width: 'auto', display: 'block' }}
    />
  ) : (
    <span
      style={{
        // Sized off the strip height so names and image logos sit on the same
        // line rather than one dwarfing the other.
        fontSize: `${Math.round(size * 0.62)}px`,
        fontWeight: 700,
        opacity: grayscale === 'no' ? 1 : 0.75,
        letterSpacing: '-0.01em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {row.label}
    </span>
  ));

  return (
    <div
      ref={connect}
      className={grayscale === 'no' ? 'dc-logos' : 'dc-logos dc-logos--muted'}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${Number(gap) || 40}px`,
        width: '100%',
        minHeight: `${size}px`,
        // Wordmarks are type, so they take the colour of whatever they sit in
        // unless told otherwise — and a strip inherited from a dark hero came
        // out near-invisible. Worth its own prop rather than a parent's accident.
        ...(color ? { color: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})` } : {}),
      }}
    >
      {items.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first company in the panel on the right</p>
      ) : items.map((row, i) => {
        const href = safeHref(row.href);
        const live = !enabled && href;
        return live ? (
          <a
            key={i}
            href={live}
            target={opensNewTab(live) ? '_blank' : undefined}
            rel={opensNewTab(live) ? 'noopener noreferrer' : undefined}
            style={{ color: 'inherit', textDecoration: 'none', lineHeight: 0 }}
          >
            {draw(row)}
          </a>
        ) : (
          <React.Fragment key={i}>{draw(row)}</React.Fragment>
        );
      })}
    </div>
  );
};

const LogoStripSettings = () => {
  const { rows, update, add, remove, move } = useRowProp('logos', readLogoRows, emptyLogoRow);

  return (
    <React.Fragment>
      <ToolbarHelp title="Companies" icon="view_week">
        The names or logos of people you work with. If you do not have a logo
        file, leave the image address empty and type the company name — it is set
        in type at the same height as the logos beside it, which is what a
        wordmark is.
      </ToolbarHelp>

      <ToolbarSection title="Companies">
        <RowList empty="No companies yet." addLabel="Add company" onAdd={add}>
          {rows.map((row, index) => (
            <RowCard
              key={index}
              title={row.label || row.src || `Company ${index + 1}`}
              index={index}
              count={rows.length}
              onMove={move}
              onRemove={remove}
              removeLabel="Remove this company"
            >
              <RowField
                label="Company name"
                placeholder="Northwind"
                hint="Shown as a wordmark when there is no image, and read aloud when there is."
                value={row.label}
                onChange={(e) => update(index, 'label', e.target.value)}
              />
              <RowField
                label="Logo image address (optional)"
                placeholder="https://example.com/northwind.svg"
                value={row.src}
                onChange={(e) => update(index, 'src', e.target.value)}
              />
              <RowField
                label="Link (optional)"
                placeholder="https://northwind.example.com"
                hint="Where clicking the logo takes a visitor."
                value={row.href}
                onChange={(e) => update(index, 'href', e.target.value)}
              />
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="color" type="color" label="Wordmark colour" />
        <ToolbarItem full={true} propKey="height" type="slider" label="Logo height" min={16} max={80} />
        <ToolbarItem full={true} propKey="gap" type="slider" label="Space between" min={12} max={96} />
      </ToolbarSection>
    </React.Fragment>
  );
};

LogoStrip.craft = {
  displayName: 'LogoStrip',
  props: {
    logos: [
      { src: '', label: 'Kettle', href: '' },
      { src: '', label: 'Fathom', href: '' },
      { src: '', label: 'Northwind', href: '' },
    ],
    height: '32',
    gap: '40',
    grayscale: 'yes',
    color: null,
  },
  related: { toolbar: LogoStripSettings },
};
