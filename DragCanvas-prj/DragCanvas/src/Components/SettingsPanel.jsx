import React from 'react';
import {
  Box,
  Button as MaterialButton,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import { useEditor } from '@craftjs/core';

/** Shows controls belonging to whichever Craft.js node is selected. */
export function SettingsPanel() {
  const { selected, actions } = useEditor((state, query) => {
    const [selectedNodeId] = state.events.selected;

    if (!selectedNodeId) {
      return { selected: null };
    }

    const selectedNode = state.nodes[selectedNodeId];
    return {
      selected: {
        id: selectedNodeId,
        name: selectedNode.data.name,
        SettingsComponent: selectedNode.related?.settings,
        isDeletable: query.node(selectedNodeId).isDeletable(),
      },
    };
  });

  if (!selected) return null;

  const { SettingsComponent } = selected;

  return (
    <Box bgcolor="rgba(0, 0, 0, 0.06)" mt={2} px={2} py={2}>
      <Grid container direction="column" spacing={0}>
        <Grid item>
          <Box pb={2}>
            <Grid container alignItems="center">
              <Grid item xs>
                <Typography variant="subtitle1">Selected</Typography>
              </Grid>
              <Grid item>
                <Chip size="small" color="primary" label={selected.name} />
              </Grid>
            </Grid>
          </Box>
        </Grid>
        {SettingsComponent && <SettingsComponent />}
        {selected.isDeletable && (
          <MaterialButton
            variant="contained"
            color="inherit"
            onClick={() => actions.delete(selected.id)}
          >
            Delete
          </MaterialButton>
        )}
      </Grid>
    </Box>
  );
}
