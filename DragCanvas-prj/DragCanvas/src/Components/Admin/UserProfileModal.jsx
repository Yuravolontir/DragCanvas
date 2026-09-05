import { Badge, Button, Modal, Table } from 'react-bootstrap';

const PROFILE_STATS = [
  { field: 'TotalProjects', label: 'Total Projects', color: 'primary' },
  { field: 'PublishedProjects', label: 'Published', color: 'success' },
  { field: 'TotalComponents', label: 'Components Created', color: 'info' },
  { field: 'TotalExports', label: 'Exports', color: 'warning' },
  { field: 'TotalActivities', label: 'Activities', color: 'secondary' },
  { field: 'TotalAuditEntries', label: 'Audit Entries', color: 'danger' },
];

function UserRoleBadge({ user }) {
  if (user.IsSuperAdmin) return <Badge bg="danger">Super Admin</Badge>;
  if (user.IsAdmin) return <Badge bg="danger">Admin</Badge>;
  return <Badge bg="primary">User</Badge>;
}

function UserStatistics({ statistics }) {
  if (!statistics) return null;

  return (
    <div className="mb-4">
      <h5 className="mb-3">Statistics</h5>
      <div className="row g-3">
        {PROFILE_STATS.map((stat) => (
          <div className="col-md-4" key={stat.field}>
            <div className="card text-center">
              <div className="card-body">
                <h3 className={`text-${stat.color}`}>{statistics[stat.field] || 0}</h3>
                <p className="card-text mb-0">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full account details shown when an admin selects View Profile. */
export default function UserProfileModal({ show, user, statistics, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>User Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {user && (
          <>
            <div className="mb-4">
              <h5 className="mb-3">Account Information</h5>
              <Table responsive bordered size="sm">
                <tbody>
                  <tr><td><strong>User ID:</strong></td><td>#{user.User_ID}</td></tr>
                  <tr><td><strong>Username:</strong></td><td>{user.UserName}</td></tr>
                  <tr><td><strong>Email:</strong></td><td>{user.UserEmail}</td></tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td>
                      <Badge bg={user.IsActive ? 'success' : 'secondary'}>
                        {user.IsActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                  <tr><td><strong>Role:</strong></td><td><UserRoleBadge user={user} /></td></tr>
                  <tr>
                    <td><strong>Member Since:</strong></td>
                    <td>{new Date(user.CreatedDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Last Login:</strong></td>
                    <td>
                      {user.LastLoginDate
                        ? new Date(user.LastLoginDate).toLocaleString()
                        : <span className="text-muted">Never</span>}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>

            <UserStatistics statistics={statistics} />

            <div>
              <h5 className="mb-3">Recent Activity</h5>
              <p className="text-muted">Activity history can be fetched from the audit log.</p>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
