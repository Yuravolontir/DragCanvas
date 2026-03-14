import { Element, useEditor } from '@craftjs/core';
import { Tooltip } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { ButtonToolbox, ContainerToolbox, TextToolbox, VideoToolbox , LinkToolbox,ImageToolbox} from '../Icons';
import { Button } from './Button';
import { Container } from './Container';
import { Text } from './Text';
import { Video } from './Video';
import {Link} from './Link';
import {Image} from './Image';

const ToolboxDiv = styled.div`
  transition: 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  ${(props) => (!props.$enabled ? `width: 0;` : '')}
  ${(props) => (!props.$enabled ? `opacity: 0;` : '')}
`;

const Item = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  svg {
    width: 28px;
    height: 28px;
    fill: #707070;
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
      className="toolbox transition w-12 h-full flex flex-col bg-white"
    >
      <div className="flex flex-1 flex-col items-center pt-3 gap-3">
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
              <ContainerToolbox viewBox="-3 -3 24 24" />
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
              <TextToolbox viewBox="-3 -3 28 28" />
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
              <ButtonToolbox viewBox="-4 -3 24 24" />
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
              <VideoToolbox viewBox="-3 -3 28 28" />
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
              <LinkToolbox viewBox="-3 -3 28 28" />
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
              <ImageToolbox viewBox="-3 -3 28 28" />
            </Item>
          </Tooltip>
        </div>
      </div>
    </ToolboxDiv>
  );
};
