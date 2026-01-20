  import React, { useState } from 'react';
  import {useNode} from "@craftjs/core";  
  import NavBar from './NavBar';

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
