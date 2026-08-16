import { useEffect, useState } from 'react';

import { useReveal } from './useReveal.js';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../api.js';
import './TemplatesStrip.css';

/**
 * The templates that actually exist, read from the database.
 *
 * `GET /api/templates` is public, so the landing can show the real gallery
 * rather than screenshots of it. That matters more than it sounds: a visitor
 * comparing builders is looking for evidence that the thing is populated and
 * alive, and a hand-picked set of pictures is exactly what an empty product
 * would also show.
 *
 * Fetched on mount rather than on scroll. The request is small, the section is
 * below the fold, and the server sleeps between visits - starting early means
 * the rows are usually there by the time anyone scrolls to them.
 */

const SKELETON_COUNT = 4;

export default function TemplatesStrip() {
  const [templates, setTemplates] = useState(null);
  const [failed, setFailed] = useState(false);
  const introRef = useReveal();

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/templates')
      .then(rows => {
        if (!cancelled) setTemplates(Array.isArray(rows) ? rows.slice(0, 8) : []);
      })
      .catch(() => {
        // A gallery that will not load is not worth an error message on a
        // landing page - the section simply steps aside.
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, []);

  if (failed || (templates && templates.length === 0)) return null;

  return (
    <section className="templates-strip">
      <div className="templates-strip__intro reveal" ref={introRef}>
        <h2 className="templates-strip__title">Or start from one of these</h2>
        <Link className="templates-strip__all" to="/inspire-me">
          See the whole gallery
        </Link>
      </div>

      <ul className="templates-strip__list">
        {templates === null
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <li key={`skeleton-${index}`} className="templates-strip__card templates-strip__card--loading" aria-hidden="true">
                <div className="templates-strip__thumb" />
                <div className="templates-strip__line" />
                <div className="templates-strip__line templates-strip__line--short" />
              </li>
            ))
          : templates.map(template => (
              <li key={template.Template_ID} className="templates-strip__card">
                <Link className="templates-strip__link" to="/inspire-me">
                  <div className="templates-strip__thumb">
                    {template.ThumbnailURL && (
                      <img
                        src={template.ThumbnailURL}
                        alt=""
                        loading="lazy"
                        // A dead thumbnail leaves the tinted panel behind rather
                        // than a broken-image icon.
                        onError={event => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <span className="templates-strip__name">{template.TemplateName}</span>
                  <span className="templates-strip__meta">
                    {template.Category}
                    {template.ComponentCount ? ` · ${template.ComponentCount} blocks` : ''}
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
