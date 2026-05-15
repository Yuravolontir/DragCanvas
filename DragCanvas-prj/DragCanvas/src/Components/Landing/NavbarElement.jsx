import { useNode } from '@craftjs/core';
import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { Resizer } from './Resizer';
import { NavbarSettings } from './NavbarSettings';

const toCssColor = (color) => {
  if (!color) return '#ffffff';
  if (typeof color === 'string') return color;
  if (typeof color === 'object') return `rgba(${color.r},${color.g},${color.b},${color.a})`;
  return '#ffffff';
};

export const NavbarElement = ({ variant, brand, links, textColor, height, sticky }) => {
  variant = variant || 'dark';
  brand = brand || 'Brand';
  links = links || [
    { text: 'Home', href: '#home' },
    { text: 'Features', href: '#features' },
    { text: 'Pricing', href: '#pricing' },
  ];
  const cssColor = toCssColor(textColor);
  height = height || '56px';

  const bgMap = {
    dark: 'dark',
    primary: 'primary',
    light: 'light',
  };

  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{
        width: '100%',
        display: 'block',
        overflow: sticky ? 'visible' : 'hidden',
        borderRadius: sticky ? '0' : '8px',
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 1000 } : {}),
      }}
    >
      <div style={{
        height: height,
        width: '100%',
        overflow: 'visible',
      }}>
        <Navbar
          bg={bgMap[variant] || 'dark'}
          variant={variant === 'light' ? 'light' : 'dark'}
          style={{
            height: '100%',
            margin: 0,
            ...(variant === 'custom' ? { backgroundColor: '#333' } : {}),
          }}
        >
          <Container>
            <Navbar.Brand
              href="#home"
              style={{
                color: cssColor,
                fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {brand}
            </Navbar.Brand>
            <Nav className="me-auto">
              {links.map((link, i) => (
                <Nav.Link
                  key={i}
                  href={link.href}
                  style={{
                    color: cssColor,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    opacity: 0.85,
                  }}
                >
                  {link.text}
                </Nav.Link>
              ))}
            </Nav>
          </Container>
        </Navbar>
      </div>
    </Resizer>
  );
};

NavbarElement.craft = {
  displayName: 'Navbar',
  props: {
    variant: 'dark',
    brand: 'Brand',
    links: [
      { text: 'Home', href: '#home' },
      { text: 'Features', href: '#features' },
      { text: 'Pricing', href: '#pricing' },
    ],
    textColor: { r: 255, g: 255, b: 255, a: 1 },
    height: '56px',
    width: '100%',
    sticky: false,
  },
  related: {
    toolbar: NavbarSettings,
  },
};
