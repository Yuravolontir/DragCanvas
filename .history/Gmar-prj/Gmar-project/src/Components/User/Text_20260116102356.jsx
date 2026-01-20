import React from "react";
import { Typography } from "@mui/material";
import { useNode } from "@craftjs/core";

export const Text = ({text}) => {
  const { connectors: {connect, drag} } = useNode();
  return (
     <div 
      ref={ref => connect(drag(ref))}
    >
      <p>{text}</p>
    </div>
  )
}