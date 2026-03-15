  import React, { useEffect, useState } from 'react';
  import NavBar from './NavBar';
  import Table from 'react-bootstrap/Table';
  import Container from 'react-bootstrap/Container';
  import { Badge, Form, InputGroup, Button } from
  'react-bootstrap';

export default function AdminPanel() {

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchEmail, setSearchEmail] = useState('');

   useEffect(() => {
      fetchUsers();
    }, []);

        useEffect(() => {
      if (searchEmail.trim() === '') {
        setFilteredUsers(users);
      } else {
        const filtered = users.filter(user =>

  user.UserEmail.toLowerCase().includes(searchEmail.toLowerCase())
        );
        setFilteredUsers(filtered);
      }
    }, [searchEmail, users]);



    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await
  fetch('http://localhost:3001/api/users');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch users');
        }

        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (loading) return (
      <div>
        <NavBar />
        <div className="text-center mt-5">
          <h3>Loading users...</h3>
        </div>
      </div>
    );

    if (error) return (
      <div>
        <NavBar />
        <Container className="mt-5">
          <div className="alert alert-danger">Error: {error}</div>
        </Container>
      </div>
    );
       

 return (
      <div>
        <NavBar />
        <Container className="mt-5">
          <div className="d-flex justify-content-between
  align-items-center mb-4">
            <h2>👥 All Registered Users</h2>
            <Badge bg="primary"
  className="fs-6">{filteredUsers.length} Users</Badge>
          </div>

          {/* Search Box */}
          <InputGroup className="mb-4" style={{ maxWidth: '400px'
  }}>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            {searchEmail && (
              <Button variant="outline-secondary" onClick={() =>
  setSearchEmail('')}>
                Clear
              </Button>
            )}
          </InputGroup>

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
              {filteredUsers.map((user) => (
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
                    <>
                      <Badge bg="info">User</Badge>
                      <td>
                        <button>Delete</button>
                      </td>                   
                      </>
                    )}
                  </td>
                 
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center text-muted mt-4">
              <h4>No users found matching "{searchEmail}"</h4>
            </div>
          )}
        </Container>
      </div>
    );
  }