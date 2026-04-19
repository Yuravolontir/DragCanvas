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
      const response = await fetch('http://localhost:3001/api/templates');
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
      const response = await fetch(
        `http://localhost:3001/api/templates/${templateToDelete.Template_ID}?userId=${currentUser.User_ID}`,
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
    <div style={{ background: '#0b1325', minHeight: '100vh' }}>
      <NavBar />

      <div style={{ paddingTop: '100px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.8rem', color: '#4f6ef7', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', fontWeight: 700 }}>
            The Collection
          </p>
          <h1 style={{
            fontFamily: "'Noto Serif', serif",
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: 900,
            color: '#dbe2fb',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: '16px',
          }}>
            Obsidian <br />Archive
          </h1>
          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '1rem',
            color: '#71717a',
            marginBottom: '32px',
            maxWidth: '400px',
          }}>
            Choose a starting point for your next project
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
                  background: filterCategory === cat ? '#4f6ef7' : '#222a3d',
                  color: filterCategory === cat ? 'white' : '#c4c5d7',
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: filterCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (filterCategory !== cat) {
                    e.target.style.background = '#2d3448';
                    e.target.style.color = '#dbe2fb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterCategory !== cat) {
                    e.target.style.background = '#222a3d';
                    e.target.style.color = '#c4c5d7';
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
            <div style={{ fontFamily: "'Manrope', sans-serif", color: '#71717a', fontSize: '0.9rem' }}>
              Loading templates...
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: 'rgba(23, 31, 50, 0.5)',
            borderRadius: '20px',
            border: '2px dashed rgba(68, 70, 84, 0.3)',
          }}>
            <h3 style={{
              fontFamily: "'Noto Serif', serif",
              fontSize: '1.2rem',
              color: '#71717a',
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
                borderRadius: '12px',
                border: '1px solid rgba(68, 70, 84, 0.3)',
                background: 'rgba(23, 31, 50, 0.8)',
                backdropFilter: 'blur(20px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(79, 110, 247, 0.4)';
                e.currentTarget.style.background = 'rgba(34, 42, 61, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(68, 70, 84, 0.3)';
                e.currentTarget.style.background = 'rgba(23, 31, 50, 0.8)';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#b9c3ff' }}>arrow_back</span>
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
                borderRadius: '12px',
                border: '1px solid rgba(68, 70, 84, 0.3)',
                background: 'rgba(23, 31, 50, 0.8)',
                backdropFilter: 'blur(20px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(79, 110, 247, 0.4)';
                e.currentTarget.style.background = 'rgba(34, 42, 61, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(68, 70, 84, 0.3)';
                e.currentTarget.style.background = 'rgba(23, 31, 50, 0.8)';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#b9c3ff' }}>arrow_forward</span>
            </button>

            {/* Template Card */}
            <div style={{
              background: 'rgba(19, 27, 45, 0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: '20px',
              border: '1px solid rgba(68, 70, 84, 0.15)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
            }}>
              {/* Template Preview */}
              {currentTemplate?.ThumbnailURL && (
                <div style={{
                  height: '420px',
                  overflow: 'hidden',
                  background: '#060e1f',
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
                      opacity: 0.8,
                      transition: 'all 0.5s ease',
                    }}
                    draggable={false}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '0.8';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, #0b1325, transparent)',
                  }} />
                </div>
              )}

              {/* Info */}
              <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{
                    fontFamily: "'Noto Serif', serif",
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#dbe2fb',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                  }}>
                    {currentTemplate?.TemplateName}
                  </h2>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '0.85rem',
                    color: '#71717a',
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      background: 'rgba(79, 110, 247, 0.15)',
                      color: '#b9c3ff',
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
                        color: '#71717a',
                        border: '1px solid rgba(68, 70, 84, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ff6b6b';
                        e.currentTarget.style.borderColor = '#ff6b6b';
                        e.currentTarget.style.background = 'rgba(255,107,107,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#71717a';
                        e.currentTarget.style.borderColor = 'rgba(68, 70, 84, 0.2)';
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
                      background: 'rgba(79, 110, 247, 0.1)',
                      color: '#b9c3ff',
                      border: '1px solid rgba(79, 110, 247, 0.2)',
                      borderRadius: '8px',
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#4f6ef7';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#4f6ef7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(79, 110, 247, 0.1)';
                      e.currentTarget.style.color = '#b9c3ff';
                      e.currentTarget.style.borderColor = 'rgba(79, 110, 247, 0.2)';
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
                    background: i === currentIndex ? '#4f6ef7' : '#2d3448',
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
