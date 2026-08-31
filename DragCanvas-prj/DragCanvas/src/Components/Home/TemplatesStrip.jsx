import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../api.js';
import TemplatePreview from '../TemplatePreview.jsx';
import MiniSite from './MiniSite.jsx';
import { SITES } from './sites.js';
import { useReveal } from './useReveal.js';
import './TemplatesStrip.css';

const FALLBACKS = SITES.slice(0, 5).map((site, index) => ({
  Template_ID: `example-${site.id}`,
  TemplateName: site.sections.find(section => section.kind === 'nav')?.brand || site.id,
  Category: ['Food & hospitality', 'Portfolio', 'Fitness', 'Event', 'Commerce'][index],
  ComponentCount: site.sections.length,
  site,
  fallback: true,
}));

export default function TemplatesStrip() {
  const [templates, setTemplates] = useState(null);
  const [active, setActive] = useState(0);
  const introRef = useReveal();
  const showcaseRef = useReveal(100);
  const surfaceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/templates')
      .then(rows => {
        if (cancelled) return;
        const available = Array.isArray(rows) ? rows.slice(0, 6) : [];
        setTemplates(available.length ? available : FALLBACKS);
      })
      .catch(() => {
        if (!cancelled) setTemplates(FALLBACKS);
      });
    return () => { cancelled = true; };
  }, []);

  const items = templates || FALLBACKS;
  const selected = items[Math.min(active, items.length - 1)] || items[0];
  const selectedIndex = items.indexOf(selected);
  const destination = selected.fallback
    ? { pathname: '/inspire-me' }
    : { pathname: '/create-new-project', state: { templateId: selected.Template_ID } };

  const move = direction => setActive(current => (current + direction + items.length) % items.length);

  const trackLight = event => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const box = surface.getBoundingClientRect();
    surface.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
    surface.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
  };

  return (
    <section className="templates-strip">
      <div className="templates-strip__intro reveal" ref={introRef}>
        <div>
          <span className="templates-strip__eyebrow eyebrow">Curated starting points</span>
          <h2 className="templates-strip__title">A strong first draft,<br />ready to become yours.</h2>
        </div>
        <div className="templates-strip__intro-side">
          <p className="templates-strip__subtitle">
            Choose a direction, then rewrite, rearrange and restyle every detail in the editor.
          </p>
          <Link className="templates-strip__all" to="/inspire-me">
            Explore all templates <span aria-hidden="true">&#8599;</span>
          </Link>
        </div>
      </div>

      <div className="templates-showcase reveal" ref={showcaseRef}>
        <div className="templates-showcase__surface" ref={surfaceRef} onPointerMove={trackLight}>
          <div className="templates-showcase__topbar">
            <span className="templates-showcase__counter">
              {String(selectedIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <span className="templates-showcase__label">Live preview</span>
            <div className="templates-showcase__arrows">
              <button type="button" onClick={() => move(-1)} aria-label="Previous template"><span aria-hidden="true">&#8592;</span></button>
              <button type="button" onClick={() => move(1)} aria-label="Next template"><span aria-hidden="true">&#8594;</span></button>
            </div>
          </div>

          <div className="templates-showcase__browser" key={selected.Template_ID}>
            <div className="templates-showcase__browser-bar" aria-hidden="true">
              <span /><span /><span />
              <span className="templates-showcase__address">preview.dragcanvas.app</span>
            </div>
            {selected.fallback ? (
              <div className="templates-showcase__fallback-preview"><MiniSite site={selected.site} /></div>
            ) : (
              <TemplatePreview className="templates-showcase__preview" template={selected} height={0.72} />
            )}
          </div>

          <div className="templates-showcase__details">
            <div>
              <span className="templates-showcase__category">{selected.Category || 'Website'}</span>
              <h3>{selected.TemplateName}</h3>
            </div>
            <Link className="templates-showcase__cta" to={destination.pathname} state={destination.state}>
              {selected.fallback ? 'Browse similar templates' : 'Start with this template'}
              <span aria-hidden="true">&#8594;</span>
            </Link>
          </div>
        </div>

        <div className="templates-showcase__rail" role="tablist" aria-label="Choose a template preview">
          {items.map((template, index) => (
            <button
              key={template.Template_ID}
              type="button"
              role="tab"
              aria-selected={index === selectedIndex}
              className={`templates-showcase__option${index === selectedIndex ? ' is-active' : ''}`}
              onClick={() => setActive(index)}
            >
              <span className="templates-showcase__option-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="templates-showcase__option-copy">
                <strong>{template.TemplateName}</strong>
                <small>{template.Category || 'Website'}</small>
              </span>
              <span className="templates-showcase__option-arrow" aria-hidden="true">&#8594;</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
