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
