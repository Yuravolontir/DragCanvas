import { useState } from 'react';
import { useEditor } from '@craftjs/core';

import { Resizer } from './Resizer';
import { CarouselSettings } from './CarouselSettings';
import { useCarouselStrip } from './useCarouselStrip.js';
import {
  Arrow,
  Caption,
  Dot,
  Dots,
  Empty,
  Pill,
  Region,
  Slide,
  SlideImage,
  SlideLink,
  Track,
} from './Carousel.styles.js';
import { readSlides, slideInterval, slidesAutoplay, slidesPerView } from '../../utils/carouselSlides';
import { opensNewTab, safeHref } from '../../utils/elementRows.js';
import { readableInkCss } from '../../utils/readableInk.js';

/*
 * This used to render react-bootstrap's <Carousel>, which the exported page
 * could not reuse — Bootstrap's carousel needs Bootstrap's JavaScript, and a
 * published page has no bundle. So exportToHtml grew a second carousel out of
 * scroll-snap, and the editor and the published site stopped agreeing about
 * arrows, dots, autoplay and swipe.
 *
 * There is one carousel now, and this is it: a scroll-snap strip, which is what
 * the export could already do. The scroll position is the only state, and
 * useCarouselStrip is where it is moved from.
 */

const DEFAULT_ACCENT = { r: 13, g: 110, b: 253, a: 1 };

/** The accent as CSS, whether it was saved as an object or as a plain string. */
function accentToCss(accent) {
  if (accent && typeof accent === 'object') {
    return `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${accent.a ?? 1})`;
  }
  return String(accent || '#0d6efd');
}

/**
 * Ink for the little label printed on the accent colour.
 *
 * It used to be white whatever the accent was, which is the exact fault
 * readableInk was written for and this element was missed in that sweep:
 * measured across the palettes the generator draws from, white on the accent
 * never reaches the 4.5:1 a 12px label needs - 2.21:1 on the lime, 3.39:1 on
 * the ocean blue. The label follows the fill instead.
 */
function labelInkFor(accent) {
  return accent && typeof accent === 'object' ? readableInkCss(accent) : '#fff';
}

/** The picture and the caption of one slide, without the slide's own box. */
function SlideBody({ slide, accentCss, labelInk }) {
  const hasCaption = slide.label || slide.heading || slide.text;

  return (
    <>
      {slide.src && (
        <SlideImage src={slide.src} alt={slide.alt} loading="lazy" decoding="async" />
      )}

      {hasCaption && (
        <Caption>
          {slide.label && (
            <Pill style={{ background: accentCss, color: labelInk }}>{slide.label}</Pill>
          )}
          {slide.heading && <h3>{slide.heading}</h3>}
          {slide.text && <p>{slide.text}</p>}
        </Caption>
      )}
    </>
  );
}

/**
 * One slide of the strip.
 *
 * @param {boolean} linksAreLive  false on the canvas, so clicking a slide
 *                                selects it instead of leaving the project
 */
function CarouselSlide({ slide, position, total, accentCss, labelInk, linksAreLive }) {
  const href = linksAreLive ? safeHref(slide.href) : '';
  const body = <SlideBody slide={slide} accentCss={accentCss} labelInk={labelInk} />;

  return (
    <Slide role="group" aria-roledescription="slide" aria-label={`${position} of ${total}`}>
      {href ? (
        <SlideLink
          href={href}
          target={opensNewTab(href) ? '_blank' : undefined}
          rel={opensNewTab(href) ? 'noopener noreferrer' : undefined}
        >
          {body}
        </SlideLink>
      ) : body}
    </Slide>
  );
}

