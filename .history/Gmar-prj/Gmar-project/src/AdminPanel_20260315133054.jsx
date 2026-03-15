  import React, { useEffect, useState } from 'react';
  import NavBar from './NavBar';
  import Table from 'react-bootstrap/Table';
  import Container from 'react-bootstrap/Container';
  import { Badge } from 'react-bootstrap';

export default function AdminPanel() {

 const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
    const login = async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        setCurrentUser(data.user);
        setIsAdmin(data.admin);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('isAdmin', JSON.stringify(data.admin));
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    };


  
  return (

<div>
        <NavBar />
        <Container className="mt-5">
          <div className="d-flex justify-content-between
  align-items-center mb-4">
            <h2>👥 All Registered Users</h2>
            <Badge bg="primary" className="fs-6">{users.length}
  Users</Badge>
          </div>

          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.User_ID}>
                  <td>#{user.User_ID}</td>
                  <td>
                    <strong>{user.UserName}</strong>
                  </td>
                  <td>{user.UserEmail}</td>
                  <td>
                    {user.IsActive ? (
                      <Badge bg="success">Active</Badge>
                    ) : (
                      <Badge bg="secondary">Inactive</Badge>
                    )}
                  </td>
                  <td>
                    {user.IsAdmin ? (
                      <Badge bg="danger">Admin</Badge>
                    ) : (
                      <Badge bg="info">User</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {users.length === 0 && (
            <div className="text-center text-muted mt-4">
              <h4>No users registered yet.</h4>
            </div>
          )}
        </Container>
      </div>
    
   

  )
}
