import React from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
export const Booking = ({ heading, buttonText, duration, startHour, endHour, timeZone, accent }) => {
  const { enabled } = useEditor(state => ({ enabled: state.options.enabled })); const { connectors: { connect } } = useNode(); const bg = accent ? `rgba(${Object.values(accent)})` : '#0060ac';
  return <div ref={connect} style={{ width: '100%' }}><strong>{heading}</strong><small style={{ display: 'block', opacity: 0.7 }}>{startHour}:00–{endHour}:00 · {duration} min · {timeZone}</small><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}><input type="date" disabled={enabled}/><select disabled={enabled}><option>{duration} minute slot</option></select><input placeholder="Name" disabled={enabled}/><input placeholder="Email" disabled={enabled}/></div><button disabled={enabled} style={{ marginTop: 8, padding: '12px 18px', border: 0, borderRadius: 8, background: bg, color: '#fff' }}>{buttonText}</button></div>;
};
const Settings = () => <><ToolbarSection title="Booking"><ToolbarItem full propKey="heading" type="text" label="Heading"/><ToolbarItem full propKey="buttonText" type="text" label="Button"/><ToolbarItem full propKey="duration" type="number" label="Minutes"/><ToolbarItem full propKey="startHour" type="number" label="Start hour"/><ToolbarItem full propKey="endHour" type="number" label="End hour"/><ToolbarItem full propKey="timeZone" type="text" label="IANA timezone"/></ToolbarSection><ToolbarSection title="Appearance"><ToolbarItem full propKey="accent" type="bg" label="Button"/></ToolbarSection></>;
Booking.craft = { displayName: 'Booking', props: { heading: 'Book an appointment', buttonText: 'Confirm booking', duration: 60, startHour: 9, endHour: 17, timeZone: 'UTC', accent: { r: 0, g: 96, b: 172, a: 1 } }, related: { toolbar: Settings } };
