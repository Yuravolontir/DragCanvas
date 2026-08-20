import React from 'react';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarRadio } from './Toolbar/ToolbarRadio';
import { useNode } from '@craftjs/core';

export const ButtonSettings = () => {
  const { action, newTab, setProp } = useNode((node) => ({
    action: node.data.props.action || 'none',
    newTab: !!node.data.props.newTab,
    setProp: node.actions.setProp,
  }));
  return (
    <React.Fragment>
      <ToolbarSection title="Action">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          <select value={action} onChange={(e) => setProp((p) => { p.action = e.target.value; })} style={{ width: '100%', padding: '7px 8px', borderRadius: 6, marginBottom: 8 }}>
            <option value="none">No action</option>
            <option value="url">Open URL</option>
            <option value="section">Go to section</option>
            <option value="email">Send email</option>
            <option value="phone">Call phone number</option>
          </select>
          {action !== 'none' && <ToolbarItem full={true} propKey="actionValue" type="text" label={action === 'section' ? 'Section ID' : action === 'email' ? 'Email address' : action === 'phone' ? 'Phone number' : 'URL'} />}
          {action === 'url' && <label style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--muted)' }}><input type="checkbox" checked={newTab} onChange={(e) => setProp((p) => { p.newTab = e.target.checked; })} />Open in new tab</label>}
        </div>
      </ToolbarSection>
      <ToolbarSection
        title="Colors"
        props={['background', 'color']}
        summary={({ background, color }) => {
          return (
            <div className="flex flex-row-reverse">
              <div
                style={{
                  background:
                    background && `rgba(${Object.values(background)})`,
                }}
                className="shadow-md flex-end w-6 h-6 text-center flex items-center rounded-full bg-black"
              >
                <p
                  style={{
                    color: color && `rgba(${Object.values(color)})`,
                  }}
                  className="text-white w-full text-center"
                >
                  T
                </p>
              </div>
            </div>
          );
        }}
      >
        <ToolbarItem
          full={true}
          propKey="background"
          type="bg"
          label="Background"
        />
        <ToolbarItem full={true} propKey="color" type="color" label="Text" />
      </ToolbarSection>
      <ToolbarSection
        title="Margin"
        props={['margin']}
        summary={({ margin }) => {
          return `${margin[0] || 0}px ${margin[1] || 0}px ${margin[2] || 0}px ${
            margin[3] || 0
          }px`;
        }}
      >
        <ToolbarItem propKey="margin" index={0} type="slider" label="Top" />
        <ToolbarItem propKey="margin" index={1} type="slider" label="Right" />
        <ToolbarItem propKey="margin" index={2} type="slider" label="Bottom" />
        <ToolbarItem propKey="margin" index={3} type="slider" label="Left" />
      </ToolbarSection>
      <ToolbarSection title="Decoration">
        <ToolbarItem propKey="buttonStyle" type="radio" label="Style">
          <ToolbarRadio value="full" label="Full" />
          <ToolbarRadio value="outline" label="Outline" />
        </ToolbarItem>
      </ToolbarSection>
    </React.Fragment>
  );
};
