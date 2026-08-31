import React from 'react';
import { readableInkCss } from '../../utils/readableInk.js';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList, useRowProp } from './Toolbar/ToolbarRows';
import { readProductRows, emptyProductRow } from '../../utils/elementRows.js';
import { normalizePaymentUrl } from '../../utils/elementData.js';

/**
 * Products, each with a way to buy it.
 *
 * The checkout is somebody else's: the button opens whatever hosted payment
 * page the owner already uses, which is why the field asks for a link rather
 * than for card details. A product with no link still shows, with the button
 * saying what is missing rather than pretending to work.
 *
 * The four fields used to be four anonymous lines in one box, with the payment
 * links in a second box that had to stay in the same order. Getting either
 * wrong silently sold the wrong thing. They are one record per product now.
 */
export const ProductCatalog = ({ products, paymentLinks, currency, accent, buttonText }) => {
  const { connectors: { connect } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const rows = readProductRows({ products, paymentLinks });
  const bg = accent ? `rgba(${Object.values(accent)})` : '#0060ac';

  const button = (label, background) => (
    <span style={{
      display: 'block', width: 'fit-content', marginTop: 10, background,
      color: readableInkCss(accent), borderRadius: 8, padding: '10px 14px', textDecoration: 'none',
    }}>
      {label}
    </span>
  );

  return (
    <div ref={connect} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, width: '100%' }}>
      {rows.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first product in the panel on the right</p>
      ) : rows.map((row, index) => {
        const href = normalizePaymentUrl(row.href);
        const live = !enabled && href;
        return (
          <article key={index} style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden', padding: 16 }}>
            {row.image && <img src={row.image} alt={row.name || ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />}
            <h3>{row.name}</h3>
            <p>{row.description}</p>
            <strong>{row.price} {String(currency || 'USD').toUpperCase()}</strong>
            {href ? (
              live ? (
                <a href={live} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  {button(buttonText || 'Buy now', bg)}
                </a>
              ) : button(buttonText || 'Buy now', bg)
            ) : button('Add a payment link', '#94a3b8')}
          </article>
        );
      })}
    </div>
  );
};

const ProductCatalogSettings = () => {
  const { rows, update, add, remove, move } = useRowProp('products', readProductRows, emptyProductRow);

  return (
    <React.Fragment>
      <ToolbarHelp title="Products" icon="shopping_cart">
        One card per product. The Buy button opens the checkout page your own
        payment provider gave you — copy that link into the product and the
        button starts working. Products with no link still show, with the button
        greyed out.
      </ToolbarHelp>

      <ToolbarSection title="Products">
        <RowList empty="No products yet." addLabel="Add product" onAdd={add}>
          {rows.map((row, index) => (
            <RowCard
              key={index}
              title={row.name || `Product ${index + 1}`}
              index={index}
              count={rows.length}
              onMove={move}
              onRemove={remove}
              removeLabel="Remove this product"
            >
              <RowField
                label="Name"
                placeholder="Starter kit"
                value={row.name}
                onChange={(e) => update(index, 'name', e.target.value)}
              />
              <RowField
                label="Price"
                placeholder="29.00"
                hint="Just the number. The currency is set below and shown after it."
                value={row.price}
                onChange={(e) => update(index, 'price', e.target.value)}
              />
              <RowField
                label="Description"
                kind="textarea"
                placeholder="Everything needed to begin."
                value={row.description}
                onChange={(e) => update(index, 'description', e.target.value)}
              />
              <RowField
                label="Photo address (optional)"
                placeholder="https://example.com/kit.jpg"
                value={row.image}
                onChange={(e) => update(index, 'image', e.target.value)}
              />
              <RowField
                label="Checkout link"
                placeholder="https://buy.example.com/starter-kit"
                hint="The payment page your provider gave you. Opens in a new tab."
                value={row.href}
                onChange={(e) => update(index, 'href', e.target.value)}
              />
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="All products">
        <ToolbarItem full={true} propKey="buttonText" type="text" label="Button text" placeholder="Buy now" />
        <ToolbarItem full={true} propKey="currency" type="text" label="Currency" placeholder="USD" />
        <ToolbarItem full={true} propKey="accent" type="bg" label="Button colour" />
      </ToolbarSection>
    </React.Fragment>
  );
};

ProductCatalog.craft = {
  displayName: 'ProductCatalog',
  props: {
    products: [
      { name: 'Starter kit', description: 'Everything needed to begin', price: '29.00', image: '', href: '' },
      { name: 'Workshop', description: 'A private one-hour session', price: '79.00', image: '', href: '' },
    ],
    paymentLinks: [],
    buttonText: 'Buy now',
    currency: 'USD',
    accent: { r: 0, g: 96, b: 172, a: 1 },
  },
  related: { toolbar: ProductCatalogSettings },
};
