import API_URL from './api.js';
import React, { useEffect, useState } from 'react';
import NavBar from './NavBar';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';

export default function InspireMe() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  useEffect(() => {
    fetchTemplates();
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [filterCategory]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setTemplates([]);
      showAlertModal('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlertModal = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const useTemplate = (templateId) => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      showAlertModal('Please register or login to use templates', 'error');
      setTimeout(() => navigate('/register'), 1500);
      return;
    }
    navigate('/create-new-project', { state: { templateId } });
  };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!currentUser) {
      showAlertModal('You must be logged in', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/templates/${templateToDelete.Template_ID}?userId=${currentUser.User_ID}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );

      const rawText = await response.text();

      if (response.ok) {
        try {
          JSON.parse(rawText);
          showAlertModal('Template deleted successfully', 'success');
          fetchTemplates();
        } catch (e) {
          showAlertModal('Server returned invalid response', 'error');
        }
      } else {
        showAlertModal('Failed to delete template', 'error');
      }
    } catch (err) {
      showAlertModal('Error deleting template: ' + err.message, 'error');
    }

    setShowDeleteModal(false);
    setTemplateToDelete(null);
  };

  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter(t => t.Category === filterCategory);

  const categories = ['all', ...new Set(templates.map(t => t.Category))];
  const currentTemplate = filteredTemplates[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => prev === 0 ? filteredTemplates.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredTemplates.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTemplates.length]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <NavBar />

      <div style={{ paddingTop: '100px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', fontWeight: 700 }}>
            Templates
          </p>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'var(--on-surface)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: '16px',
          }}>
            Choose a Starting Point
          </h1>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '1rem',
            color: 'var(--on-surface-variant)',
            marginBottom: '32px',
            maxWidth: '500px',
          }}>
            Browse our curated collection of templates to kickstart your next project
          </p>

          {/* Category Pills */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: filterCategory === cat ? 'var(--primary)' : 'white',
                  color: filterCategory === cat ? 'white' : 'var(--on-surface-variant)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: filterCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)',
                  border: filterCategory === cat ? 'none' : '1px solid var(--outline-light)',
                }}
                onMouseEnter={(e) => {
                  if (filterCategory !== cat) {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.color = 'var(--primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterCategory !== cat) {
                    e.target.style.borderColor = 'var(--outline-light)';
                    e.target.style.color = 'var(--on-surface-variant)';
                  }
                }}
              >
                {cat === 'all' ? 'All Templates' : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '120px 0' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--muted)', fontSize: '0.9rem' }}>
              Loading templates...
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: 'white',
            borderRadius: '24px',
            border: '2px dashed var(--outline-light)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.2rem',
              color: 'var(--muted)',
              fontWeight: 700,
            }}>
              No templates found
            </h3>
          </div>
        ) : (
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              style={{
                position: 'fixed',
                left: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                width: '48px',
                height: '48px',
                borderRadius: '9999px',
                border: '1px solid var(--outline-light)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--outline-light)';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)' }}>arrow_back</span>
            </button>

            <button
              onClick={goToNext}
              style={{
                position: 'fixed',
                right: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                width: '48px',
                height: '48px',
                borderRadius: '9999px',
                border: '1px solid var(--outline-light)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--outline-light)';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)' }}>arrow_forward</span>
            </button>

            {/* Template Card */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              border: '1px solid var(--outline-light)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.3s ease',
            }}>
              {/* Template Preview */}
              {currentTemplate?.ThumbnailURL && (
                <div style={{
                  height: '420px',
                  overflow: 'hidden',
                  background: 'var(--surface-dim)',
                  position: 'relative',
                }}>
                  <img
                    src={currentTemplate.ThumbnailURL}
                    alt={currentTemplate.TemplateName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'all 0.5s ease',
                    }}
                    draggable={false}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, white, transparent)',
                  }} />
                </div>
              )}

              {/* Info */}
              <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--on-surface)',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                  }}>
                    {currentTemplate?.TemplateName}
                  </h2>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '0.85rem',
                    color: 'var(--muted)',
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}>
                      {currentTemplate?.Category}
                    </span>
                    <span>{currentTemplate?.ComponentCount} components</span>
                    <span>by {currentTemplate?.CreatedByName}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(currentUser?.IsAdmin || currentUser?.IsSuperAdmin) && (
                    <button
                      onClick={() => handleDeleteClick(currentTemplate)}
                      style={{
                        padding: '12px 20px',
                        background: 'transparent',
                        color: 'var(--muted)',
                        border: '1px solid var(--outline-light)',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--error)';
                        e.currentTarget.style.borderColor = 'var(--error)';
                        e.currentTarget.style.background = 'rgba(186,26,26,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--muted)';
                        e.currentTarget.style.borderColor = 'var(--outline-light)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  )}
                  <button
                    onClick={() => useTemplate(currentTemplate?.Template_ID)}
                    style={{
                      padding: '12px 28px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '9999px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(0, 96, 172, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Use Template
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dot Indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              {filteredTemplates.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: i === currentIndex ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === currentIndex ? 'var(--primary)' : 'var(--outline-light)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      <Modal show={showAlert} onHide={() => setShowAlert(false)} centered>
        <Modal.Header closeButton className={alertType === 'success' ? 'text-success' : 'text-danger'}>
          <Modal.Title>{alertType === 'success' ? 'Success' : 'Error'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={alertType === 'success' ? 'success' : 'danger'}>
            {alertMessage}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowAlert(false)}>OK</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{templateToDelete?.TemplateName}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
