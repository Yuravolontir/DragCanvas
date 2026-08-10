import { useNode, useEditor } from '@craftjs/core';
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
    successMessage = 'Thank you! We will be in touch.',
    background,
    accent,
    radius = 8,
  } = props;

  const bg = background ? `rgba(${background.r},${background.g},${background.b},${background.a})` : '#ffffff';
  const accentColor = accent ? `rgba(${accent.r},${accent.g},${accent.b},${accent.a})` : '#7e57c2';

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 12,
    border: '1px solid #ddd',
    borderRadius: radius,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#1c1b1f',
  };

  return (
    <Resizer propKey={{ width: 'width', height: 'height' }} style={{ display: 'block' }}>
      <div style={{ background: bg, padding: 24, borderRadius: radius, boxSizing: 'border-box' }}>
        {fields.map((field, index) => (
          <div key={index}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#49454f' }}>
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
            color: '#fff',
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
            After publishing, submissions arrive by email and in your project.
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
    radius: 8,
    width: '100%',
    height: 'auto',
  },
  related: {
    toolbar: FormSettings,
  },
};
