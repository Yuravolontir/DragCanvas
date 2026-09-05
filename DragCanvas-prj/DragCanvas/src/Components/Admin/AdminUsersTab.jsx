import { Badge, Button, Form, InputGroup, Table } from 'react-bootstrap';

/** Displays user filters, user roles, and the actions available to an admin. */
export default function AdminUsersTab({
  currentUser,
  users,
  searchEmail,
  statusFilter,
  roleFilter,
  onSearchChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onViewProfile,
  onStatusChange,
  onResetPassword,
  onDelete,
  onRoleChange,
}) {
  const canManageUser = (user) => !user.IsSuperAdmin && user.User_ID !== currentUser.User_ID;

  return (
    <>
      <div className="d-flex gap-3 mb-3 dc-admin-row">
        <InputGroup className="dc-admin-search">
          <InputGroup.Text aria-hidden="true">search</InputGroup.Text>
          <Form.Control
            type="search"
            aria-label="Search users by email"
            placeholder="Search email..."
            value={searchEmail}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </InputGroup>

        <Form.Select
          className="dc-admin-select"
          aria-label="Filter users by status"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>

        <Form.Select
          className="dc-admin-select"
          aria-label="Filter users by role"
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          {currentUser.IsSuperAdmin && <option value="super-admin">Super Admin</option>}
        </Form.Select>
      </div>

      <Table responsive striped bordered hover>
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
          {users.map((user) => (
            <tr key={user.User_ID}>
              <td>#{user.User_ID}</td>
              <td>{user.UserName}</td>
              <td>{user.UserEmail}</td>
              <td>
                {user.IsSuperAdmin && <Badge bg="danger" className="me-2">Super Admin</Badge>}
                {user.IsAdmin && !user.IsSuperAdmin && (
                  <Badge bg="danger" className="me-2">Admin</Badge>
                )}
                <Badge bg={user.IsActive ? 'success' : 'secondary'}>
                  {user.IsActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td>
                <div className="d-flex flex-column gap-2">
                  {(currentUser.IsSuperAdmin || !user.IsSuperAdmin) && (
                    <Button variant="info" size="sm" onClick={() => onViewProfile(user)}>
                      View Profile
                    </Button>
                  )}

                  {canManageUser(user) && (
                    <>
                      <Button
                        variant={user.IsActive ? 'warning' : 'success'}
                        size="sm"
                        onClick={() => onStatusChange(user, !user.IsActive)}
                      >
                        {user.IsActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline-warning" size="sm" onClick={() => onResetPassword(user)}>
                        Reset Password
                      </Button>
                    </>
                  )}

                  {canManageUser(user) && !user.IsAdmin && (
                    <Button variant="outline-danger" size="sm" onClick={() => onDelete(user)}>
                      Delete
                    </Button>
                  )}

                  {currentUser.IsSuperAdmin && canManageUser(user) && (
                    <Button
                      variant={user.IsAdmin ? 'outline-secondary' : 'outline-info'}
                      size="sm"
                      onClick={() => onRoleChange(user, !user.IsAdmin)}
                    >
                      {user.IsAdmin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {users.length === 0 && <p className="text-center mt-4">No users found.</p>}
    </>
  );
}
