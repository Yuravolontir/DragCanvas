import React from 'react'

import NavBar from './NavBar';
import { useUserContext } from './UserContextProvider';
import Card from 'react-bootstrap/Card';
  import Button from 'react-bootstrap/Button';
  import Container from 'react-bootstrap/Container';
  import Row from 'react-bootstrap/Row';
  import Col from 'react-bootstrap/Col';
    import { useNavigate } from 'react-router-dom';



export default function MyProject() {
  const navigate = useNavigate();
  const { projects } = useUserContext();
  const validProjects = projects.filter(p => p !== null);
  return (
    <div>
        <NavBar />
            <Container className="mt-4">
          <h1>My Projects</h1>

          {validProjects.length === 0 ? (
            <p>No projects yet. Create one!</p>
          ) : (
            <Row>
              {validProjects.map((project) => (
                <Col key={project.id} xs={12} md={6} lg={4} className="mb-4">
                  <Card>
                    <Card.Body>
                      <Card.Title>Project {project.id.slice(0, 8)}...</Card.Title>
                      <Card.Text>
                        Created: {new Date(project.createdAt).toLocaleString()}
                      </Card.Text>
                      <Card.Text>
                        <small className="text-muted">
                          {JSON.stringify(project.data).slice(0, 100)}...
                        </small>
                      </Card.Text>
                      <Button
                        variant="primary"
                        onClick={() => navigate('/create-new-project', { state: { projectId: project.id } })}
                      >
                        Load Project
                      </Button>
                      <Button
                        variant="danger"
                        className="ms-2"
                        onClick={() => {/* Add delete function */}}
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
    </div>
  )
}
