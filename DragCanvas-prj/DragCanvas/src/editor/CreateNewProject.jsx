import React from 'react';
import { Editor, Frame } from '@craftjs/core';
import { createTheme, ThemeProvider } from '@mui/material';

import NavBar from '../NavBar';
import { DefaultProjectCanvas } from './DefaultProjectCanvas';
import LoadProjectOnMount from './LoadProjectOnMount';
import * as Landing from './Landing';
import { editorResolver } from './editorResolver.js';

const theme = createTheme({
  typography: {
    fontFamily: ['Plus Jakarta Sans', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
  },
  palette: {
    primary: { main: '#0060ac' },
    secondary: { main: '#a93349' },
  },
});

export default function CreateNewProject() {
  return (
    <>
      <NavBar />
      <ThemeProvider theme={theme}>
        <div className="h-full h-screen">
          <Editor resolver={editorResolver} enabled onRender={Landing.RenderNode}>
            <LoadProjectOnMount />
            <Landing.Viewport>
              <Frame>{DefaultProjectCanvas()}</Frame>
            </Landing.Viewport>
          </Editor>
        </div>
      </ThemeProvider>
    </>
  );
}
