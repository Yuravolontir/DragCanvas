import React from 'react';
import { Carousel as BootstrapCarousel } from 'react-bootstrap/Carousel';
import { useNode } from '@craftjs/core';
import { CarouselSettings } from '.././Landing/CarouselSettings';


export const Carousel = ({ src1,src2,src3,heading1,heading2,heading3,label1,label2,label3,p1,p2,p3}) => {
        const { connectors: { connect, drag } } = useNode();
        
        return (
          <BootstrapCarousel  ref={(ref) => connect(drag(ref))} src1={src1}src2={src2}src3={src3}heading1={heading1}heading2={heading2}heading3={heading3}label1={label1}label2={label2}label3={label3}p1={p1}p2={p2}p3={p3}  />
        );
      };  
      Carousel.craft = {
    displayName: 'Carousel',
    props: {
      src1: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      src2: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      src3: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
      heading1: 'First Slide',
      heading2: 'Second Slide',
      heading3: 'Third Slide',
      label1: 'Label 1',
      label2: 'Label 2',
      label3: 'Label 3',
      p1: 'Description for first slide',
      p2: 'Description for second slide',
      p3: 'Description for third slide'
    },
    related: {
      toolbar: CarouselSettings,
    },
  };