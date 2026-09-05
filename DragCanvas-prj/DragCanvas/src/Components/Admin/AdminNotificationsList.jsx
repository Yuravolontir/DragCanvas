import { Badge, Button, Table } from 'react-bootstrap';

const TYPE_BADGES = {
  newsletter: { label: 'Newsletter', color: 'primary' },
  birthday: { label: 'Birthday', color: 'warning' },
  event: { label: 'Event', color: 'info' },
  automated: { label: 'Automated', color: 'secondary' },
};

const STATUS_BADGES = {
  draft: { label: 'Draft', color: 'secondary' },
  scheduled: { label: 'Scheduled', color: 'info' },
  sent: { label: 'Sent', color: 'success' },
  failed: { label: 'Failed', color: 'danger' },
};

function readRecipientCount(recipientIds) {
  if (!recipientIds) return 0;

  try {
    const ids = JSON.parse(recipientIds);
    return Array.isArray(ids) ? ids.length : 0;
  } catch {
    return 0;
  }
}

function ValueBadge({ value, options }) {
  const badge = options[value];
  return badge ? <Badge bg={badge.color}>{badge.label}</Badge> : <span>-</span>;
}

function RecipientBadge({ notification }) {
  if (notification.RecipientType === 'all') {
    return <Badge bg="success">All Users</Badge>;
  }

  if (notification.RecipientType === 'selected') {
    const recipientCount = readRecipientCount(notification.RecipientIDs);
    return <Badge bg="info">Selected ({recipientCount})</Badge>;
  }

  if (notification.RecipientType === 'automated') {
    return <Badge bg="warning">Automated</Badge>;
  }

  return <span>-</span>;
}

/** Lists newsletters and automatic notifications already created by admins. */
export default function AdminNotificationsList({ notifications, loading, onCompose }) {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Notifications</h4>
        <Button variant="primary" onClick={onCompose}>Compose Newsletter</Button>
      </div>

      {loading && <p className="text-center mt-4">Loading notifications...</p>}
      {!loading && notifications.length === 0 && (
        <p className="text-center mt-4">No notifications found.</p>
      )}

      {!loading && notifications.length > 0 && (
        <Table responsive striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Recipients</th>
              <th>Status</th>
              <th>Stats</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr key={notification.Notification_ID}>
                <td>#{notification.Notification_ID}</td>
                <td>{notification.Subject}</td>
                <td><ValueBadge value={notification.NotificationType} options={TYPE_BADGES} /></td>
                <td><RecipientBadge notification={notification} /></td>
                <td><ValueBadge value={notification.Status} options={STATUS_BADGES} /></td>
                <td>
                  <small>
                    Sent: {notification.SentCount || 0}<br />
                    Opened: {notification.OpenedCount || 0}<br />
                    Failed: {notification.FailedCount || 0}
                  </small>
                </td>
                <td>{new Date(notification.CreatedDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
