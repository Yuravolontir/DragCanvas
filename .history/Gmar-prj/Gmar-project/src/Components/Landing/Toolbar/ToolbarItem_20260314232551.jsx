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
        {['text', 'color', 'bg', 'number'].includes(type) ? (
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
              }, 0);
            }}
          />
        ) : type === 'slider' ? (
          <>
            {props.label ? (
              <h4 className="text-sm text-light-gray-2">{props.label}</h4>
            ) : null}
 <Slider
    sx={{
      color: '#3880ff',
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
