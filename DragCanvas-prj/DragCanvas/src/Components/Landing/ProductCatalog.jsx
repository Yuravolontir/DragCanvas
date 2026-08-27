import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { groupLines, normalizePaymentUrl } from '../../utils/elementData.js';

export const ProductCatalog = ({ products, paymentLinks, currency, accent, buttonText }) => {
  const { connectors: { connect } } = useNode();
  const rows = groupLines(products, 4);
  const bg = accent ? `rgba(${Object.values(accent)})` : '#0060ac';
  return <div ref={connect} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, width: '100%' }}>
    {rows.map(([name, description, price, image], index) => {
      const href = normalizePaymentUrl(paymentLinks?.[index]);
      return <article key={index} style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden', padding: 16 }}>
        {image && <img src={image} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />}
        <h3>{name}</h3><p>{description}</p><strong>{price} {String(currency || 'USD').toUpperCase()}</strong>
        {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: 'fit-content', marginTop: 10, background: bg, color: '#fff', borderRadius: 8, padding: 10, textDecoration: 'none' }}>{buttonText || 'Buy now'}</a>
          : <span style={{ display: 'block', width: 'fit-content', marginTop: 10, background: '#94a3b8', color: '#fff', borderRadius: 8, padding: 10 }}>{buttonText || 'Add payment link'}</span>}
      </article>;
    })}
  </div>;
};

const Settings = () => <>
  <ToolbarSection title="Products">
    <ToolbarItem full propKey="products" type="lines" label="Per product: name, description, price, image URL" />
    <ToolbarItem full propKey="paymentLinks" type="lines" label="One payment link per product" />
    <ToolbarItem full propKey="buttonText" type="text" label="Button text" />
    <ToolbarItem full propKey="currency" type="text" label="Currency (USD, EUR, ILS)" />
  </ToolbarSection>
  <ToolbarSection title="Appearance"><ToolbarItem full propKey="accent" type="bg" label="Buttons" /></ToolbarSection>
</>;

ProductCatalog.craft = {
  displayName: 'ProductCatalog',
  props: {
    products: ['Starter kit', 'Everything needed to begin', '29.00', '', 'Workshop', 'A private one-hour session', '79.00', ''],
    paymentLinks: ['', ''], buttonText: 'Buy now', currency: 'USD', accent: { r: 0, g: 96, b: 172, a: 1 },
  },
  related: { toolbar: Settings },
};
