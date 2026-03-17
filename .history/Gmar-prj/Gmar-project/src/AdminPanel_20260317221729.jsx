import React, { useEffect, useState } from 'react';
import NavBar from './NavBar';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import { Badge, Form, InputGroup, Button, Modal, Alert } from 'react-bootstrap';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [makeAdmin, setMakeAdmin] = useState(true);

   // Templates
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'templates'
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Alert modal
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // success or error

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);
    // Access control - check if user is admin or superadmin
    useEffect(() => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (!user.IsAdmin && !user.IsSuperAdmin) {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    }, []);

  useEffect(() => {
    let filtered = users;

    if (searchEmail.trim() !== '') {
      filtered = filtered.filter(user =>
        user.UserEmail.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter(user => user.IsActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(user => !user.IsActive);
    }

    if (filterRole === 'admin') {
      filtered = filtered.filter(user =>  user.IsAdmin && !user.IsSuperAdmin);
    } else if (filterRole === 'user') {
      filtered = filtered.filter(user => !user.IsAdmin && !user.IsSuperAdmin);
    } else if (filterRole === 'super-admin' && currentUser?.IsSuperAdmin) {
      filtered = filtered.filter(user => user.IsSuperAdmin);
    }


    setFilteredUsers(filtered);
  }, [searchEmail, users, filterStatus, filterRole, currentUser]);

  const showAlertModal = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!currentUser) {
      showAlertModal('You must be logged in', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: userToDelete.User_ID,
          adminID: currentUser.User_ID,
          confirmDelete: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowDeleteModal(false);
        showAlertModal('User deleted successfully');
        fetchUsers();
      } else {
        showAlertModal(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

    const handleUpdateStatusClick = async (user, newStatus) => {
      if (!currentUser) {
        showAlertModal('You must be logged in', 'error');
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

      const data = await response.json();

      if (response.ok) {
        showAlertModal(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        showAlertModal(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleResetPasswordClick = (user) => {
    setUserToReset(user);
    setTempPassword('Temp123!');
    setShowResetModal(true);
  };

 const confirmResetPassword = async () => {
      if (!currentUser) {
        showAlertModal('You must be logged in', 'error');
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
        setShowResetModal(false);
        showAlertModal(data.message);
      } else {
        showAlertModal(data.error || 'Reset failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleRoleChangeClick = (user, makeAdmin) => {
    setUserToChangeRole(user);
    setMakeAdmin(makeAdmin);
    setShowRoleModal(true);
  };

const confirmRoleChange = async () => {
      if (!currentUser) {
        showAlertModal('You must be logged in', 'error');
        return;
      }

      try {
        const response = await
  fetch('http://localhost:3001/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: userToChangeRole.User_ID,
          adminID: currentUser.User_ID,
          makeAdmin: makeAdmin
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowRoleModal(false);
        showAlertModal(data.message);
        fetchUsers();
      } else {
        showAlertModal(data.error || 'Role change failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
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

    const handleViewProfile = async (user) => {
      setUserProfile(user);
      setShowProfileModal(true);

      // Fetch user statistics
      try {
        const response = await
  fetch(`http://localhost:3001/api/users/${user.User_ID}/stats`);
        const data = await response.json();
        setUserStats(data);
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
        setUserStats(null);
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>👥 All Users</h2>
          <Badge bg="primary">{filteredUsers.length} Users</Badge>
        </div>

        <div className="d-flex gap-3 mb-3">
          <InputGroup style={{ maxWidth: '400px' }}>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Search email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
          </InputGroup>

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
            <option value="super-admin">Super Admin</option>
            <option value="user">User</option>
          </Form.Select>
        </div>

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
                  {user.IsSuperAdmin && <Badge bg="danger" className="me-2">SuperAdmin</Badge>}
                  {user.IsAdmin && !user.IsSuperAdmin && <Badge bg="danger" className="me-2">Admin</Badge>}
                  {user.IsActive ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}
                </td>
                <td>
                   <div className="d-flex flex-column gap-2">
                     
                  {/* View Profile */}
                  {!(currentUser?.IsAdmin &&
                  !currentUser?.IsSuperAdmin && user.IsSuperAdmin) && (
                                        <Button variant="info" size="sm"
                  onClick={() => handleViewProfile(user)}>
                                          👤 View Profile
                                        </Button>
                                      )}
                    {/* Status Toggle */}
                    {!user.IsSuperAdmin && user.User_ID !== currentUser?.User_ID && (
                      user.IsActive ? (
                        <Button variant="warning" size="sm" onClick={() => handleUpdateStatusClick(user, false)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="success" size="sm" onClick={() => handleUpdateStatusClick(user, true)}>
                          Activate
                        </Button>
                      )
                    )}

                    {/* Reset Password */}
                    {!user.IsSuperAdmin && user.User_ID !== currentUser?.User_ID && (
                      <Button variant="outline-warning" size="sm" onClick={() => handleResetPasswordClick(user)}>
                        Reset Password
                      </Button>
                    )}

                    {/* Delete - only for regular users */}
                    {!user.IsAdmin && !user.IsSuperAdmin && user.User_ID !== currentUser?.User_ID && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(user)}>
                        Delete
                      </Button>
                    )}

                    {/* Make/Remove Admin - Superadmin only */}
                    {currentUser?.IsSuperAdmin && !user.IsSuperAdmin && user.User_ID !== currentUser?.User_ID && (
                      user.IsAdmin ? (
                        <Button variant="outline-secondary" size="sm" onClick={() => handleRoleChangeClick(user, false)}>
                          Remove Admin
                        </Button>
                      ) : (
                        <Button variant="outline-info" size="sm" onClick={() => handleRoleChangeClick(user, true)}>
                          Make Admin
                        </Button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {filteredUsers.length === 0 && <p className="text-center mt-4">No users found.</p>}
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Delete <strong>{userToDelete?.UserName}</strong> ({userToDelete?.UserEmail})?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Reset password for <strong>{userToReset?.UserName}</strong> ({userToReset?.UserEmail})?</p>
          <Form.Group className="mb-3">
            <Form.Label>Temporary Password:</Form.Label>
            <Form.Control
              type="text"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
            />
          </Form.Group>
          <p className="text-warning">User should change this password after logging in.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
          <Button variant="warning" onClick={confirmResetPassword}>Reset Password</Button>
        </Modal.Footer>
      </Modal>

      {/* Role Change Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{makeAdmin ? 'Make Admin' : 'Remove Admin'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {makeAdmin ? 'Grant admin role to' : 'Remove admin role from'} <strong>{userToChangeRole?.UserName}</strong> ({userToChangeRole?.UserEmail})?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button variant={makeAdmin ? 'info' : 'secondary'} onClick={confirmRoleChange}>
            {makeAdmin ? 'Make Admin' : 'Remove Admin'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alert Modal */}
      <Modal show={showAlert} onHide={() => setShowAlert(false)} centered>
        <Modal.Header closeButton className={alertType === 'success' ? 'text-success' : 'text-danger'}>
          <Modal.Title>{alertType === 'success' ? 'Success' : 'Error'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={alertType === 'success' ? 'success' : 'danger'}>
            {alertMessage}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowAlert(false)}>OK</Button>
        </Modal.Footer>
      </Modal>

       {/* View Profile Modal */}
        <Modal show={showProfileModal} onHide={() =>
  setShowProfileModal(false)} centered size="lg">
          <Modal.Header closeButton className="bg-primary
  text-white">
            <Modal.Title>👤 User Profile</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {userProfile && (
              <div>
                {/* User Info */}
                <div className="mb-4">
                  <h5 className="mb-3">📋 Account Information</h5>
                  <Table bordered size="sm">
                    <tbody>
                      <tr>
                        <td><strong>User ID:</strong></td>
                        <td>#{userProfile.User_ID}</td>
                      </tr>
                      <tr>
                        <td><strong>Username:</strong></td>
                        <td>{userProfile.UserName}</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{userProfile.UserEmail}</td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          {userProfile.IsActive ?
                            <Badge bg="success">Active</Badge> :
                            <Badge bg="secondary">Inactive</Badge>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Role:</strong></td>
                        <td>
                          {userProfile.IsSuperAdmin && <Badge
  bg="danger">Super Admin</Badge>}
                          {userProfile.IsAdmin &&
  !userProfile.IsSuperAdmin && <Badge bg="danger">Admin</Badge>}
                          {!userProfile.IsAdmin &&
  !userProfile.IsSuperAdmin && <Badge bg="primary">User</Badge>}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Member Since:</strong></td>
                        <td>{new
  Date(userProfile.CreatedDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td><strong>Last Login:</strong></td>
                        <td>
                          {userProfile.LastLoginDate ?
                            new
  Date(userProfile.LastLoginDate).toLocaleString() :
                            <span
  className="text-muted">Never</span>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>

                {/* Statistics */}
                {userStats && (
                  <div className="mb-4">
                    <h5 className="mb-3">📊 Statistics</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-primary">{userStats?.TotalProjects || 0}</h3>
                            <p className="card-text mb-0">Total
  Projects</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-success">{userStats?.PublishedProjects || 0}</h3>
                            <p className="card-text
  mb-0">Published</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-info">{userStats?.TotalComponents || 0}</h3>
                            <p className="card-text
  mb-0">Components Created</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-warning">{userStats?.TotalExports || 0}</h3>
                            <p className="card-text
  mb-0">Exports</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-secondary">{userStats?.TotalActivities || 0}</h3>
                            <p className="card-text
  mb-0">Activities</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-danger">{userStats?.TotalAuditEntries || 0}</h3>
                            <p className="card-text mb-0">Audit
  Entries</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity placeholder */}
                <div>
                  <h5 className="mb-3">🕒 Recent Activity</h5>
                  <p className="text-muted">Activity history can be
   fetched from audit log if needed.</p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() =>
  setShowProfileModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>

       
    </div>
  );
}
