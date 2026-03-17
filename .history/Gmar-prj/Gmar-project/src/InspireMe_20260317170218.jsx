
  import React, { useEffect, useState } from 'react';
  import NavBar from './NavBar';
  import Card from 'react-bootstrap/Card';
  import Button from 'react-bootstrap/Button';
  import Container from 'react-bootstrap/Container';
  import Row from 'react-bootstrap/Row';
  import Col from 'react-bootstrap/Col';
  import Form from 'react-bootstrap/Form';
  import { useNavigate } from 'react-router-dom';
  import Modal from 'react-bootstrap/Modal';
  import Alert from 'react-bootstrap/Alert';

  export default function InspireMe() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Alert modal
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    useEffect(() => {
      fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
      try {
        const response = await
  fetch('http://localhost:3001/api/templates');
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
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

    return (
      <div>
        <NavBar />
        <Container className="mt-4" style={{ paddingTop: '100px' }}>
          <div className="d-flex justify-content-between
  align-items-center mb-4">
            <h1>✨ Inspire Me!</h1>
            <h5 className="text-muted">{templates.length} Templates
  Available</h5>
          </div>

          <div className="mb-4">
            <Form.Select
              style={{ maxWidth: '200px' }}
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
            <p>Loading templates...</p>
          ) : filteredTemplates.length === 0 ? (
            <p>No templates found.</p>
          ) : (
            <Row>
              {filteredTemplates.map((template) => (
                <Col key={template.Template_ID} xs={12} md={6} lg={4}
  className="mb-4">
                  <Card className="h-100">
                    {/* Thumbnail */}
                    <div style={{
                      height: '180px',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {template.ThumbnailURL ? (
                        <Card.Img
                          variant="top"
                          src={template.ThumbnailURL}
                          style={{ height: '180px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="text-center text-muted">
                          <h3>📄</h3>
                          <p>No Preview</p>
                        </div>
                      )}
                    </div>

                    <Card.Body>
                      <Card.Title>{template.TemplateName}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        <small className="badge
  bg-secondary">{template.Category}</small>
                      </Card.Subtitle>
                      <Card.Text>
                        <small>
                          {template.ComponentCount} components •
                          Created by {template.CreatedByName}
                        </small>
                      </Card.Text>
                      <Button
                        variant="primary"
                        className="w-100"
                        onClick={() => useTemplate(template.Template_ID)}
                      >
                        Use This Template
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
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