import React from 'react'

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { useNavigate } from "react-router-dom";
 import { useUserContext } from './UserContextProvider';

export default function Register(props) {

  const navigate = useNavigate();

      const { login, loading, error } = useUserContext();
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [loginError, setLoginError] = useState('');
     
      
      const handleSubmit = async (e) => {
      e.preventDefault();
      const result = await login(username, password);
      if (result.success) {
        navigate('/create-new-project');
      } else {
        setLoginError(result.error);
      }
    };

  return (
    <div>          <Navbar expand="lg" className="bg-body-tertiary">
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

    <h1>Please register</h1>
      <form>
        <input type="text" placeholder="Username" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <input type="password" placeholder="Confirm password" />
        <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
            </button>
      </form>
       {( error) && <p style={{ color: 'red' }}>{ error}</p>}
    </div>
  )
}
