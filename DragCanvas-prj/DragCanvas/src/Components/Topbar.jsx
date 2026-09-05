import React from 'react';
import {
  Box,
  Button as MaterialButton,
  FormControlLabel,
  Grid,
  Switch,
} from '@mui/material';
import { useEditor } from '@craftjs/core';

/** Small Craft.js developer toolbar used to inspect serialized canvas data. */
export function Topbar() {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const changeEditingState = (_event, nextEnabled) => {
    actions.setOptions((options) => {
      options.enabled = nextEnabled;
    });
  };

  const logSerializedCanvas = () => {
    console.log(query.serialize());
  };

  return (
    <Box px={1} py={1} mt={3} mb={1} bgcolor="#cbe8e7">
      <Grid container alignItems="center">
        <Grid item xs>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={changeEditingState}
              />
            }
            label="Enable"
          />
        </Grid>
        <Grid item>
          <MaterialButton
            size="small"
            variant="outlined"
            color="secondary"
            onClick={logSerializedCanvas}
          >
            Serialize JSON to console
          </MaterialButton>
        </Grid>
      </Grid>
    </Box>
  );
}
