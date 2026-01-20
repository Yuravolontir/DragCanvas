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

        <div style={{margin: "0 auto", width: "800px"}}>
      <Typography variant="h5" align="center">A super simple page editor</Typography>
      <Grid container spacing={3} style={{paddingTop: "10px"}}>
        <Topbar />
        <Grid item xs>
          <Container padding={5} background="#eee">
            <Card />
          </Container>
        </Grid>
        <Grid item xs={3}>
          <Paper>
              <Toolbox />
              <SettingsPanel />
          </Paper>          
        </Grid>
      </Grid>
    </div>
      </>
    );
  }

