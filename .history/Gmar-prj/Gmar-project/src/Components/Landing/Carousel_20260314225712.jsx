  import { useNode, useEditor } from '@craftjs/core';
  import React from 'react';
  import { Resizer } from './Resizer';
  import { CarouselSettings } from './CarouselSettings';
  import BootstrapCarousel from 'react-bootstrap/Carousel';

  export const Carousel = (props) => {
    const { connectors: { drag } } = useNode();
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }));

    const { src1, src2, src3, heading1, heading2, heading3, label1,
     label2, label3, p1, p2, p3 } = props;

    return (
      <Resizer
        propKey={{ width: 'width', height: 'height' }}
        style={{
          width: 'fit-content',
          display: 'block',
          overflow: 'hidden',
        }}
      >
        <div ref={drag} style={{ display: 'inline-block', width:
  '100%' }}>
          <BootstrapCarousel>
            <BootstrapCarousel.Item>
              <div
                style={{
                  height: "400px",
                  backgroundImage: `url(${src1 ||
    'https://via.placeholder.com/800x400'})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }}
              />
              <BootstrapCarousel.Caption>
                <h3>{heading1 || 'Slide 1'}</h3>
                <p>{p1 || 'Description'}</p>
              </BootstrapCarousel.Caption>
            </BootstrapCarousel.Item>
            <BootstrapCarousel.Item>
              <div
                style={{
                  height: "400px",
                  backgroundImage: `url(${src2 ||
    'https://via.placeholder.com/800x400'})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }}
              />
              <BootstrapCarousel.Caption>
                <h3>{heading2 || 'Slide 2'}</h3>
                <p>{p2 || 'Description'}</p>
              </BootstrapCarousel.Caption>
            </BootstrapCarousel.Item>
            <BootstrapCarousel.Item>
              <div
                style={{
                  height: "400px",
                  backgroundImage: `url(${src3 ||
    'https://via.placeholder.com/800x400'})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }}
              />
              <BootstrapCarousel.Caption>
                <h3>{heading3 || 'Slide 3'}</h3>
                <p>{p3 || 'Description'}</p>
              </BootstrapCarousel.Caption>
            </BootstrapCarousel.Item>
          </BootstrapCarousel>
        </div>
      </Resizer>
    );
  };

  Carousel.craft = {
    displayName: 'Carousel',
    props: {
      src1: 'https://images.unsplash.com/photo-1497366216548-375260
  70297c?w=800',
      src2: 'https://images.unsplash.com/photo-1519389950473-47ba02
  77781c?w=800',
      src3: 'https://images.unsplash.com/photo-1497366811353-687074
4d04b2?w=800',
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