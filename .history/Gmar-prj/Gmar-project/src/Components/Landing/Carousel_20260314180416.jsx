import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import { Resizer } from './Resizer';
  import { CarouselSettings } from './CarouselSettings';
import Carousel from 'react-bootstrap/Carousel';
import ExampleCarouselImage from 'components/ExampleCarouselImage';


  export const Carousel = (props) => {
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { src1,src2,src3,heading1,heading2,heading3,label1,label2,label3,p1,p2,p3 } = props;

    return (
  <Resizer
    propKey={{ width: 'width', height: 'height' }}
    style={{
      width: 'fit-content',
      display: 'block',
      overflow: 'hidden',
    }}
  >
<Carousel>
      <Carousel.Item>
        <ExampleCarouselImage text={heading1}/>
        <Carousel.Caption>
          <h3>{label1}</h3>
          <p>{p1}</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <ExampleCarouselImage text={heading2} />
        <Carousel.Caption>
          <h3>{label2}</h3>
          <p>{p2}</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <ExampleCarouselImage text={heading3} />
        <Carousel.Caption>
          <h3>{label3}</h3>
          <p>
           {p3}
          </p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
      </Resizer>
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