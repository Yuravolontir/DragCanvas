  import React, { useEffect, useState } from 'react';
  import NavBar from './NavBar';
  import Table from 'react-bootstrap/Table';
  import Container from 'react-bootstrap/Container';
  import { Badge, Form, InputGroup, Button, Modal } from
  'react-bootstrap';

export default function AdminPanel() {

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchEmail, setSearchEmail] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);


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

    const handleDeleteClick = (user) => {
      setUserToDelete(user);
      setShowDeleteModal(true);
    };

  const confirmDelete = async () => {
    const currentUser =
  JSON.parse(localStorage.getItem('currentUser'));

    try {
      const response = await
  fetch('http://localhost:3001/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: userToDelete.User_ID,
          adminID: currentUser.User_ID,
          confirmDelete: true
        })
      });

      if (response.ok) {
        setShowDeleteModal(false);
        fetchUsers();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

    const handleUpdateStatusClick = async (user, newStatus) => {
      const currentUser =
  JSON.parse(localStorage.getItem('currentUser'));

      if (!currentUser) {
        alert('You must be logged in');
        return;
      }

      try {
        const response = await
  fetch('http://localhost:3001/api/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetID: user.User_ID,
            adminID: currentUser.User_ID,
            newStatus: newStatus
          })
        });

        if (response.ok) {
          fetchUsers();
        } else {
          const data = await response.json();
          alert('Error: ' + (data.error || 'Update failed'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };

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
            <h2>👥 All Users</h2>
            <Badge bg="primary">{filteredUsers.length}
  Users</Badge>
          </div>

          <InputGroup className="mb-3" style={{ maxWidth: '400px'
  }}>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Search email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
          </InputGroup>

          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.User_ID}>
                  <td>#{user.User_ID}</td>
                  <td>{user.UserName}</td>
                  <td>{user.UserEmail}</td>
                  <td>
                    {user.IsActive ? <Badge
  bg="success">Active</Badge> : <Badge
  bg="secondary">Inactive</Badge>}
                    {user.IsAdmin && <Badge bg="danger"
  className="ms-2">Admin</Badge>}
                  </td>
                  <td>
                    {!user.IsAdmin && (
                      <Button variant="danger" size="sm"
  onClick={() => handleDeleteClick(user)}>
                        Delete
                      </Button>
                    )}
                    <p></p>
                    {(user.IsActive && !user.IsAdmin) && (
                      <Button variant="danger" size="sm"
  onClick={() => handleUpdateStatusClick(user,false)}>
                        Deactivate 
                      </Button>
                    )}
                    {(!user.IsActive && !user.IsAdmin) && (
                      <Button variant="success" size="sm"
  onClick={() => handleUpdateStatusClick(user,true)}>
                        Activate 
                      </Button>
                    )}

                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredUsers.length === 0 && <p className="text-center
  mt-4">No users found.</p>}
        </Container>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() =>
  setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Delete <strong>{userToDelete?.UserName}</strong>
  ({userToDelete?.UserEmail})?</p>
          <p className="text-danger">This action cannot be
  undone.</p>
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
