import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Resizer } from './Resizer';
import { CarouselSettings } from './CarouselSettings';
import { readSlides } from '../../utils/carouselSlides';

/*
 * This used to render react-bootstrap's <Carousel>, which the exported page
 * could not reuse — Bootstrap's carousel needs Bootstrap's JavaScript, and a
 * published page has no bundle. So exportToHtml grew a second carousel out of
 * scroll-snap, and the editor and the published site stopped agreeing about
 * arrows, dots, autoplay and swipe.
 *
 * There is one carousel now, and this is it: a scroll-snap strip, which is what
 * the export could already do. The scroll position is the only state. A swipe,
 * an arrow, a dot and an autoplay tick all call the same scrollBy, so they
 * cannot drift apart.
 */

const Region = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Track = styled.div`
  --per-view: ${(p) => p.$perView};
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  border-radius: 12px;
  &::-webkit-scrollbar {
    display: none;
  }
  /* the count lives in CSS on both sides; no breakpoint logic in JS */
  @container editor-canvas (max-width: 900px) {
    --per-view: ${(p) => p.$perViewTablet};
  }
  @container editor-canvas (max-width: 600px) {
    --per-view: ${(p) => p.$perViewMobile};
  }
`;

const Slide = styled.div`
  position: relative;
  flex: 0 0 calc(100% / var(--per-view));
  height: 100%;
  scroll-snap-align: start;
  overflow: hidden;
`;

const SlideImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/* Absolutely positioned, so a long caption can never make the strip taller. */
const Caption = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px 32px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  h3 {
    margin: 0 0 4px;
  }
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const Pill = styled.span`
  display: inline-block;
  padding: 2px 10px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  color: #fff;
`;

const Arrow = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => (p.$side === 'prev' ? 'left: 10px;' : 'right: 10px;')}
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.65);
  }
  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
`;

const Dots = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
`;

const Dot = styled.button`
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.45)')};
  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
`;

const Empty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 1px dashed var(--outline-light, #c4c5d9);
  border-radius: 12px;
  color: var(--muted, #8f99b2);
  font-size: 13px;
`;

export const Carousel = (props) => {
  const {
    title = 'Gallery',
    accent = { r: 13, g: 110, b: 253, a: 1 },
    autoplay = false,
    interval = 5000,
    loop = true,
    arrows = true,
    dots = true,
    perView = 1,
    perViewTablet,
    perViewMobile = 1,
  } = props;

  const slides = readSlides(props);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const accentCss =
    accent && typeof accent === 'object'
      ? `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${accent.a ?? 1})`
      : String(accent || '#0d6efd');

  const perViewNum = Math.max(1, Number(perView) || 1);
  const tablet = Math.max(1, Number(perViewTablet) || Math.min(perViewNum, 2));
  const mobile = Math.max(1, Number(perViewMobile) || 1);

  /** One slide's width, measured rather than assumed. */
  const step = () => {
    const track = trackRef.current;
    if (!track) return 0;
    return track.firstElementChild?.getBoundingClientRect().width || track.clientWidth;
  };

  const go = useCallback(
    (direction) => {
      const track = trackRef.current;
      if (!track) return;
      const width = step();
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      const atStart = track.scrollLeft <= 1;
      // Rewind rather than clone: cloning slides doubles the DOM and breaks the
      // "n of m" announcements. See design.md.
      if (direction > 0 && atEnd) {
        if (loop) track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (direction < 0 && atStart) {
        if (loop) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
        return;
      }
      track.scrollBy({ left: direction * width, behavior: 'smooth' });
    },
    [loop]
  );

  const goTo = (index) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * step(), behavior: 'smooth' });
  };

  /* The dots follow the scroll position; nothing counts slides separately. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const onScroll = () => {
      const width = step();
      if (width > 0) setActive(Math.round(track.scrollLeft / width));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!autoplay || paused || slides.length < 2) return undefined;
    // Someone who asked the system for less motion did not ask this carousel
    // for an exception.
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const ms = Math.max(1000, Number(interval) || 5000);
    const timer = setInterval(() => go(1), ms);
    return () => clearInterval(timer);
  }, [autoplay, paused, interval, go, slides.length]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{ display: 'block', overflow: 'hidden' }}
    >
      {slides.length === 0 ? (
        <Empty>No slides yet — add one in the settings panel</Empty>
      ) : (
        <Region
          role="region"
          aria-roledescription="carousel"
          aria-label={title}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <Track
            ref={trackRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            $perView={perViewNum}
            $perViewTablet={tablet}
            $perViewMobile={mobile}
            aria-live={autoplay && !paused ? 'off' : 'polite'}
          >
            {slides.map((slide, i) => (
              <Slide
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
              >
                {slide.src && (
                  <SlideImage src={slide.src} alt={slide.alt} loading="lazy" decoding="async" />
                )}
                {(slide.label || slide.heading || slide.text) && (
                  <Caption>
                    {slide.label && <Pill style={{ background: accentCss }}>{slide.label}</Pill>}
                    {slide.heading && <h3>{slide.heading}</h3>}
                    {slide.text && <p>{slide.text}</p>}
                  </Caption>
                )}
              </Slide>
            ))}
          </Track>

          {arrows && slides.length > 1 && (
            <>
              <Arrow type="button" $side="prev" aria-label="Previous slide" onClick={() => go(-1)}>
                ‹
              </Arrow>
              <Arrow type="button" $side="next" aria-label="Next slide" onClick={() => go(1)}>
                ›
              </Arrow>
            </>
          )}

          {dots && slides.length > 1 && (
            <Dots>
              {slides.map((_, i) => (
                <Dot
                  key={i}
                  type="button"
                  $active={i === active}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === active ? 'true' : undefined}
                  onClick={() => goTo(i)}
                />
              ))}
            </Dots>
          )}
        </Region>
      )}
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
        alt: '',
      },
      {
        src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
        heading: 'Second Slide',
        label: 'New',
        text: 'Description for second slide',
        alt: '',
      },
      {
        src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        heading: 'Third Slide',
        label: 'Hot',
        text: 'Description for third slide',
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
