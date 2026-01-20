  import React, { useState } from 'react';
  import {useNode} from "@craftjs/core";  
  import NavBar from './NavBar';

import {Typography, Paper, Grid} from '@mui/material';

import { Toolbox } from '../components/Toolbox';
import { SettingsPanel } from '../components/SettingsPanel';

import { Container } from '../components/user/Container';
import { Button } from '../components/user/Button';
import { Card } from '../components/user/Card';
import { Text } from '../components/user/Text';

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
                <Container padding={5} background="#eee">
                  <Card />
                  <Button size="small" variant="outlined">Click</Button>
                  <Text size="small" text="Hi world!" />
                  <Container padding={6} background="#999">
                    <Text size="small" text="It's me again!" />
                  </Container>
                </Container>
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

