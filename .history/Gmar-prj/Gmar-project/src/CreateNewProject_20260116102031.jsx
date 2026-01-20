  import React, { useState } from 'react';
  import {useNode} from "@craftjs/core";  
  import NavBar from './NavBar';

import {Typography, Paper, Grid} from '@mui/material';

import { Toolbox } from './components/Toolbox';
import { SettingsPanel } from './components/SettingsPanel';

import { Container } from './components/user/Container';
import { Button } from './components/user/Button';
import { Card } from './components/user/Card';
import { Text } from './components/user/Text';

import {Editor, Frame, Element} from "@craftjs/core";

  export default function CreateNewProject() {





    return (
      <>
        <NavBar />

        <div>
      <Typography variant="h5" align="center">A super simple page editor</Typography>
        <Editor resolver={{Card, Button, Text, Container}}> 
          <Grid container spacing={3}>
            <Grid item xs>
<Frame>
  <Element is={Container} padding={5} background="#eee" canvas> // Canvas Node of type Container, droppable
    <Card /> // Node of type Card
    <Button size="small" variant="outlined">Click</Button> // Node of type Button, draggable
    <Text size="small" text="Hi world!" /> // Node of type Text, draggable
    <Element is={Container} padding={2} background="#999" canvas> // Canvas Node of type Container, droppable and draggable
       <Text size="small" text="It's me again!" /> // Node of type Text, draggable
    </Element>
  </Element>
</Frame>
            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.root}>
                  <Toolbox />
                  <SettingsPanel />
              </Paper>          
            </Grid>
          </Grid>
        </Editor>
    </div>
      </>
    );
  }

