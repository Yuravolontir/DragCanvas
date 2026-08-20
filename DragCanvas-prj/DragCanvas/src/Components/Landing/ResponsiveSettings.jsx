import { useEditor } from '@craftjs/core';
import React from 'react';

import { useDeviceMode } from '../../useDeviceMode.js';

const inputStyle = {
  width: '100%', padding: '6px 8px', borderRadius: 6,
  border: '1px solid var(--outline-light)', background: 'var(--surface)',
  color: 'var(--on-surface)', fontSize: 12,
};

export function ResponsiveSettings({ nodeId, nodeProps }) {
  const device = useDeviceMode();
  const { actions } = useEditor();
  if (!nodeId) return null;

  const override = device === 'desktop' ? nodeProps : (nodeProps.responsive?.[device] || {});
  const set = (key, value) => actions.setProp(nodeId, (props) => {
    if (device === 'desktop') props[key] = value;
    else {
      props.responsive ||= {};
      props.responsive[device] ||= {};
      if (value === '') delete props.responsive[device][key];
      else props.responsive[device][key] = value;
    }
  });

  const spacing = (key, index, value) => actions.setProp(nodeId, (props) => {
    const base = Array.isArray(props[key]) ? props[key] : ['0', '0', '0', '0'];
    if (device === 'desktop') {
      props[key] = [...base];
      props[key][index] = value;
    } else {
      props.responsive ||= {};
      props.responsive[device] ||= {};
      const inherited = props.responsive[device][key] || base;
      props.responsive[device][key] = [...inherited];
      props.responsive[device][key][index] = value;
    }
  });

  const inheritedNote = device === 'desktop' ? 'Base values for all devices' : 'Empty fields inherit Desktop values';
  const hasSpacing = Array.isArray(nodeProps.padding) || Array.isArray(nodeProps.margin);

  return (
    <section style={{ padding: '12px 10px', borderTop: '1px solid var(--outline-light)' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
        Responsive · {device}
      </div>
      <p style={{ margin: '4px 0 10px', fontSize: 10, color: 'var(--muted)' }}>{inheritedNote}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ fontSize: 10, color: 'var(--muted)' }}>Width
          <input style={inputStyle} value={override.width ?? ''} placeholder={nodeProps.width || 'auto'} onChange={(e) => set('width', e.target.value)} />
        </label>
        <label style={{ fontSize: 10, color: 'var(--muted)' }}>Height
          <input style={inputStyle} value={override.height ?? ''} placeholder={nodeProps.height || 'auto'} onChange={(e) => set('height', e.target.value)} />
        </label>
      </div>

      {device !== 'desktop' && (
        <label style={{ display: 'block', marginTop: 8, fontSize: 10, color: 'var(--muted)' }}>Visibility
          <select style={inputStyle} value={override.visible === false ? 'hide' : override.visible === true ? 'show' : 'inherit'} onChange={(e) => set('visible', e.target.value === 'inherit' ? '' : e.target.value === 'show')}>
            <option value="inherit">Same as Desktop</option>
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </select>
        </label>
      )}

      {hasSpacing && ['padding', 'margin'].map((key) => {
        const values = override[key] || nodeProps[key] || ['0', '0', '0', '0'];
        return (
          <div key={key} style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 4, fontSize: 10, color: 'var(--muted)', textTransform: 'capitalize' }}>{key}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {['T', 'R', 'B', 'L'].map((label, index) => (
                <label key={label} style={{ fontSize: 9, textAlign: 'center', color: 'var(--muted)' }}>{label}
                  <input style={{ ...inputStyle, padding: 4, textAlign: 'center' }} value={values[index] ?? 0} onChange={(e) => spacing(key, index, e.target.value)} />
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
