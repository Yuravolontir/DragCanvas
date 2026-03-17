 import React, { useEffect, useState } from 'react';
  import NavBar from './NavBar';
  import Button from 'react-bootstrap/Button';
  import Container from 'react-bootstrap/Container';
  import Form from 'react-bootstrap/Form';
  import { useNavigate } from 'react-router-dom';
  import Modal from 'react-bootstrap/Modal';
  import Alert from 'react-bootstrap/Alert';

  export default function InspireMe() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Alert modal
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    useEffect(() => {
      fetchTemplates();
    }, []);

    useEffect(() => {
      setCurrentIndex(0);
    }, [filterCategory]);

    const fetchTemplates = async () => {
      try {
        const response = await
  fetch('http://localhost:3001/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
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
      navigate('/create-new-project', {
        state: { templateId: templateId }
      });
    };

    const filteredTemplates = filterCategory === 'all'
      ? templates
      : templates.filter(t => t.Category === filterCategory);

    const categories = ['all', ...new Set(templates.map(t =>
  t.Category))];

    const currentTemplate = filteredTemplates[currentIndex];

    const goToPrevious = () => {
      setCurrentIndex((prev) => prev === 0 ? filteredTemplates.length - 1
   : prev - 1);
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
      <div>
        <NavBar />
        <Container fluid style={{ paddingTop: '100px', minHeight:
  '100vh', backgroundColor: '#f8f9fa' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="mb-2">✨ Inspire Me!</h1>
            <p className="text-muted">Choose a template to get
  started</p>

            <Form.Select
              style={{ maxWidth: '250px', margin: '0 auto' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </Form.Select>
          </div>

          {loading ? (
            <div className="text-center mt-5">
              <h3>Loading templates...</h3>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center mt-5">
              <h5>No templates found.</h5>
            </div>
                   ) : (
            <div className="d-flex flex-column align-items-center"
  style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 20px' }}>

              {/* Navigation Buttons */}
              <Button
                variant="dark"
                size="lg"
                onClick={goToPrevious}
                style={{
                  position: 'fixed',
                  left: '30px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  borderRadius: '50%',
                  width: '70px',
                  height: '70px',
                  padding: 0,
                  fontSize: '28px'
                }}
              >
                ←
              </Button>

              <Button
                variant="dark"
                size="lg"
                onClick={goToNext}
                style={{
                  position: 'fixed',
                  right: '30px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  borderRadius: '50%',
                  width: '70px',
                  height: '70px',
                  padding: 0,
                  fontSize: '28px'
                }}
              >
                →
              </Button>

              {/* Template Preview - Large */}
              <div className="bg-white rounded shadow-lg mx-auto"
  style={{
                width: '100%',
                maxHeight: '75vh',
                overflow: 'auto',
                border: '2px solid #dee2e6'
              }}>
                {currentTemplate?.ThumbnailURL ? (
                  <img
                    src={currentTemplate.ThumbnailURL}
                    alt={currentTemplate.TemplateName}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div className="text-center text-muted d-flex
  flex-column align-items-center justify-content-center" style={{
  minHeight: '600px' }}>
                    <h1 style={{ fontSize: '100px' }}>📄</h1>
                    <p style={{ fontSize: '24px' }}>Preview Coming
  Soon</p>
                  </div>
                )}
              </div>

              {/* Info Bar - Larger */}
              <div className="bg-white rounded shadow p-4 mt-4" style={{
  width: '100%', border: '2px solid #dee2e6' }}>
                <div className="d-flex justify-content-between
  align-items-center">
                  <div>
                    <h2
  className="mb-2">{currentTemplate?.TemplateName}</h2>
                    <span className="badge bg-primary fs-5
  me-2">{currentTemplate?.Category}</span>
                    <span className="text-muted fs-6">
                      {currentTemplate?.ComponentCount} components • by
  {currentTemplate?.CreatedByName}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => currentTemplate &&
  useTemplate(currentTemplate.Template_ID)}
                    style={{ borderRadius: '10px', padding: '15px 40px',
  fontSize: '18px' }}
                  >
                    🚀 Use This Template
                  </Button>
                </div>
              </div>

              {/* Dots Indicator */}
              <div className="d-flex gap-3 mt-4">
                {filteredTemplates.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: idx === currentIndex ? '40px' : '15px',
                      height: '15px',
                      borderRadius: '8px',
                      backgroundColor: idx === currentIndex ? '#0d6efd' :
   '#dee2e6',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  />
                ))}
              </div>

              {/* Template Counter */}
              <p className="text-muted mt-3 fs-5">
                {currentIndex + 1} of {filteredTemplates.length}
  templates
              </p>
            </div>
          )}
        </Container>

        {/* Alert Modal */}
        <Modal show={showAlert} onHide={() => setShowAlert(false)}
  centered>
          <Modal.Header closeButton className={alertType === 'success' ?
  'text-success' : 'text-danger'}>
            <Modal.Title>{alertType === 'success' ? 'Success' :
  'Error'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant={alertType === 'success' ? 'success' :
  'danger'}>
              {alertMessage}
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() =>
  setShowAlert(false)}>OK</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }