import React from 'react';
import { useNode } from '@craftjs/core';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList, RowPanel, RowToggle } from './Toolbar/ToolbarRows';
import {
  emptySlide,
  readSlides,
  slideInterval,
  slidesAutoplay,
  slidesPerView,
} from '../../utils/carouselSlides';

/**
 * Slide editor for the Carousel.
 *
 * The generic ToolbarItem only handles flat props, and slides are a list of
 * objects, so this panel is written by hand out of the shared row controls.
 *
 * A node saved before slides became an array still carries src1..p3. It is
 * displayed through readSlides, and the first edit here writes a real array,
 * after which the node is not legacy any more.
 *
 * Two things that used to be here are gone. The desktop/tablet/phone boxes:
 * three numbers for one idea, asking an author to design three layouts when the
 * published page already narrows sensibly on its own — one number is set here
 * and the narrower screens follow it. And "Every (ms)": a unit nobody outside
 * software thinks in, replaced by seconds.
 */
export const CarouselSettings = () => {
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props }));

  const slides = readSlides(props);
  const autoplay = slidesAutoplay(props);
  const perView = slidesPerView(props);
  const seconds = Math.round(slideInterval(props) / 1000);

  /** Any write materialises the array, converting a legacy node in passing. */
  const writeSlides = (next) =>
    setProp((draft) => {
      draft.slides = next;
    });

  const updateSlide = (index, key, value) =>
    writeSlides(slides.map((slide, i) => (i === index ? { ...slide, [key]: value } : slide)));

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    writeSlides(next);
  };

  const set = (key, value) =>
    setProp((draft) => {
      draft[key] = value;
    });

  /**
   * How many are shown at once, with the narrower screens kept in step.
   *
   * The two follower values still exist because published pages and saved
   * projects carry them, and because a strip of six logos has to become two on
   * a phone. They are no longer somebody's problem to set.
   */
  const setPerView = (value) => {
    const desktop = Math.min(8, Math.max(1, Math.round(Number(value)) || 1));
    setProp((draft) => {
      draft.perView = desktop;
      draft.perViewTablet = Math.min(desktop, 2);
      draft.perViewMobile = 1;
    });
  };

  return (
    <React.Fragment>
      <ToolbarHelp title="Slides" icon="view_carousel">
        A strip of pictures a visitor can swipe or step through. Give each slide
        a picture and, if it needs one, a heading and a line of text over it.
        The strip keeps the size you give it here and narrows to fit a phone
        once the site is published.
      </ToolbarHelp>

      <ToolbarSection title="Slides">
        <RowList empty="No slides yet." addLabel="Add slide" onAdd={() => writeSlides([...slides, emptySlide()])}>
          {slides.map((slide, index) => (
            <RowCard
              key={index}
              title={slide.heading || `Slide ${index + 1}`}
              index={index}
              count={slides.length}
              onMove={move}
              onRemove={(i) => writeSlides(slides.filter((_, at) => at !== i))}
              removeLabel="Remove this slide"
            >
              <RowField
                label="Picture address"
                placeholder="https://example.com/photo.jpg"
                value={slide.src}
                onChange={(e) => updateSlide(index, 'src', e.target.value)}
              />
              <RowField
                label="Heading (optional)"
                placeholder="Summer collection"
                value={slide.heading}
                onChange={(e) => updateSlide(index, 'heading', e.target.value)}
              />
              <RowField
                label="Text under the heading (optional)"
                placeholder="Out now, in every shop."
                value={slide.text}
                onChange={(e) => updateSlide(index, 'text', e.target.value)}
              />
              <RowField
                label="Small badge (optional)"
                placeholder="New"
                hint="A short word in a coloured pill above the heading."
                value={slide.label}
                onChange={(e) => updateSlide(index, 'label', e.target.value)}
              />
              <RowField
                label="Link (optional)"
                placeholder="https://example.com/summer"
                hint="Where clicking the slide takes a visitor."
                value={slide.href}
                onChange={(e) => updateSlide(index, 'href', e.target.value)}
              />
              <RowField
                label="Describe the picture (optional)"
                placeholder="A rail of linen shirts"
                hint="Read aloud to visitors who cannot see it. The heading is used when this is empty."
                value={slide.alt}
                onChange={(e) => updateSlide(index, 'alt', e.target.value)}
              />
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="How it behaves">
        <RowPanel>
          <RowField
            label="Slides visible at once"
            kind="number"
            min={1}
            max={8}
            value={perView.desktop}
            hint="One for photographs. Three or more suits logos and small cards. Fewer are shown on a narrow screen automatically."
            onChange={(e) => setPerView(e.target.value)}
          />

          <RowToggle
            label="Move to the next slide on its own"
            checked={autoplay}
            onChange={(e) => set('autoplay', e.target.checked)}
          />
          {autoplay ? (
            <RowField
              label="Seconds on each slide"
              kind="number"
              min={1}
              max={60}
              value={seconds}
              hint="Pauses while the pointer is over the carousel, and never runs for visitors who have asked their device for less motion."
              onChange={(e) => {
                const value = Math.min(60, Math.max(1, Math.round(Number(e.target.value)) || 5));
                set('interval', value * 1000);
              }}
            />
          ) : null}

          <RowToggle
            label="Return to the first slide after the last"
            checked={props.loop !== false}
            onChange={(e) => set('loop', e.target.checked)}
          />
          <RowToggle
            label="Show the arrows"
            checked={props.arrows !== false}
            onChange={(e) => set('arrows', e.target.checked)}
          />
          <RowToggle
            label="Show the dots"
            checked={props.dots !== false}
            onChange={(e) => set('dots', e.target.checked)}
          />
        </RowPanel>
      </ToolbarSection>

      <ToolbarSection
        title="Appearance"
        props={['accent']}
        summary={({ accent }) => (
          <div
            className="fw-bold"
            style={{
              color: accent && `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${accent.a ?? 1})`,
            }}
          >
            Badge colour
          </div>
        )}
      >
        <ToolbarItem full={true} propKey="accent" type="color" label="Badge colour" />
      </ToolbarSection>

      <ToolbarSection title="Name">
        {/* A region with no name is a region a screen-reader user cannot find. */}
        <ToolbarItem full={true} propKey="title" type="text" label="What this carousel shows" placeholder="Our work" />
      </ToolbarSection>
    </React.Fragment>
  );
};
