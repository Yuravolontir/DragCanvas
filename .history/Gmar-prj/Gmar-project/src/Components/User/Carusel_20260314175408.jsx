import React from 'react';
import { Carousel as BootstrapCarousel } from 'react-bootstrap/Carousel';
import { useNode } from '@craftjs/core';
import { CarouselSettings } from './CarouselSettings';


export const Carousel = ({ src1,src2,src3,heading1,heading2,heading3,label1,label2,label3,p1,p2,p3}) => {
        const { connectors: { connect, drag } } = useNode();
        
        return (
          <BootstrapCarousel  ref={(ref) => connect(drag(ref))} src1={src1}src2={src2}src3={src3}heading1={heading1}heading2={heading2}heading3={heading3}label1={label1}label2={label2}label3={label3}p1={p1}p2={p2}p3={p3}  />
        );
      };  
      Carousel.craft = {
    displayName: 'Carousel',
    props: {
      src1: '',
      src2:'',
      src3:'',
      heading1:'',
      heading2:'',
      heading3:'',
      p1:'',
      p2:'',
      p3:''
    },
    related: {
      toolbar: CarouselSettings,
    },
  };