import React from 'react';
import { Resizer } from './Resizer';
import { ContainerSettings } from './ContainerSettings';
import { useDeviceMode } from '../../useDeviceMode.js';
import { responsiveValue } from '../../utils/responsiveProps.js';

const defaultProps = {
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  fillSpace: 'no',
  padding: ['0', '0', '0', '0'],
  margin: ['0', '0', '0', '0'],
  background: { r: 255, g: 255, b: 255, a: 1 },
  backgroundImage: '',
  // Laid over the photograph, under the text. A hero with white type on an
  // unscrimmed photo is legible until the day somebody swaps the photo.
  overlay: { r: 0, g: 0, b: 0, a: 0.45 },
  color: { r: 0, g: 0, b: 0, a: 1 },
  shadow: 0,
  radius: 0,
  width: '100%',
  height: 'auto',
};

export const Container = (props) => {
  const deviceMode = useDeviceMode();
  props = {
    ...defaultProps,
    ...props,
  };
  const {
    flexDirection,
    alignItems,
    justifyContent,
    fillSpace,
    background,
    color,
    padding,
    margin,
    shadow,
    radius,
    anchor,
    backgroundImage,
    overlay,
    children,
  } = props;
  const effectivePadding = responsiveValue(props, deviceMode, 'padding') || padding;
  const effectiveMargin = responsiveValue(props, deviceMode, 'margin') || margin;
  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{
        justifyContent,
        flexDirection,
        alignItems,
        /*
          A photograph behind a section, with a scrim over it.
          
          Written as two layered backgrounds rather than an <img>, so the text
          stays in normal flow and nothing has to be absolutely positioned. The
          gradient is a flat colour expressed as a gradient because CSS will not
          stack a plain colour over an image in one property.
        */
        background: backgroundImage
          ? `linear-gradient(rgba(${Object.values(overlay || { r: 0, g: 0, b: 0, a: 0.45 })}), rgba(${Object.values(overlay || { r: 0, g: 0, b: 0, a: 0.45 })})), url(${backgroundImage})`
          : `rgba(${Object.values(background)})`,
        backgroundSize: backgroundImage ? 'cover' : undefined,
        backgroundPosition: backgroundImage ? 'center' : undefined,
        color: `rgba(${Object.values(color)})`,
        padding: `${effectivePadding[0]}px ${effectivePadding[1]}px ${effectivePadding[2]}px ${effectivePadding[3]}px`,
        margin: `${effectiveMargin[0]}px ${effectiveMargin[1]}px ${effectiveMargin[2]}px ${effectiveMargin[3]}px`,
        boxShadow:
          shadow === 0
            ? 'none'
            : `0px 3px 100px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
        flex: fillSpace === 'yes' ? 1 : 'unset',
      }}
    >
      {/*
        A target the navigation bar can actually reach.
        
        The exported page puts the anchor on the section itself, but here the
        section's id already belongs to Craft - it is how dragging finds the node -
        so overriding it would break the editor to fix a link. An empty span
        carries the anchor instead. The canvas runs with `enabled: false`, so a
        click on a navbar link really does navigate, and until now it navigated to
        an anchor that existed only in the published copy.
      */}
      {anchor && <span id={anchor} aria-hidden="true" />}
      {children}
    </Resizer>
  );
};

Container.craft = {
  displayName: 'Container',
  props: defaultProps,
  rules: {
    canDrag: () => true,
  },
  related: {
    toolbar: ContainerSettings,
  },
};
