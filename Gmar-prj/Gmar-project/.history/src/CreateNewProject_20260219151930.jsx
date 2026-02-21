import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { createTheme, ThemeProvider } from '@mui/material';
import NavBar from './NavBar';
import { useUserContext } from './UserContextProvider';
import { useContext } from "react"

import * as Landing from './Components/Landing';

const theme = createTheme({
  typography: {
    fontFamily: ['Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
  },
});

function CreateNewProject() {

    const { addproject } = useUserContext();

    

  return (
    <>
    <NavBar />
    <ThemeProvider theme={theme}>
      <div className="h-full h-screen">
        <Editor
          resolver={{
            Container: Landing.Container,
            Text: Landing.Text,
            Custom1: Landing.Custom1,
            Custom2: Landing.Custom2,
            Custom2VideoDrop: Landing.Custom2VideoDrop,
            Custom3: Landing.Custom3,
            Custom3BtnDrop: Landing.Custom3BtnDrop,
            OnlyButtons: Landing.OnlyButtons,
            Button: Landing.Button,
            Video: Landing.Video,
            Link: Landing.Link,
            Image: Landing.Image,
          }}
          enabled={false}
          onRender={Landing.RenderNode}
        >
          <Landing.Viewport>
            <Frame>
              <Element
                canvas
                is={Landing.Container}
                width="800px"
                height="auto"
                background={{ r: 255, g: 255, b: 255, a: 1 }}
                padding={['40', '40', '40', '40']}
                custom={{ displayName: 'App' }}
              >
                <Element
                  canvas
                  is={Landing.Container}
                  flexDirection="row"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  margin={['0', '0', '40', '0']}
                  custom={{ displayName: 'Introduction' }}
                >
                  <Element
                    canvas
                    is={Landing.Container}
                    width="40%"
                    height="100%"
                    padding={['0', '20', '0', '20']}
                    custom={{ displayName: 'Heading' }}
                  >
                    <Landing.Text
                      fontSize="23"
                      fontWeight="400"
                      text="Craft.js is a React framework for building powerful &amp; feature-rich drag-n-drop page editors."
                    />
                  </Element>
                  <Element
                    canvas
                    is={Landing.Container}
                    width="60%"
                    height="100%"
                    padding={['0', '20', '0', '20']}
                    custom={{ displayName: 'Description' }}
                  >
                    <Landing.Text
                      fontSize="14"
                      fontWeight="400"
                      text="Everything you see here, including the editor, itself is made of React components. Craft.js comes only with the building blocks for a page editor; it provides a drag-n-drop system and handles the way user components should be rendered, updated and moved, among other things. <br /> <br /> You control the way your editor looks and behave."
                    />
                  </Element>
                </Element>

                <Element
                  canvas
                  is={Landing.Container}
                  background={{ r: 39, g: 41, b: 41, a: 1 }}
                  flexDirection="column"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  margin={['0', '0', '40', '0']}
                  custom={{ displayName: 'ComplexSection' }}
                >
                  <Element
                    canvas
                    background={{ r: 76, g: 78, b: 78, a: 0 }}
                    is={Landing.Container}
                    flexDirection="row"
                    margin={['0', '0', '0', '0']}
                    width="100%"
                    height="auto"
                    alignItems="center"
                    custom={{ displayName: 'Wrapper' }}
                  >
                    <Element
                      canvas
                      background={{ r: 0, g: 0, b: 0, a: 0 }}
                      is={Landing.Container}
                      alignItems="center"
                      padding={['0', '0', '0', '0']}
                      flexDirection="row"
                      width="350px"
                      height="250px"
                      custom={{ displayName: 'Square' }}
                    >
                      <Element
                        canvas
                        is={Landing.Container}
                        justifyContent="center"
                        alignItems="center"
                        background={{ r: 76, g: 78, b: 78, a: 1 }}
                        shadow={25}
                        width="90%"
                        height="90%"
                        padding={['10', '20', '10', '20']}
                        custom={{ displayName: 'Outer' }}
                      >
                        <Element
                          canvas
                          is={Landing.Container}
                          justifyContent="center"
                          alignItems="center"
                          background={{ r: 76, g: 78, b: 78, a: 1 }}
                          shadow={50}
                          width="80%"
                          height="80%"
                          padding={['10', '20', '10', '20']}
                          custom={{ displayName: 'Middle' }}
                        >
                          <Element
                            canvas
                            is={Landing.Container}
                            justifyContent="center"
                            alignItems="center"
                            background={{ r: 76, g: 78, b: 78, a: 1 }}
                            shadow={50}
                            width="60%"
                            height="60%"
                            padding={['10', '20', '10', '20']}
                            custom={{ displayName: 'Inner' }}
                          />
                        </Element>
                      </Element>
                    </Element>
                    <Element
                      canvas
                      background={{ r: 0, g: 0, b: 0, a: 0 }}
                      is={Landing.Container}
                      padding={['0', '0', '0', '20']}
                      flexDirection="column"
                      width="55%"
                      height="100%"
                      fillSpace="yes"
                      custom={{ displayName: 'Content' }}
                    >
                      <Landing.Text
                        color={{ r: '255', g: '255', b: '255', a: '1' }}
                        margin={['0', '0', '18', '0']}
                        fontSize="20"
                        text="Design complex components"
                      />
                      <Landing.Text
                        color={{ r: '255', g: '255', b: '255', a: '0.8' }}
                        fontSize="14"
                        fontWeight="400"
                        text="You can define areas within your React component which users can drop other components into. <br/><br />You can even design how the component should be edited — content editable, drag to resize, have inputs on toolbars — anything really."
                      />
                    </Element>
                  </Element>
                </Element>
                <Element
                  canvas
                  is={Landing.Container}
                  background={{ r: 234, g: 245, b: 250, a: 1 }}
                  flexDirection="column"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  margin={['0', '0', '40', '0']}
                  custom={{ displayName: 'Programmatic' }}
                >
                  <Element
                    canvas
                    background={{ r: 76, g: 78, b: 78, a: 0 }}
                    is={Landing.Container}
                    flexDirection="column"
                    margin={['0,', '0', '20', '0']}
                    width="100%"
                    height="auto"
                    custom={{ displayName: 'Heading' }}
                  >
                    <Landing.Text
                      color={{ r: '46', g: '47', b: '47', a: '1' }}
                      fontSize="23"
                      text="Programmatic drag &amp; drop"
                    />
                    <Landing.Text
                      fontSize="14"
                      fontWeight="400"
                      text="Govern what goes in and out of your components"
                    />
                  </Element>
                  <Element
                    canvas
                    background={{ r: 76, g: 78, b: 78, a: 0 }}
                    is={Landing.Container}
                    flexDirection="row"
                    margin={['30', '0', '0', '0']}
                    width="100%"
                    height="auto"
                    custom={{ displayName: 'Content' }}
                  >
                    <Element
                      canvas
                      background={{ r: 0, g: 0, b: 0, a: 0 }}
                      is={Landing.Container}
                      padding={['0', '20', '0', '0']}
                      flexDirection="row"
                      width="45%"
                      custom={{ displayName: 'Left' }}
                    >
                      <Landing.Custom1
                        background={{ r: 119, g: 219, b: 165, a: 1 }}
                        height="auto"
                        width="100%"
                        padding={['20', '20', '20', '20']}
                        margin={['0', '0', '0', '0']}
                        shadow={40}
                      />
                    </Element>
                    <Element
                      canvas
                      background={{ r: 0, g: 0, b: 0, a: 0 }}
                      is={Landing.Container}
                      padding={['0', '0', '0', '20']}
                      flexDirection="column"
                      width="55%"
                      custom={{ displayName: 'Right' }}
                    >
                      <Landing.Custom2
                        background={{ r: 108, g: 126, b: 131, a: 1 }}
                        height="125px"
                        width="100%"
                        padding={['0', '0', '0', '20']}
                        margin={['0', '0', '0', '0']}
                        shadow={40}
                        flexDirection="row"
                        alignItems="center"
                      />
                      <Landing.Custom3
                        background={{ r: 134, g: 187, b: 201, a: 1 }}
                        height="auto"
                        width="100%"
                        padding={['20', '20', '20', '20']}
                        margin={['20', '0', '0', '0']}
                        shadow={40}
                        flexDirection="column"
                      />
                    </Element>
                  </Element>
                </Element>
              </Element>
            </Frame>
          </Landing.Viewport>
        </Editor>
      </div>
    </ThemeProvider>
     </>
  );
   
}

export default CreateNewProject;
