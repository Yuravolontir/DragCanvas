import { useNode } from '@craftjs/core';
import cx from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { Text } from './Text';
import { ButtonSettings } from './ButtonSettings';

const StyledButton = styled.button`
  background: ${(props) =>
    props.$buttonStyle === 'full'
      ? `rgba(${Object.values(props.$background)})`
      : 'transparent'};
  border: 2px solid transparent;
  border-color: ${(props) =>
    props.$buttonStyle === 'outline'
      ? `rgba(${Object.values(props.$background)})`
      : 'transparent'};
  margin: ${({ $margin }) =>
    `${$margin[0]}px ${$margin[1]}px ${$margin[2]}px ${$margin[3]}px`};
`;

export const Button = ({ text, textComponent, color, buttonStyle, background, margin }) => {
  // Default values
  background = background || { r: 255, g: 255, b: 255, a: 0.5 };
  color = color || { r: 92, g: 90, b: 90, a: 1 };
  buttonStyle = buttonStyle || 'full';
  text = text || 'Button';
  margin = margin || ['5', '0', '5', '0'];
  textComponent = textComponent || {
    ...Text.craft.props,
    textAlign: 'center',
  };

  const {
    connectors: { connect },
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <StyledButton
      ref={(dom) => {
        connect(dom);
      }}
      className={cx([
        'rounded w-full px-4 py-2',
        {
          'shadow-lg': buttonStyle === 'full',
        },
      ])}
      $buttonStyle={buttonStyle}
      $background={background}
      $margin={margin}
    >
      <Text {...textComponent} text={text} color={color} />
    </StyledButton>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    background: { r: 255, g: 255, b: 255, a: 0.5 },
    color: { r: 92, g: 90, b: 90, a: 1 },
    buttonStyle: 'full',
    text: 'Button',
    margin: ['5', '0', '5', '0'],
    textComponent: {
      ...Text.craft.props,
      textAlign: 'center',
    },
  },
  related: {
    toolbar: ButtonSettings,
  },
};