export const Carousel = (props) => {
  const {
    title = 'Gallery',
    accent = DEFAULT_ACCENT,
    loop = true,
    arrows = true,
    dots = true,
  } = props;

  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const slides = readSlides(props);
  const [hovered, setHovered] = useState(false);

  /*
   * Read through the shared helpers rather than off the props.
   *
   * "Play by itself" appeared not to work, and the reason was here: the switch
   * writes a boolean, but saved projects and generated pages had the string
   * "false" in this prop, which is truthy. The same reading is used by the
   * exporter, so the canvas and the published page agree about whether the
   * carousel moves.
   */
  const autoplay = slidesAutoplay(props);
  const interval = slideInterval(props);
  const perView = slidesPerView(props);

  /*
   * Autoplay pauses under the pointer and nowhere else.
   *
   * It used to pause on focus too, which is right on a published page and wrong
   * on the canvas: selecting the element puts focus inside it and leaves it
   * there, so the carousel stayed paused for as long as it was selected -
   * exactly while somebody was switching autoplay on and watching for it to do
   * something. Hover is enough: a visitor reading a slide has the pointer on
   * it, and a keyboard user pressing the arrows overrides the tick anyway.
   */
  const { trackRef, active, go, goTo } = useCarouselStrip({
    slideCount: slides.length,
    loop,
    autoplay,
    interval,
    paused: hovered,
  });

  const accentCss = accentToCss(accent);
  const labelInk = labelInkFor(accent);
  const hasSeveralSlides = slides.length > 1;

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    }
  };

  const resizer = { width: 'width', height: 'height' };

  if (slides.length === 0) {
    return (
      <Resizer propKey={resizer} style={{ display: 'block', overflow: 'hidden' }}>
        <Empty>No slides yet — add one in the settings panel</Empty>
      </Resizer>
    );
  }

  return (
    <Resizer propKey={resizer} style={{ display: 'block', overflow: 'hidden' }}>
      <Region
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Track
          ref={trackRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          $perView={perView.desktop}
          $perViewTablet={perView.tablet}
          $perViewMobile={perView.mobile}
          aria-live={autoplay && !hovered ? 'off' : 'polite'}
        >
          {slides.map((slide, index) => (
            <CarouselSlide
              key={index}
              slide={slide}
              position={index + 1}
              total={slides.length}
              accentCss={accentCss}
              labelInk={labelInk}
              linksAreLive={!enabled}
            />
          ))}
        </Track>

        {arrows && hasSeveralSlides && (
          <>
            <Arrow type="button" $side="prev" aria-label="Previous slide" onClick={() => go(-1)}>
              ‹
            </Arrow>
            <Arrow type="button" $side="next" aria-label="Next slide" onClick={() => go(1)}>
              ›
            </Arrow>
          </>
        )}

        {dots && hasSeveralSlides && (
          <Dots>
            {slides.map((_slide, index) => (
              <Dot
                key={index}
                type="button"
                $active={index === active}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === active ? 'true' : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </Dots>
        )}
      </Region>
    </Resizer>
  );
};

Carousel.craft = {
  displayName: 'Carousel',
  props: {
    // The legacy src1..p3 are deliberately absent: check-ai-catalogue.mjs makes
    // the AI prompt document every prop listed here, and the flat shape is being
    // retired. Old nodes keep their own props in saved data, where readSlides
    // still finds them.
    slides: [
      {
        src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        heading: 'First Slide',
        label: 'Featured',
        text: 'Description for first slide',
        href: '',
        alt: '',
      },
      {
        src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
        heading: 'Second Slide',
        label: 'New',
        text: 'Description for second slide',
        href: '',
        alt: '',
      },
      {
        src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        heading: 'Third Slide',
        label: 'Hot',
        text: 'Description for third slide',
        href: '',
        alt: '',
      },
    ],
    title: 'Gallery',
    accent: { r: 13, g: 110, b: 253, a: 1 },
    autoplay: false,
    interval: 5000,
    loop: true,
    arrows: true,
    dots: true,
    perView: 1,
    perViewTablet: 1,
    perViewMobile: 1,
    width: '600px',
    height: '400px',
  },
  related: {
    toolbar: CarouselSettings,
  },
};
