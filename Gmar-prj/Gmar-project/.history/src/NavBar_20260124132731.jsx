  import React from 'react';
  import Container from 'react-bootstrap/Container';
  import Nav from 'react-bootstrap/Nav';
  import Navbar from 'react-bootstrap/Navbar';
  import { useNavigate } from "react-router-dom";
  import { useUserContext } from "./UserContextProvider";

  function NavBar() {
    const navigate = useNavigate();
    const { currentUser, logout } = useUserContext();

    return (
      <Navbar bg="dark" data-bs-theme="dark" fixed="top" expand="lg">
        <Container>
          <Navbar.Brand onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            Gmar Builder
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate("/")}>Home</Nav.Link>
              {currentUser ? (
                <>
                  <Nav.Link onClick={() => navigate("/create-new-project")}>Create new
  project</Nav.Link>
                  <Nav.Link onClick={() => navigate("/my-projects")}>My projects</Nav.Link>
                  <Nav.Link onClick={() => navigate("/inspire-me")}>Inspire me!</Nav.Link>
                </>
              ) : (
                <Nav.Link onClick={() => navigate("/login")}>Login</Nav.Link>
              )}
            </Nav>
            <Nav className="ms-auto">
              {currentUser ? (
                <>
                  <Navbar.Text className="me-3">
                    Welcome, {currentUser.UserName}!
                  </Navbar.Text>
                  <Nav.Link onClick={logout}>Logout</Nav.Link>
                </>
              ) : (
                <Nav.Link onClick={() => navigate("/register")}>Register</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  export default NavBar;