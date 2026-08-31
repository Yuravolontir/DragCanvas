import { useEditor } from '@craftjs/core';
import { readableInkCss } from '../../utils/readableInk.js';
import React from 'react';
import { Resizer } from './Resizer';
import { FormSettings } from './FormSettings';

/**
 * A contact form.
 *
 * In the editor this is a preview - the inputs are inert so a click selects the
 * component instead of typing into it. What visitors actually use is produced
 * by the converter in utils/exportToHtml.js, which turns these props into a
 * real <form> that posts to /api/forms/submit.
 */
export const Form = (props) => {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const {
    fields = [],
    submitText = 'Send',
    background,
    accent,
    textColor,
    inputBackground,
    inputBorder,
    radius = 8,
  } = props;

  const bg = background ? `rgba(${background.r},${background.g},${background.b},${background.a})` : '#ffffff';
  const accentColor = accent ? `rgba(${accent.r},${accent.g},${accent.b},${accent.a})` : '#7e57c2';
  const labelColor = textColor ? `rgba(${Object.values(textColor)})` : '#49454f';
  const fieldBackground = inputBackground ? `rgba(${Object.values(inputBackground)})` : '#fff';
  const fieldBorder = inputBorder ? `rgba(${Object.values(inputBorder)})` : '#ddd';

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 12,
    border: `1px solid ${fieldBorder}`,
    borderRadius: radius,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: fieldBackground,
    color: '#1c1b1f',
  };

  return (
    <Resizer propKey={{ width: 'width', height: 'height' }} style={{ display: 'block' }}>
      <div style={{ background: bg, padding: 24, borderRadius: radius, boxSizing: 'border-box' }}>
        {fields.map((field, index) => (
          <div key={index}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: labelColor }}>
              {field.label}{field.required ? ' *' : ''}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                rows={4}
                placeholder={field.placeholder || ''}
                style={{ ...inputStyle, resize: 'vertical' }}
                readOnly
                // In the editor the inputs must not steal the click
                tabIndex={enabled ? -1 : 0}
              />
            ) : field.type === 'file' ? (
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" style={inputStyle} disabled={enabled} />
            ) : (
              <input
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                placeholder={field.placeholder || ''}
                style={inputStyle}
                readOnly
                tabIndex={enabled ? -1 : 0}
              />
            )}
          </div>
        ))}

        <button
          type="button"
          style={{
            background: accentColor,
            color: readableInkCss(accent),
            border: 'none',
            borderRadius: radius,
            padding: '11px 22px',
            fontSize: 14,
            fontWeight: 600,
            cursor: enabled ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitText}
        </button>

        {enabled && (
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#a09aa8' }}>
            Preview mode — the form becomes interactive after publishing. Submissions are saved in your project and emailed to you.
          </p>
        )}
      </div>
    </Resizer>
  );
};

Form.craft = {
  displayName: 'Form',
  props: {
    fields: [
      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
      { label: 'Message', type: 'textarea', placeholder: 'How can we help?', required: false },
    ],
    submitText: 'Send',
    successMessage: 'Thank you! We will be in touch.',
    background: { r: 255, g: 255, b: 255, a: 1 },
    accent: { r: 126, g: 87, b: 194, a: 1 },
    textColor: { r: 73, g: 69, b: 79, a: 1 },
    inputBackground: { r: 255, g: 255, b: 255, a: 1 },
    inputBorder: { r: 221, g: 221, b: 221, a: 1 },
    radius: 8,
    width: '100%',
    height: 'auto',
  },
  related: {
    toolbar: FormSettings,
  },
};
