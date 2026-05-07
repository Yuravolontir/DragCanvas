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

const ToolboxDiv = styled.div`
  transition: 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  ${(props) => (!props.$enabled ? `width: 0;` : '')}
  ${(props) => (!props.$enabled ? `opacity: 0;` : '')}
  background: #f7f4ec;
  border-right: 1px solid #e8e0eb;
`;

const Item = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 10px;
  padding: 8px;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 22px;
    color: #79747e;
    transition: color 0.15s ease;
  }
  .icon-label {
    font-size: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    color: #9994a0;
    margin-top: 2px;
    letter-spacing: 0.02em;
  }
  &:hover {
    background: #e3f2fd;
    .material-symbols-outlined {
      color: #0060ac;
    }
    .icon-label {
      color: #0060ac;
    }
  }
  ${(props) =>
    props.$move &&
    `
    cursor: move;
  `}
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
      className="toolbox transition w-14 h-full flex flex-col"
    >
      <div className="flex flex-1 flex-col items-center pt-4 gap-2">
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
          <Tooltip title="Container" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">crop_square</span>
              <span className="icon-label">Box</span>
            </Item>
          </Tooltip>
        </div>
        <div
          ref={(ref) => {
            create(ref, <Text fontSize="12" textAlign="left" text="Hi there" />);
          }}
        >
          <Tooltip title="Text" placement="right">
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
          <Tooltip title="Button" placement="right">
            <Item $move>
              <span className="material-symbols-outlined">radio_button_unchecked</span>
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
              <span className="icon-label">Slide</span>
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
      </div>
    </ToolboxDiv>
  );
};
