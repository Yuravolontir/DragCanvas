import React from 'react';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarRadio } from './Toolbar/ToolbarRadio';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { useNode } from '@craftjs/core';

/** What the value box is asking for, per action, in plain words. */
const VALUE_FIELD = {
  url: { label: 'Web address', placeholder: 'https://example.com' },
  section: { label: 'Section name on this page', placeholder: 'pricing' },
  email: { label: 'Email address', placeholder: 'hello@example.com' },
  phone: { label: 'Phone number', placeholder: '+1 555 0100' },
  payment: { label: 'Checkout page address', placeholder: 'https://buy.example.com/plan' },
  page: { label: 'Page of this project', placeholder: 'about-us' },
};

export const ButtonSettings = () => {
  /*
   * The collector is handed the stored node, which carries data and events and
   * no actions at all. Reading `node.actions` there threw on the first render,
   * so selecting a button blanked the panel. Actions come off the hook.
   */
  const {
    action,
    newTab,
    actions: { setProp },
  } = useNode((node) => ({
    action: node.data.props.action || 'none',
    newTab: !!node.data.props.newTab,
  }));
  return (
    <React.Fragment>
      <ToolbarHelp title="Button" icon="smart_button">
        Give the button its words, then choose what happens when a visitor
        presses it. Payment link takes the checkout address from whichever
        payment service you already use — paste the link it gave you and the
        button opens it in a new tab.
      </ToolbarHelp>
      <ToolbarSection title="Words on the button">
        <ToolbarItem full={true} propKey="text" type="text" label="Button label" />
      </ToolbarSection>
      <ToolbarSection title="What it does">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          <select value={action} onChange={(e) => setProp((p) => { p.action = e.target.value; })} style={{ width: '100%', padding: '7px 8px', borderRadius: 6, marginBottom: 8 }}>
            <option value="none">Nothing</option>
            <option value="url">Open a website</option>
            <option value="section">Jump to a section of this page</option>
            <option value="email">Start an email</option>
            <option value="phone">Call a phone number</option>
            <option value="payment">Open a payment link</option>
            <option value="page">Open another page of this project</option>
          </select>
          {action !== 'none' && (
            <ToolbarItem
              full={true}
              propKey="actionValue"
              type="text"
              label={(VALUE_FIELD[action] || VALUE_FIELD.url).label}
              placeholder={(VALUE_FIELD[action] || VALUE_FIELD.url).placeholder}
            />
          )}
          {action === 'payment' && (
            <p style={{ margin: '2px 0 6px', fontSize: 11, lineHeight: 1.5, color: 'var(--muted)' }}>
              Any hosted checkout page works — paste the link your payment
              provider gave you. It always opens in a new tab so visitors keep
              your page open behind it.
            </p>
          )}
          {action === 'url' && <label style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--muted)' }}><input type="checkbox" checked={newTab} onChange={(e) => setProp((p) => { p.newTab = e.target.checked; })} />Open in a new tab</label>}
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
