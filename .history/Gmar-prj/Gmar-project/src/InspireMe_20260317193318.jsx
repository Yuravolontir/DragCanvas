
  import React, { useEffect, useState } from 'react';
  import NavBar from './NavBar';
  import Card from 'react-bootstrap/Card';
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
      // Reset to first template when filter changes
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

    // Keyboard navigation
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
  style={{ maxWidth: '1200px', margin: '0 auto' }}>

              {/* Carousel */}
              <div className="position-relative w-100" style={{ height:
  '500px' }}>

                {/* Navigation Buttons */}
                <Button
                  variant="dark"
                  size="lg"
                  onClick={goToPrevious}
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    padding: 0
                  }}
                >
                  ←
                </Button>

                <Button
                  variant="dark"
                  size="lg"
                  onClick={goToNext}
                  style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    padding: 0
                  }}
                >
                  →
                </Button>

                {/* Template Card */}
                <Card className="h-100 shadow-lg" style={{ border:
  'none', borderRadius: '20px' }}>
                 {/* Preview Image */}
                  <div style={{
                    height: '400px',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {currentTemplate?.ThumbnailURL ? (
                      <img
                        src={currentTemplate.ThumbnailURL}
                        alt={currentTemplate.TemplateName}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain', // Changed from cover to contain
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted">
                        <h1 style={{ fontSize: '80px' }}>📄</h1>
                        <p style={{ fontSize: '20px' }}>Preview Coming
  Soon</p>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <Card.Body style={{ padding: '30px' }}>
                    <div className="d-flex justify-content-between
  align-items-start mb-3">
                      <div>
                        <h3
  className="mb-1">{currentTemplate?.TemplateName}</h3>
                        <span className="badge bg-primary
  fs-6">{currentTemplate?.Category}</span>
                      </div>
                      <div className="text-end text-muted">
                        <small>{currentTemplate?.ComponentCount}
  components</small><br />
                        <small>by
  {currentTemplate?.CreatedByName}</small>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 py-3 fs-5"
                      onClick={() => currentTemplate &&
  useTemplate(currentTemplate.Template_ID)}
                      style={{ borderRadius: '10px' }}
                    >
                      🚀 Use This Template
                    </Button>
                  </Card.Body>
                </Card>
              </div>

              {/* Dots Indicator */}
              <div className="d-flex gap-2 mt-4">
                {filteredTemplates.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: idx === currentIndex ? '30px' : '12px',
                      height: '12px',
                      borderRadius: '6px',
                      backgroundColor: idx === currentIndex ? '#0d6efd' :
   '#dee2e6',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  />
                ))}
              </div>

              {/* Template Counter */}
              <p className="text-muted mt-3">
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