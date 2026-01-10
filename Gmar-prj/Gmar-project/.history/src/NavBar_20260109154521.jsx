import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { useNavigate } from "react-router-dom";

function ContainerInsideExample() {

    const navigate = useNavigate();

  return (
    <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="#home" onClick={() => navigate("/")}>Home</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#home" onClick={() => navigate("/create-new-project")}>Create new project</Nav.Link>
            <Nav.Link href="#features" onClick={() => navigate("/my-projects")}>My projects</Nav.Link>
            <Nav.Link href="#pricing" onClick={() => navigate("/inspire-me")}>Inspire me!</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
  );
}

export default ContainerInsideExample;