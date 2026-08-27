import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';

/**
 * One Material symbol.
 *
 * The font is already loaded for the interface, so an icon costs nothing beyond
 * the glyph. Named rather than picked from a list on purpose: the full set is
 * about three thousand symbols, and a picker for it is a project of its own.
 */
export const Icon = ({ name, size, color, background, padded }) => {
  const { connectors: { connect } } = useNode();
  const box = Number(size) || 32;

  return (
    <span
      ref={connect}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: padded === 'yes' ? `${box * 2}px` : 'auto',
        height: padded === 'yes' ? `${box * 2}px` : 'auto',
        borderRadius: padded === 'yes' ? '50%' : 0,
        background: padded === 'yes' && background && typeof background === 'object'
          ? `rgba(${Object.values(background)})`
          : (padded === 'yes' ? background : 'transparent'),
        color: color && typeof color === 'object' ? `rgba(${Object.values(color)})` : color,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: `${box}px` }}>
        {name || 'star'}
      </span>
    </span>
  );
};

const SYMBOLS = [
  'star', 'favorite', 'home', 'search', 'menu', 'close', 'check', 'add', 'arrow_forward',
  'arrow_back', 'expand_more', 'play_arrow', 'pause', 'mail', 'call', 'location_on', 'link',
  'download', 'upload', 'share', 'person', 'group', 'shopping_cart', 'payments', 'verified',
  'bolt', 'schedule', 'calendar_month', 'public', 'language', 'photo_camera', 'image', 'videocam',
  'lightbulb', 'rocket_launch', 'security', 'lock', 'settings', 'edit', 'delete', 'info', 'warning',
];

const IconPicker = () => {
  const [search, setSearch] = useState('');
  const { selected, actions: { setProp } } = useNode((node) => ({
    selected: node.data.props.name || 'star',
  }));
  const shown = SYMBOLS.filter((name) => name.includes(search.trim().toLowerCase().replace(/\s+/g, '_')));

  return <div style={{ width: '100%', padding: '0 8px 8px' }}>
    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search icons" aria-label="Search icons" style={{ width: '100%', padding: '7px 8px', border: '1px solid var(--outline-light)', borderRadius: 6, marginBottom: 8 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
      {shown.map((name) => <button key={name} type="button" title={name} aria-label={`Use ${name} icon`} onClick={() => setProp((p) => { p.name = name; })} style={{ display: 'grid', placeItems: 'center', padding: 6, borderRadius: 6, cursor: 'pointer', border: selected === name ? '2px solid var(--primary)' : '1px solid var(--outline-light)', background: selected === name ? 'var(--surface-container)' : 'transparent', color: 'var(--on-surface)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 21 }}>{name}</span>
      </button>)}
    </div>
    {!shown.length && <div style={{ fontSize: 11, color: 'var(--muted)', padding: 6 }}>No matching icons. Enter a Material Symbol name below.</div>}
  </div>;
};

const IconSettings = () => (
  <React.Fragment>
    <ToolbarSection title="Icon">
      <IconPicker />
      <ToolbarItem full={true} propKey="name" type="text" label="Symbol name" />
      <ToolbarItem full={true} propKey="size" type="slider" label="Size" min={12} max={96} />
      <ToolbarItem full={true} propKey="color" type="color" label="Colour" />
    </ToolbarSection>
    <ToolbarSection title="Backdrop">
      <ToolbarItem full={true} propKey="background" type="bg" label="Circle" />
    </ToolbarSection>
  </React.Fragment>
);

Icon.craft = {
  displayName: 'Icon',
  props: {
    name: 'bolt',
    size: '32',
    padded: 'yes',
    color: { r: 0, g: 64, b: 224, a: 1 },
    background: { r: 238, g: 240, b: 255, a: 1 },
  },
  related: { toolbar: IconSettings },
};
