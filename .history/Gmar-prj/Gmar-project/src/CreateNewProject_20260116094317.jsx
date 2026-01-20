  import React, { useState } from 'react';
  import {useNode} from "@craftjs/core";  
  import NavBar from './NavBar';

  export default function CreateNewProject() {
    
    const TextComponent = ({text}) => {
  const { connectors: {drag} } = useNode();



    return (
      <>
        <NavBar />


      </>
    );
  }
