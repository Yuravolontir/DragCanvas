import { FormControlLabel, Radio } from '@mui/material';
import React from 'react';

// Inspired by blueprintjs
function StyledRadio(props) {
  return (
    <Radio
      disableRipple
      color="default"
      size="small"
      sx={{
        '&.Mui-checked': {
          color: '#0060ac',
        },
      }}
      {...props}
    />
  );
}

export const ToolbarRadio = ({ value, label }) => {
  return (
    <FormControlLabel value={value} control={<StyledRadio />} label={label} />
  );
};
