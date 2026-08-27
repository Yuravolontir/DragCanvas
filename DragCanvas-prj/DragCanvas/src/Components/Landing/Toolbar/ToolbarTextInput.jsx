 import { TextField, InputAdornment } from '@mui/material';
  import * as React from 'react';
  import { useState } from 'react';
  import { ChromePicker } from 'react-color';

  export const ToolbarTextInput = ({
    onChange,
    value,
    label,
    type,
    ...props
  }) => {
    const [internalValue, setInternalValue] = useState(value);
    const [active, setActive] = useState(false);

    React.useEffect(() => {
      let val = value;
      if ((type === 'color' || type === 'bg') && value && typeof value === 'object')
        val = `rgba(${Object.values(value)})`;
      setInternalValue(val);
    }, [value, type]);

    return (
      <div
        style={{ width: '100%', position: 'relative' }}
        onClick={() => {
          setActive(true);
        }}
      >
        {(type === 'color' || type === 'bg') && active ? (
          <div
            className="absolute"
            style={{
              zIndex: 99999,
              top: 'calc(100% + 10px)',
              left: '-5%',
            }}
          >
            <div
              className="fixed top-0 left-0 w-full h-full
  cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive(false);
              }}
            ></div>
            <ChromePicker
              color={value}
              onChange={(color) => {
                onChange(color.rgb);
              }}
            />
          </div>
        ) : null}
        <TextField
          label={label}
          style={{ margin: 0, width: '100%' }}
          value={internalValue || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            setInternalValue(newValue);
            onChange(newValue);
          }}
          margin="dense"
          variant="standard"
          sx={{
            padding: 0,
            width: '100%',
            background: 'transparent',
            borderRadius: '100px',
            border: 'none',
            margin: 0,
            marginTop: 7,
            position: 'relative',
            '.MuiInputBase-input': {
              background: 'var(--surface-dim)',
              color: 'var(--on-surface)',
              border: '1px solid var(--outline-light)',
              borderRadius: '100px',
              fontSize: '0.85rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              position: 'relative',
              padding: '9px 12px',
              paddingLeft: ['color', 'bg'].includes(type) ? '34px' : '12px',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              '&:focus': {
                borderColor: 'var(--primary)',
                boxShadow: '0 0 0 3px color-mix(in oklab, var(--primary) 14%, transparent)',
              },
            },
          }}
          InputProps={{
            disableUnderline: true,
            startAdornment: ['color', 'bg'].includes(type) ? (
              <InputAdornment
                position="start"
                style={{
                  position: 'absolute',
                  marginTop: '2px',
                  marginRight: '8px',
                }}
              >
                <div
                  className="w-2 h-2 inline-block rounded-full
  relative z-10"
                  style={{
                    left: '15px',
                    background: internalValue,
                  }}
                />
              </InputAdornment>
            ) : null,
          }}
          InputLabelProps={{
            classes: {},
            shrink: true,
          }}
          {...props}
        />
      </div>
    );
  };
