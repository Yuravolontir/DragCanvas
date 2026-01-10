import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { useNavigate } from "react-router-dom";

function ContainerInsideExample() {

    const navigate = useNavigate();

  return (
    <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand  onClick={() => navigate("/")}>Home</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link  onClick={() => navigate("/create-new-project")}>Create new project</Nav.Link>
            <Nav.Link onClick={() => navigate("/my-projects")}>My projects</Nav.Link>
            <Nav.Link  onClick={() => navigate("/inspire-me")}>Inspire me!</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
  );
}

export default ContainerInsideExample;