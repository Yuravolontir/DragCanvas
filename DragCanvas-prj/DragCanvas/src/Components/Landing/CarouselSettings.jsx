import React from 'react';
import { useNode } from '@craftjs/core';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { readSlides, emptySlide } from '../../utils/carouselSlides';

/**
 * Slide editor for the Carousel.
 *
 * The generic ToolbarItem only handles flat props, and slides are a list of
 * objects, so this section is written by hand — the same shape FormSettings
 * uses for its fields.
 *
 * A node saved before slides became an array still carries src1..p3. It is
 * displayed through readSlides, and the first edit here writes a real array,
 * after which the node is not legacy any more.
 */
export const CarouselSettings = () => {
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props }));

  const slides = readSlides(props);

  /** Any write materialises the array, converting a legacy node in passing. */
  const writeSlides = (next) => {
    setProp((p) => {
      p.slides = next;
    });
  };

  const updateSlide = (index, key, value) =>
    writeSlides(slides.map((s, i) => (i === index ? { ...s, [key]: value } : s)));

  const addSlide = () => writeSlides([...slides, emptySlide()]);

  const removeSlide = (index) => writeSlides(slides.filter((_, i) => i !== index));

  const moveSlide = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    writeSlides(next);
  };

  const smallInput = {
    width: '100%',
    padding: '5px 8px',
    fontSize: 12,
    border: '1px solid var(--outline-light)',
    borderRadius: 6,
    marginBottom: 5,
    boxSizing: 'border-box',
  };

  const iconButton = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--muted)',
    padding: '0 4px',
  };

  const checkboxRow = {
    fontSize: 11,
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  };

  const toggle = (key, label, fallback) => (
    <label style={checkboxRow}>
      <input
        type="checkbox"
        checked={props[key] === undefined ? fallback : !!props[key]}
        onChange={(e) => {
          const { checked } = e.target;
          setProp((p) => {
            p[key] = checked;
          });
        }}
      />
      {label}
    </label>
  );

  const number = (key, label, fallback, min, max) => (
    <label style={{ ...checkboxRow, justifyContent: 'space-between' }}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        style={{ ...smallInput, marginBottom: 0, width: 70 }}
        value={props[key] ?? fallback}
        onChange={(e) => {
          const value = Number(e.target.value);
          setProp((p) => {
            p[key] = value;
          });
        }}
      />
    </label>
  );

  return (
    <React.Fragment>
      <ToolbarSection title="Slides">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          {slides.map((slide, index) => (
            <div
              key={index}
              style={{
                border: '1px solid var(--surface-container)',
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#a09aa8', flex: 1 }}>
                  Slide {index + 1} of {slides.length}
                </span>
                <button style={iconButton} onClick={() => moveSlide(index, -1)} title="Move up">
                  ↑
                </button>
                <button style={iconButton} onClick={() => moveSlide(index, 1)} title="Move down">
                  ↓
                </button>
                <button
                  style={{ ...iconButton, color: '#c00' }}
                  onClick={() => removeSlide(index)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>

              <input
                style={smallInput}
                value={slide.src}
                placeholder="Image URL"
                onChange={(e) => updateSlide(index, 'src', e.target.value)}
              />
              <input
                style={smallInput}
                value={slide.alt}
                placeholder="Alt text (describes the picture)"
                onChange={(e) => updateSlide(index, 'alt', e.target.value)}
              />
              <input
                style={smallInput}
                value={slide.heading}
                placeholder="Heading"
                onChange={(e) => updateSlide(index, 'heading', e.target.value)}
              />
              <input
                style={smallInput}
                value={slide.label}
                placeholder="Label"
                onChange={(e) => updateSlide(index, 'label', e.target.value)}
              />
              <input
                style={{ ...smallInput, marginBottom: 0 }}
                value={slide.text}
                placeholder="Description"
                onChange={(e) => updateSlide(index, 'text', e.target.value)}
              />
            </div>
          ))}

          <button
            onClick={addSlide}
            style={{
              width: '100%',
              padding: '7px',
              fontSize: 12,
              borderRadius: 8,
              border: '1px dashed var(--outline-variant)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--haze)',
            }}
          >
            + Add slide
          </button>
        </div>
      </ToolbarSection>

      <ToolbarSection title="Behaviour">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          {toggle('autoplay', 'Play by itself', false)}
          {props.autoplay ? number('interval', 'Every (ms)', 5000, 1000, 30000) : null}
          {toggle('loop', 'Back to the start at the end', true)}
          {toggle('arrows', 'Arrows', true)}
          {toggle('dots', 'Dots', true)}
        </div>
      </ToolbarSection>

      <ToolbarSection title="How many at once">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          {number('perView', 'Desktop', 1, 1, 8)}
          {number('perViewTablet', 'Tablet', 1, 1, 6)}
          {number('perViewMobile', 'Phone', 1, 1, 4)}
        </div>
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
            Label colour
          </div>
        )}
      >
        <ToolbarItem full={true} propKey="accent" type="color" label="Slide label" />
      </ToolbarSection>

      <ToolbarSection title="Name">
        {/* A region with no name is a region a screen-reader user cannot find. */}
        <ToolbarItem full={true} propKey="title" type="text" label="What this carousel is" />
      </ToolbarSection>
    </React.Fragment>
  );
};
