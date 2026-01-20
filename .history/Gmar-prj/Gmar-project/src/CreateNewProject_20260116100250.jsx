  import React, { useState } from 'react';
  import {useNode} from "@craftjs/core";  
  import NavBar from './NavBar';

import {Typography, Paper, Grid} from '@mui/material';

import { Toolbox } from './Components/Toolbox';
import { SettingsPanel } from './components/SettingsPanel';
import { Topbar } from './components/Topbar';

import { Container } from './components/user/Container';
import { Button } from '../components/user/Button';
import { Card } from '../components/user/Card';
import { Text } from '../components/user/Text';

  export default function CreateNewProject() {

    const TextComponent = ({text}) => {
    const { connectors: {drag} } = useNode();



    return (
      <>
        <NavBar />

            <div ref={drag}>
            <h2>{text}</h2>
            </div>
      </>
    );
  }
}
