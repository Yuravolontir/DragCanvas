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
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState(null);

   useEffect(() => {
      fetchUsers();
    }, []);



  useEffect(() => {
    let filtered = users;

    // Filter by email
    if (searchEmail.trim() !== '') {
      filtered = filtered.filter(user =>

  user.UserEmail.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    // Filter by status (string based)
    if (filterStatus === 'active') {
      filtered = filtered.filter(user => user.IsActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(user => !user.IsActive);
    }

    // Filter by role (string based)
    if (filterRole === 'admin') {
      filtered = filtered.filter(user => user.IsAdmin);
    } else if (filterRole === 'user') {
      filtered = filtered.filter(user => !user.IsAdmin);
    }

    setFilteredUsers(filtered);
  }, [searchEmail, users, filterStatus, filterRole]);

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

  const handleResetPasswordClick = (user) => {
    setUserToReset(user);
    setTempPassword('Temp123!'); // Default temp password
    setShowResetModal(true);
  };

  const confirmResetPassword = async () => {
    const currentUser =
  JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
      alert('You must be logged in');
      return;
    }

    try {
      const response = await
  fetch('http://localhost:3001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: userToReset.User_ID,
          adminID: currentUser.User_ID,
          newPassword: tempPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setShowResetModal(false);
      } else {
        alert('Error: ' + (data.error || 'Reset failed'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

   // Add this function:
  const handleRoleChangeClick = (user, makeAdmin) => {
    const currentUser =
  JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser.IsSuperAdmin) {
      alert('Only superadmin can change roles');
      return;
    }

    const action = makeAdmin ? 'make admin' : 'remove admin';
    const confirmed = window.confirm(`${action} for
  ${user.UserName}?`);

    if (!confirmed) return;

    fetch('http://localhost:3001/api/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetID: user.User_ID,
        adminID: currentUser.User_ID,
        makeAdmin: makeAdmin
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        fetchUsers();
      } else {
        alert('Error: ' + data.error);
      }
    })
    .catch(err => alert('Error: ' + err.message));
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

 <InputGroup className="mb-3 me-3">
    <InputGroup.Text>🔍</InputGroup.Text>
    <Form.Control
      placeholder="Search email..."
      value={searchEmail}
      onChange={(e) => setSearchEmail(e.target.value)}
    />
      {/* Status Filters */}
  <Form.Select
    style={{ width: '150px' }}
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
  >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </Form.Select>

  <Form.Select
    style={{ width: '150px' }}
    value={filterRole}
    onChange={(e) => setFilterRole(e.target.value)}
  >
    <option value="all">All Roles</option>
    <option value="admin">Admin</option>
    <option value="user">User</option>
  </Form.Select>
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
                      <p></p>
                {!user.IsAdmin && (
                    <Button variant="warning" size="sm" onClick={() =>
                  handleResetPasswordClick(user)}>
                      Reset Pwd
                    </Button>
                  )}
                    {/* Superadmin only - Make/Remove Admin */}
                    {currentUser?.IsSuperAdmin && user.User_ID !==
                    currentUser?.User_ID && (
                      <p></p>
                    )}
                    {currentUser?.IsSuperAdmin && !user.IsAdmin && user.User_ID !==
                    currentUser?.User_ID && (
                      <Button variant="info" size="sm" onClick={() =>
                    handleRoleChangeClick(user, true)}>
                        Make Admin
                      </Button>
                    )}
                    {currentUser?.IsSuperAdmin && user.IsAdmin && user.User_ID !==
                    currentUser?.User_ID && (
                      <Button variant="secondary" size="sm" onClick={() =>
                    handleRoleChangeClick(user, false)}>
                        Remove Admin
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

         {/* Reset Password Modal */}
  <Modal show={showResetModal} onHide={() =>
  setShowResetModal(false)} centered>
    <Modal.Header closeButton>
      <Modal.Title>Reset Password</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>Reset password for
  <strong>{userToReset?.UserName}</strong>
  ({userToReset?.UserEmail})?</p>
      <Form.Group className="mb-3">
        <Form.Label>Temporary Password:</Form.Label>
        <Form.Control
          type="text"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
        />
      </Form.Group>
      <p className="text-warning">User should change this password
  after logging in.</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() =>
  setShowResetModal(false)}>Cancel</Button>
      <Button variant="warning"
  onClick={confirmResetPassword}>Reset Password</Button>
    </Modal.Footer>
  </Modal>
      </div>
    );
  }
