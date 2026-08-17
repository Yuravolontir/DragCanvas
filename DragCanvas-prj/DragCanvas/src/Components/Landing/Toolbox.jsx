import { Element, useEditor } from '@craftjs/core';
import { Tooltip } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { Container } from './Container';
import { Text } from './Text';
import { Video } from './Video';
import { Link } from './Link';
import { Image } from './Image';
import { Carousel } from './Carousel';
import { Map } from './Map';
import { NavbarElement } from './NavbarElement';
import { Heading } from './Heading';
import { Columns } from './Columns';
import { Spacer } from './Spacer';
import { Divider } from './Divider';
import { List } from './List';
import { Quote } from './Quote';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { Accordion } from './Accordion';
import { Pricing } from './Pricing';
import { Testimonial } from './Testimonial';
import { Stats } from './Stats';
import { TeamGrid } from './TeamGrid';
import { Timeline } from './Timeline';
import { CTABanner } from './CTABanner';
import { LogoStrip } from './LogoStrip';
import { SocialLinks } from './SocialLinks';
import { Form } from './Form';

const ToolboxDiv = styled.div`
  transition: 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  ${(props) => (!props.$enabled ? `width: 0;` : '')}
  ${(props) => (!props.$enabled ? `opacity: 0;` : '')}
  background: var(--surface-container-low, var(--surface-dim));
  border-right: 1px solid var(--outline-light, var(--outline-light));
  box-shadow: 2px 0 14px color-mix(in oklab, var(--paper) 6%, transparent);
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 78px;
  min-height: 58px;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 8px 6px;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 24px;
    color: var(--muted, var(--muted));
    transition: color 0.15s ease;
  }
  .icon-label {
    font-size: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    color: var(--muted, var(--muted));
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  &:hover {
    background: var(--primary-light, var(--primary-light));
    border-color: var(--primary-container, #dde1ff);
    transform: translateY(-1px);
    .material-symbols-outlined {
      color: var(--primary, var(--primary));
    }
    .icon-label {
      color: var(--primary, var(--primary));
    }
  }
  ${(props) =>
    props.$move &&
    `
    cursor: move;
  `}
`;

const PanelTitle = styled.div`
  width: 100%;
  padding: 16px 12px 10px;
  font: 700 11px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--on-surface-variant);
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const Toolbox = () => {
  const {
    enabled,
    connectors: { create },
  } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <ToolboxDiv
      $enabled={enabled && enabled}
      className="toolbox transition h-full flex flex-col"
      style={{ width: enabled ? '104px' : 0 }}
    >
      <PanelTitle>Elements</PanelTitle>
      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto pb-4">
        <div
          ref={(ref) => {
            create(
              ref,
              <Element
                canvas
                is={Container}
                background={{ r: 78, g: 78, b: 78, a: 1 }}
                color={{ r: 0, g: 0, b: 0, a: 1 }}
                height="300px"
                width="300px"
              ></Element>
            );
          }}
        >
          <Tooltip title="Drag a layout container onto the page" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">dashboard</span>
              <span className="icon-label">Container</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Text fontSize="12" textAlign="left" text="Hi there" />);
          }}
        >
          <Tooltip title="Drag text onto the page" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">title</span>
              <span className="icon-label">Text</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Button />);
          }}
        >
          <Tooltip title="Drag a call-to-action button" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">smart_button</span>
              <span className="icon-label">Button</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Video />);
          }}
        >
          <Tooltip title="Video" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">play_circle</span>
              <span className="icon-label">Video</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Link />);
          }}
        >
          <Tooltip title="Link" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">link</span>
              <span className="icon-label">Link</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Heading />);
          }}
        >
          <Tooltip title="A title, with a real heading level" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">title</span>
              <span className="icon-label">Heading</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            // canvas, so things can be dropped into it
            create(ref, <Element canvas is={Columns} />);
          }}
        >
          <Tooltip title="Columns that stack on a phone" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">view_column</span>
              <span className="icon-label">Columns</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Spacer />);
          }}
        >
          <Tooltip title="Empty space" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">height</span>
              <span className="icon-label">Spacer</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Divider />);
          }}
        >
          <Tooltip title="A rule between sections" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">horizontal_rule</span>
              <span className="icon-label">Divider</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <List />);
          }}
        >
          <Tooltip title="A bulleted or numbered list" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">format_list_bulleted</span>
              <span className="icon-label">List</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Quote />);
          }}
        >
          <Tooltip title="A pull quote" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">format_quote</span>
              <span className="icon-label">Quote</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Icon />);
          }}
        >
          <Tooltip title="One Material symbol" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">star</span>
              <span className="icon-label">Icon</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Badge />);
          }}
        >
          <Tooltip title="A small pill of text" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">label</span>
              <span className="icon-label">Badge</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Accordion />);
          }}
        >
          <Tooltip title="Questions that open and close" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">expand_circle_down</span>
              <span className="icon-label">Accordion</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Pricing />);
          }}
        >
          <Tooltip title="Tiers, in columns that line up" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">payments</span>
              <span className="icon-label">Pricing</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Testimonial />);
          }}
        >
          <Tooltip title="Somebody vouching for you" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">format_quote</span>
              <span className="icon-label">Testimonial</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Stats />);
          }}
        >
          <Tooltip title="A row of numbers" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">bar_chart</span>
              <span className="icon-label">Stats</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <TeamGrid />);
          }}
        >
          <Tooltip title="The people behind it" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">groups</span>
              <span className="icon-label">TeamGrid</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Timeline />);
          }}
        >
          <Tooltip title="Steps, in order" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">timeline</span>
              <span className="icon-label">Timeline</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <CTABanner />);
          }}
        >
          <Tooltip title="The ask, on a band of its own" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">campaign</span>
              <span className="icon-label">CTABanner</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <LogoStrip />);
          }}
        >
          <Tooltip title="A row of logos" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">view_carousel</span>
              <span className="icon-label">LogoStrip</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <SocialLinks />);
          }}
        >
          <Tooltip title="Where else to find you" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">share</span>
              <span className="icon-label">SocialLinks</span>
            </Item>
          </Tooltip>
        </div>

        <div
          ref={(ref) => {
            create(ref, <Form />);
          }}
        >
          <Tooltip title="Drag a contact form" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">dynamic_form</span>
              <span className="icon-label">Form</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Image />);
          }}
        >
          <Tooltip title="Image" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">image</span>
              <span className="icon-label">Image</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Carousel />);
          }}
        >
          <Tooltip title="Carousel" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">view_carousel</span>
              <span className="icon-label">Carousel</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Map />);
          }}
        >
          <Tooltip title="Map" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">map</span>
              <span className="icon-label">Map</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <NavbarElement />);
          }}
        >
          <Tooltip title="Drag a navigation bar" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">web_asset</span>
              <span className="icon-label">Navigation</span>
            </Item>
          </Tooltip>
        </div>
      </div>
    </ToolboxDiv>
  );
};
