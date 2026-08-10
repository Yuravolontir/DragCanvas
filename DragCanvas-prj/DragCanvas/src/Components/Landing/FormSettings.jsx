import React from 'react';
import { useNode } from '@craftjs/core';
import { ToolbarSection, ToolbarItem } from './Toolbar';

const FIELD_TYPES = ['text', 'email', 'phone', 'textarea'];

/**
 * Field editor for the Form component.
 *
 * The generic ToolbarItem only handles flat props, and fields are a list of
 * objects, so this section is written by hand.
 */
export const FormSettings = () => {
  const { fields, actions: { setProp } } = useNode((node) => ({
    fields: node.data.props.fields || [],
  }));

  const updateField = (index, key, value) => {
    setProp((props) => { props.fields[index][key] = value; });
  };

  const addField = () => {
    setProp((props) => {
      props.fields = [...(props.fields || []), { label: 'New field', type: 'text', placeholder: '', required: false }];
    });
  };

  const removeField = (index) => {
    setProp((props) => { props.fields = props.fields.filter((_, i) => i !== index); });
  };

  const moveField = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setProp((props) => {
      const next = [...props.fields];
      [next[index], next[target]] = [next[target], next[index]];
      props.fields = next;
    });
  };

  const smallInput = {
    width: '100%',
    padding: '5px 8px',
    fontSize: 12,
    border: '1px solid #e8e0eb',
    borderRadius: 6,
    marginBottom: 5,
    boxSizing: 'border-box',
  };

  const iconButton = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: '#79747e',
    padding: '0 4px',
  };

  return (
    <React.Fragment>
      <ToolbarSection title="Fields">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          {fields.map((field, index) => (
            <div
              key={index}
              style={{ border: '1px solid #f0ecf2', borderRadius: 8, padding: 8, marginBottom: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#a09aa8', flex: 1 }}>Field {index + 1}</span>
                <button style={iconButton} onClick={() => moveField(index, -1)} title="Move up">↑</button>
                <button style={iconButton} onClick={() => moveField(index, 1)} title="Move down">↓</button>
                <button style={{ ...iconButton, color: '#c00' }} onClick={() => removeField(index)} title="Remove">✕</button>
              </div>

              <input
                style={smallInput}
                value={field.label}
                placeholder="Label"
                onChange={(e) => updateField(index, 'label', e.target.value)}
              />
              <input
                style={smallInput}
                value={field.placeholder || ''}
                placeholder="Placeholder"
                onChange={(e) => updateField(index, 'placeholder', e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  style={{ ...smallInput, marginBottom: 0, flex: 1 }}
                  value={field.type}
                  onChange={(e) => updateField(index, 'type', e.target.value)}
                >
                  {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <label style={{ fontSize: 11, color: '#79747e', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={!!field.required}
                    onChange={(e) => updateField(index, 'required', e.target.checked)}
                  />
                  required
                </label>
              </div>
            </div>
          ))}

          <button
            onClick={addField}
            style={{
              width: '100%',
              padding: '7px',
              fontSize: 12,
              borderRadius: 8,
              border: '1px dashed #cac4d0',
              background: 'transparent',
              cursor: 'pointer',
              color: '#7e57c2',
            }}
          >
            + Add field
          </button>
        </div>
      </ToolbarSection>

      <ToolbarSection title="Texts">
        <ToolbarItem full={true} propKey="submitText" type="text" label="Button" />
        <ToolbarItem full={true} propKey="successMessage" type="text" label="After sending" />
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="radius" type="slider" label="Radius" max={40} />
      </ToolbarSection>
    </React.Fragment>
  );
};
