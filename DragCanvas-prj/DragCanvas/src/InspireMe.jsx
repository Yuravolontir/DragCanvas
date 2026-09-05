import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

import { apiFetch } from './api.js';
import NavBar from './NavBar';
import TemplatePreview from './Components/TemplatePreview.jsx';
import { useUserContext } from './userContext.js';
import './InspireMe.css';

/**
 * The templates gallery.
 *
 * Two things were wrong with what this was, and they were the same thing twice.
 *
 * It was a carousel: one template on screen, arrows either side, dots below.
 * Fifteen templates meant up to fourteen clicks to see the one you wanted, and
 * a page whose entire job is helping somebody compare showed one of the things
 * being compared. It is a list now — every template at once, scanned by eye.
 *
 * And what it showed of each was `ThumbnailURL`: a stored picture, taken at
 * some point, of a page that has been edited since. Half of them had none and
 * rendered a tinted rectangle. Each card now draws the real site through the
 * same exporter that publishes one, so what you pick is what you get.
 *
 * The skeleton count is what fits above the fold at the common widths; the page
 * does not resize under the reader when the request lands.
 */

const SKELETON_COUNT = 6;

export default function InspireMe() {
  const { currentUser } = useUserContext();

  // null means "still loading"; an empty array means "loaded, but none exist".
  const [templates, setTemplates] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [alert, setAlert] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Bumped to ask again — after a removal, the gallery has changed underneath.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/templates')
      .then((data) => {
        if (!cancelled) setTemplates(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (cancelled) return;
        setTemplates([]);
        setAlert({ tone: 'error', message: `Failed to load templates: ${error.message}` });
      });

    return () => { cancelled = true; };
  }, [reloadToken]);

  const confirmDelete = async () => {
    if (!currentUser) {
      setAlert({ tone: 'error', message: 'You must be logged in' });
      return;
    }
    try {
      await apiFetch(`/api/templates/${templateToDelete.Template_ID}`, { method: 'DELETE' });
      setAlert({ tone: 'success', message: 'Template deleted' });
      setReloadToken((token) => token + 1);
    } catch (error) {
      setAlert({ tone: 'error', message: `Error deleting template: ${error.message}` });
    }
    setTemplateToDelete(null);
  };

  const loadedTemplates = templates || [];
  const templateCategories = loadedTemplates
    .map((template) => template.Category)
    .filter(Boolean);
  const categories = ['all', ...new Set(templateCategories)];
  const visibleTemplates = selectedCategory === 'all'
    ? loadedTemplates
    : loadedTemplates.filter((template) => template.Category === selectedCategory);

  const canDelete = currentUser?.IsAdmin || currentUser?.IsSuperAdmin;

  return (
    <div className="tpl-gallery">
      <NavBar />

      <div className="tpl-gallery__inner">
        <p className="tpl-gallery__eyebrow">Templates</p>
        <h1 className="tpl-gallery__title">Choose a starting point</h1>
        <p className="tpl-gallery__lede">
          Every card below is the real page, drawn the way it will be published.
          Pick one and it opens in the editor, yours to change.
        </p>

        {categories.length > 1 && (
          <div className="tpl-gallery__filters">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className="tpl-gallery__filter"
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All templates' : category}
              </button>
            ))}
          </div>
        )}

        {templates === null ? (
          <ul className="tpl-gallery__list">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <li key={`skeleton-${index}`} className="tpl-gallery__card tpl-gallery__card--loading" aria-hidden="true" />
            ))}
          </ul>
        ) : visibleTemplates.length === 0 ? (
          <div className="tpl-gallery__empty">No templates here yet.</div>
        ) : (
          <ul className="tpl-gallery__list">
            {visibleTemplates.map((template) => (
              <li key={template.Template_ID} className="tpl-gallery__card">
                {/*
                  * The card is one link. Navigating with state rather than a URL
                  * is what the editor's loader reads, and it is the same route
                  * the landing page's strip uses.
                  */}
                <Link
                  className="tpl-gallery__open"
                  to="/create-new-project"
                  state={{ templateId: template.Template_ID }}
                >
                  <TemplatePreview
                    className="tpl-gallery__preview"
                    template={template}
                    height={1.15}
                  />
                  <div className="tpl-gallery__body">
                    <div>
                      <h2 className="tpl-gallery__name">{template.TemplateName}</h2>
                      <div className="tpl-gallery__meta">
                        {template.Category && <span className="tpl-gallery__tag">{template.Category}</span>}
                        {template.ComponentCount ? <span>{template.ComponentCount} blocks</span> : null}
                      </div>
                    </div>
                    <span className="tpl-gallery__go">
                      Use
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_forward</span>
                    </span>
                  </div>
                </Link>

                {canDelete && (
                  <button
                    type="button"
                    className="tpl-gallery__remove"
                    onClick={() => setTemplateToDelete(template)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                    Remove from the gallery
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal show={Boolean(alert)} onHide={() => setAlert(null)} centered>
        <Modal.Header closeButton className={alert?.tone === 'error' ? 'text-danger' : 'text-success'}>
          <Modal.Title>{alert?.tone === 'error' ? 'Something needs your attention' : 'Done'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={alert?.tone === 'error' ? 'danger' : 'success'}>{alert?.message}</Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setAlert(null)}>OK</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(templateToDelete)} onHide={() => setTemplateToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove this template?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>{templateToDelete?.TemplateName}</strong> will stop appearing in the gallery.
          Projects already built from it are not affected.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setTemplateToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Remove</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
