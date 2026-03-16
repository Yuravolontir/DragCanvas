
  import { useState, useEffect } from 'react'
  import NavBar from './NavBar';
  import { useUserContext } from './UserContextProvider';
  import Card from 'react-bootstrap/Card';
  import Button from 'react-bootstrap/Button';
  import Container from 'react-bootstrap/Container';
  import Row from 'react-bootstrap/Row';
  import Col from 'react-bootstrap/Col';
  import Modal from 'react-bootstrap/Modal';
  import Alert from 'react-bootstrap/Alert';
  import { useNavigate } from 'react-router-dom';

  export default function MyProject() {
    const navigate = useNavigate();
    const { currentUser, deleteproject } = useUserContext();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [showDeleteModal, setShowDeleteModal] =useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);


    useEffect(() => {
      fetchProjects();
    }, []);

     const fetchProjects = async () => {
      try {
        if (!currentUser?.User_ID) {
          console.error('No user logged in');
          return;
        }

        const response = await fetch(

  `http://localhost:3001/api/projects/user/${currentUser.User_ID}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        console.log('Projects loaded:', data);
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        showAlertModal('Failed to load projects: ' + err.message,
  'error');
      } finally {
        setLoading(false);
      }
    };

    const showAlertModal = (message, type = 'success') => {
      setAlertMessage(message);
      setAlertType(type);
      setShowAlert(true);
    };

    const loadProject = (projectId) => {
      navigate('/create-new-project', {
        state: { projectId: projectId }
      });
    };

   
   
      const handleDeleteClick = (projectId) => {
        setProjectToDelete(projectId);
        setShowDeleteModal(true);
      };

      const confirmDelete = async () => {
        setShowDeleteModal(false);

        try {
          const response = await fetch(
    `http://localhost:3001/api/projects/${projectToDelete}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.User_ID
            })
          });

          if (response.ok) {
            fetchProjects();
            showAlertModal('Project deleted successfully',
    'success');
          } else {
            throw new Error('Failed to delete project');
          }
        } catch (err) {
          console.error('Delete error:', err);
          showAlertModal('Error deleting project: ' + err.message,
    'error');
        }
      };


    return (
      <div>
        <NavBar />
        <Container className="mt-4" style={{ paddingTop: '100px'
  }}>
          <h1 style={{ marginBottom: '20px' }}>My Projects</h1>

          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p>No projects yet. <a
  href="/create-new-project">Create one!</a></p>
          ) : (
            <Row>
              {projects.map((project) => (
                <Col key={project.Project_ID} xs={12} md={6} lg={4}
   className="mb-4">
                  <Card>
                    <Card.Body>
                      <Card.Title>
                        {project.ProjectName || 'Unnamed Project'}
                      </Card.Title>
                      <Card.Text>
                        {project.ProjectDescription && (
                          <small
  className="text-muted">{project.ProjectDescription}</small>
                        )}
                        <br />
                        <small>
                          Components: {project.ComponentCount} |
                          Size: {project.ProjectSizeKB} KB
                        </small>
                        <br />
                        <small className="text-muted">
                          Created: {new
  Date(project.CreatedDate).toLocaleDateString()}
                        </small>
                      </Card.Text>
                      <Button
                        variant="primary"
                        onClick={() =>
  loadProject(project.Project_ID)}
                      >
                        Load Project
                      </Button>
                        <Button
                          variant="danger"
                          className="ms-2"
                          onClick={() =>
  handleDeleteClick(project.Project_ID)}
                        >
                          Delete
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
          <Modal.Header closeButton className={alertType ===
  'success' ? 'text-success' : 'text-danger'}>
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
        
          {/* Delete Confirmation Modal */}
          <Modal show={showDeleteModal} onHide={() =>
  setShowDeleteModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Delete</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to delete this project? This
  action cannot be undone.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() =>
  setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger"
  onClick={confirmDelete}>Delete</Button>
            </Modal.Footer>
          </Modal>
      </div>
    );
  }