import { useNode } from '@craftjs/core';
import { GridLegacy, Slider, RadioGroup } from '@mui/material';
import * as React from 'react';

import { ToolbarDropdown } from './ToolbarDropdown';
import { ToolbarTextInput } from './ToolbarTextInput';

export const ToolbarItem = ({
  full = false,
  propKey,
  type,
  onChange,
  index,
  ...props
}) => {
  const {
    actions: { setProp },
    propValue,
  } = useNode((node) => ({
    propValue: node.data.props[propKey],
  }));
  const value = Array.isArray(propValue) ? propValue[index] : propValue;

  return (
    <GridLegacy item xs={full ? 12 : 6}>
      <div className="mb-2">
        {type === 'lines' ? (
          /*
            A list of short strings, edited as one per line.
            
            Several of the newer elements hold a list - list items, FAQ entries,
            the features under a pricing tier - and the alternative is a repeater
            with add and remove buttons, which is a great deal of machinery for
            four lines of text. The prop stays an array; only the editing is flat.
          */
          <>
            {props.label ? (
              <h4 className="text-sm text-light-gray-2">{props.label}</h4>
            ) : null}
            <textarea
              rows={Math.max(3, (Array.isArray(value) ? value.length : 1) + 1)}
              defaultValue={Array.isArray(value) ? value.join('\n') : (value || '')}
              onBlur={(e) => {
                setProp((props) => {
                  props[propKey] = e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean);
                }, 500);
              }}
              style={{
                width: '100%',
                background: 'var(--surface-dim)',
                color: 'var(--on-surface)',
                border: '1px solid var(--outline-light)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 12,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </>
        ) : ['text', 'color', 'bg', 'number'].includes(type) ? (
          <ToolbarTextInput
            {...props}
            type={type}
            value={value}
            onChange={(value) => {
              setProp((props) => {
                if (Array.isArray(propValue)) {
                  props[propKey][index] = onChange ? onChange(value) : value;
                } else {
                  props[propKey] = onChange ? onChange(value) : value;
                }
              }, 500);
            }}
          />
        ) : type === 'slider' ? (
          <>
            {props.label ? (
              <h4 className="text-sm text-light-gray-2">{props.label}</h4>
            ) : null}
 <Slider
    sx={{
      color: '#0060ac',
      height: 2,
      padding: '5px 0',
      width: '100%',
      '& .MuiSlider-track': {
        height: 2,
      },
      '& .MuiSlider-thumb': {
        height: 12,
        width: 12,
      },
    }}
    value={parseInt(value) || 0}
    max={props.max || 100}  // ADD THIS LINE
    onChange={(_, value) => {
      setProp((props) => {
        if (Array.isArray(propValue)) {
          props[propKey][index] = onChange ?
  onChange(value) : value;
        } else {
          props[propKey] = onChange ? onChange(value)
   : value;
        }
      }, 1000);
    }}
  />
          </>
        ) : type === 'radio' ? (
          <>
            {props.label ? (
              <h4 className="text-sm text-light-gray-2">{props.label}</h4>
            ) : null}
            <RadioGroup
              value={value || 0}
              onChange={(e) => {
                const value = e.target.value;
                setProp((props) => {
                  props[propKey] = onChange ? onChange(value) : value;
                });
              }}
            >
              {props.children}
            </RadioGroup>
          </>
        ) : type === 'select' ? (
          <ToolbarDropdown
            value={value || ''}
            onChange={(value) =>
              setProp(
                (props) => (props[propKey] = onChange ? onChange(value) : value)
              )
            }
            {...props}
          />
        ) : null}
      </div>
    </GridLegacy>
  );
};
