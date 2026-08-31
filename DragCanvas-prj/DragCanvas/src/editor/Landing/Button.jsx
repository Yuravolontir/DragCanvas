import { useEditor, useNode } from '@craftjs/core';
import cx from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { Text } from './Text';
import { ButtonSettings } from './ButtonSettings';
import { normalizePaymentUrl } from '../../utils/elementData.js';

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
  if (action === 'page') return `/${clean.replace(/^\/+|\/+$/g, '')}/`;
  // A checkout page from any provider. Same reading as the published page, and
  // the same refusal of anything that is not an ordinary web address.
  if (action === 'payment') return normalizePaymentUrl(clean) || undefined;
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
  /*
   * A real link only outside the editor.
   *
   * On the canvas the button has to be an inert control: an <a href> here means
   * one click sends the author off their own page. In preview and in the
   * published output it is a link again, which is what makes it work.
   */
  const live = !enabled && href;
  const newWindow = action === 'payment' || (action === 'url' && newTab);

  const label = {
    margin: `${textComponent.margin?.[0] || 0}px ${textComponent.margin?.[1] || 0}px ${textComponent.margin?.[2] || 0}px ${textComponent.margin?.[3] || 0}px`,
    color: `rgba(${Object.values(color)})`,
    fontSize: `${textComponent.fontSize || '15'}px`,
    fontWeight: textComponent.fontWeight || '500',
    textAlign: textComponent.textAlign || 'center',
    textShadow: `0px 0px 2px rgba(0,0,0,${(textComponent.shadow || 0) / 100})`,
    display: 'block',
    width: '100%',
  };

  return (
    <StyledButton
      as={live ? 'a' : 'button'}
      type={live ? undefined : 'button'}
      href={live || undefined}
      target={live && newWindow ? '_blank' : undefined}
      rel={live && newWindow ? 'noopener noreferrer' : undefined}
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
      style={{ textDecoration: 'none' }}
    >
      {/*
        The label used to be the Text element, which calls useNode and so
        claimed this node's DOM for itself. Craft then tracked the inner
        heading instead of the button: hovering it produced no toolbar, so the
        button could not be selected, its Properties could not be opened and it
        could not be deleted. The label is written here now, and Properties
        holds the field that changes it.
      */}
      <span style={label}>{text}</span>
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
