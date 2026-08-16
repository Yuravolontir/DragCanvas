import { useEffect, useRef } from 'react';

import './MiniSite.css';

/**
 * A website, rendered as a website.
 *
 * The previous attempt drew this with WebGL and it looked like a wireframe,
 * because rectangles with bars painted on them are a wireframe. The browser
 * already renders pages - crisply, at any resolution, with real type and real
 * photographs - so it renders this one.
 *
 * Laid out at a fixed 1120px and scaled down to fit, rather than styled small
 * directly. Proportions then match a real page instead of approximating one:
 * the nav is nav-sized relative to the hero, the body copy is body-sized
 * relative to the headline. Shrinking a real layout looks right in a way that
 * building a small one never quite does.
 *
 * Every colour and the typeface come from the site's own theme, so the five
 * examples do not look like one design recoloured.
 */

const PAGE_WIDTH = 1120;

/** What the editor calls each kind of block. */
const NODE_NAME = {
  nav: 'Navbar',
  hero: 'Hero',
  cards: 'Cards',
  gallery: 'Gallery',
  agenda: 'Schedule',
  footer: 'Footer',
};

export default function MiniSite({ site }) {
  const hostRef = useRef(null);
  const pageRef = useRef(null);

  // Scale the real layout down to whatever room the frame has
  useEffect(() => {
    const host = hostRef.current;
    const page = pageRef.current;
    if (!host || !page) return undefined;

    const fit = () => {
      const scale = host.clientWidth / PAGE_WIDTH;
      page.style.setProperty('--mini-scale', String(scale));
      // The wrapper has no height of its own once its child is transformed, so
      // it is told what the scaled page comes to.
      host.style.height = `${page.offsetHeight * scale}px`;
    };

    const observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();
    return () => observer.disconnect();
  }, [site]);

  const theme = site.theme;

  return (
    <div className="mini" ref={hostRef}>
      <div
        className="mini__page"
        ref={pageRef}
        style={{
          '--site-bg': theme.bg,
          '--site-panel': theme.panel,
          '--site-fg': theme.fg,
          '--site-muted': theme.muted,
          '--site-accent': theme.accent,
          '--site-radius': theme.radius,
          fontFamily: theme.font,
        }}
      >
        {site.sections.map((section, index) => (
          <div
            key={`${site.id}-${index}`}
            // Sections place themselves on mount, staggered. Replaying is then
            // just a remount with a new key - no state to reset, and nothing to
            // get stuck half-built if a render is interrupted.
            className="mini__section"
            // The node name the editor would show for this block. It flashes as
            // the section lands and then gets out of the way - the selection
            // chrome is the verb, the finished site is the noun.
            data-node={NODE_NAME[section.kind] ?? 'Section'}
            style={{ '--place-delay': `${index * 130}ms` }}
          >
            <Section section={section} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ section }) {
  switch (section.kind) {
    case 'nav':
      return (
        <nav className="mini-nav">
          <span className="mini-nav__brand">{section.brand}</span>
          <span className="mini-nav__links">
            {section.links.map(link => <span key={link}>{link}</span>)}
          </span>
        </nav>
      );

    case 'hero':
      return (
        <header className="mini-hero">
          <div className="mini-hero__copy">
            <h2 className="mini-hero__title">{section.title}</h2>
            <p className="mini-hero__text">{section.text}</p>
            <span className="mini-hero__cta">{section.cta}</span>
          </div>
          <img className="mini-hero__image" src={section.image} alt="" loading="lazy" decoding="async" />
        </header>
      );

    case 'cards':
      return (
        <div className="mini-cards">
          {section.items.map(item => (
            <div className="mini-card" key={item.title}>
              <span className="mini-card__title">{item.title}</span>
              <span className="mini-card__text">{item.text}</span>
            </div>
          ))}
        </div>
      );

    case 'gallery':
      return (
        <div className="mini-gallery">
          {section.images.map(src => (
            <img key={src} src={src} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
      );

    case 'agenda':
      return (
        <div className="mini-agenda">
          {section.items.map(item => (
            <div className="mini-agenda__row" key={item.time}>
              <span className="mini-agenda__time">{item.time}</span>
              <span className="mini-agenda__title">{item.title}</span>
            </div>
          ))}
        </div>
      );

    case 'footer':
      return <div className="mini-footer">{section.text}</div>;

    default:
      return null;
  }
}
