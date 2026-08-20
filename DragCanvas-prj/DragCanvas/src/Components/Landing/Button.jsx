import { useEditor, useNode } from '@craftjs/core';
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

const actionHref = (action, value) => {
  const clean = String(value || '').trim();
  if (!clean || action === 'none') return undefined;
  if (action === 'section') return `#${clean.replace(/^#/, '')}`;
  if (action === 'email') return `mailto:${clean.replace(/^mailto:/, '')}`;
  if (action === 'phone') return `tel:${clean.replace(/^tel:/, '')}`;
  if (/^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(clean)) return clean;
  return `https://${clean}`;
};

export const Button = ({ text, textComponent, color, buttonStyle, background, margin, action, actionValue, newTab }) => {
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
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const href = actionHref(action, actionValue);

  return (
    <StyledButton
      as={href ? 'a' : 'button'}
      type={href ? undefined : 'button'}
      href={href}
      target={href && newTab ? '_blank' : undefined}
      rel={href && newTab ? 'noopener noreferrer' : undefined}
      ref={(dom) => {
        connect(dom);
      }}
      /**
       * No `w-full` here.
       *
       * It made every button span its container, so a generated page showed a
       * call to action as a bar across the whole screen. The published page never
       * looked like that: exportToHtml writes `display: inline-block` with no
       * width, so the button sizes to its label there.
       *
       * The two disagreed, and the editor was the one that was wrong. Removing
       * this changes no published site - it only stops the canvas misrepresenting
       * what the visitor will get. Anyone who wants a full-width button can still
       * set the width prop.
       */
      className={cx([
        'rounded px-4 py-2',
        {
          'shadow-lg': buttonStyle === 'full',
        },
      ])}
      $buttonStyle={buttonStyle}
      $background={background}
      $margin={margin}
      style={{ pointerEvents: enabled ? 'none' : 'auto', textDecoration: 'none' }}
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
    action: 'none',
    actionValue: '',
    newTab: false,
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
