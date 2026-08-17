
  import React from 'react';
  import { Resizer } from './Resizer';
  import { CarouselSettings } from './CarouselSettings';
  import BootstrapCarousel from 'react-bootstrap/Carousel';

  export const Carousel = (props) => {

    const {
      src1 = 'https://via.placeholder.com/800x400?text=Slide+1',
      src2 = 'https://via.placeholder.com/800x400?text=Slide+2',
      src3 = 'https://via.placeholder.com/800x400?text=Slide+3',
      heading1 = 'Slide 1',
      heading2 = 'Slide 2',
      heading3 = 'Slide 3',
      // The slide labels used to be Bootstrap's `bg-primary`, so a carousel
      // dropped into a warm or dark page arrived with a blue pill in it that no
      // amount of editing could reach. It is a prop now.
      accent = { r: 13, g: 110, b: 253, a: 1 },
      label1 = '',
      label2 = '',
      label3 = '',
      p1 = 'Description',
      p2 = 'Description',
      p3 = 'Description'
    } = props;

    const accentCss = accent && typeof accent === 'object'
      ? `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${accent.a ?? 1})`
      : String(accent || '#0d6efd');

    return (
      <Resizer
        propKey={{ width: 'width', height: 'height' }}
        style={{
          width: 'fit-content',
          display: 'block',
          overflow: 'hidden',
        }}
      >
        <BootstrapCarousel style={{ width: '100%' }}>
          <BootstrapCarousel.Item>
            <div
              style={{
                height: "400px",
                width: '100%',
                backgroundImage: `url(${src1})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            />
            <BootstrapCarousel.Caption>
              {label1 && <span className="badge me-2" style={{ background: accentCss, color: '#fff' }}>{label1}</span>}
              <h3>{heading1}</h3>
              <p>{p1}</p>
            </BootstrapCarousel.Caption>
          </BootstrapCarousel.Item>
          <BootstrapCarousel.Item>
            <div
              style={{
                height: "400px",
                width: '100%',
                backgroundImage: `url(${src2})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            />
            <BootstrapCarousel.Caption>
              {label2 && <span className="badge me-2" style={{ background: accentCss, color: '#fff' }}>{label2}</span>}
              <h3>{heading2}</h3>
              <p>{p2}</p>
            </BootstrapCarousel.Caption>
          </BootstrapCarousel.Item>
          <BootstrapCarousel.Item>
            <div
              style={{
                height: "400px",
                width: '100%',
                backgroundImage: `url(${src3})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            />
            <BootstrapCarousel.Caption>
              {label3 && <span className="badge me-2" style={{ background: accentCss, color: '#fff' }}>{label3}</span>}
              <h3>{heading3}</h3>
              <p>{p3}</p>
            </BootstrapCarousel.Caption>
          </BootstrapCarousel.Item>
        </BootstrapCarousel>
      </Resizer>
    );
  };

  Carousel.craft = {
    displayName: 'Carousel',
    props: {
      accent: { r: 13, g: 110, b: 253, a: 1 },
      width: '600px',
      height: '400px',
      src1: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      src2: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      src3: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
      heading1: 'First Slide',
      heading2: 'Second Slide',
      heading3: 'Third Slide',
      label1: 'Featured',
      label2: 'New',
      label3: 'Hot',
      p1: 'Description for first slide',
      p2: 'Description for second slide',
      p3: 'Description for third slide'
    },
    related: {
      toolbar: CarouselSettings,
    },
  };