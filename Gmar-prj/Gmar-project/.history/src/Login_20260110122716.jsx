import React from 'react'

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { useNavigate } from "react-router-dom";

export default function Login(props) {
  const navigate = useNavigate();


  return (
    <div>
          <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate("/")}>Home</Nav.Link>  
            <Nav.Link onClick={() => navigate("/login")}>Login</Nav.Link>
            <Nav.Link onClick={() => navigate("/register")}>Register</Nav.Link>  
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>

     <h1>Please login or register</h1>
      <form>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
