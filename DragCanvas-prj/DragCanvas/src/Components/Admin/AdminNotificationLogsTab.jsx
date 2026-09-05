import { Badge, Button, Form, Table } from 'react-bootstrap';

const LOG_STATUS_BADGES = {
  delivered: { label: 'Delivered', color: 'success' },
  viewed: { label: 'Viewed', color: 'primary' },
  failed: { label: 'Failed', color: 'danger' },
};

function LogStatusBadge({ status }) {
  const badge = LOG_STATUS_BADGES[status];
  return badge ? <Badge bg={badge.color}>{badge.label}</Badge> : <span>-</span>;
}

function StatCard({ label, value, colorClass = '' }) {
  return (
    <div className="flex-fill p-3 border rounded bg-light">
      <h6 className="mb-1">{label}</h6>
      <h3 className={`mb-0 ${colorClass}`}>{value || 0}</h3>
    </div>
  );
}

/** Shows delivery totals, filters, and the detailed notification history. */
export default function AdminNotificationLogsTab({
  logs,
  stats,
  filters,
  loading,
  onFiltersChange,
  onSearch,
}) {
  const updateFilter = (fieldName, value) => {
    onFiltersChange({ ...filters, [fieldName]: value });
  };

  return (
    <>
      <h4 className="mb-3">Notification Logs</h4>

      <div className="d-flex gap-3 mb-3 dc-admin-row">
        <StatCard label="Total" value={stats.Total} />
        <StatCard label="Delivered" value={stats.Delivered} colorClass="text-success" />
        <StatCard label="Viewed" value={stats.Viewed} colorClass="text-primary" />
        <StatCard label="Failed" value={stats.Failed} colorClass="text-danger" />
      </div>

      <div className="d-flex gap-2 mb-3 dc-admin-row">
        <Form.Select
          className="dc-admin-select"
          aria-label="Filter logs by status"
          value={filters.status}
          onChange={(event) => updateFilter('status', event.target.value)}
        >
          <option value="">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="viewed">Viewed</option>
          <option value="failed">Failed</option>
        </Form.Select>
        <Form.Control
          className="dc-admin-input"
          type="search"
          aria-label="Search notification logs"
          placeholder="Search username or email..."
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <Button variant="primary" onClick={onSearch}>Search</Button>
      </div>

      {loading && <p className="text-center mt-4">Loading logs...</p>}
      {!loading && logs.length === 0 && <p className="text-center mt-4">No logs found.</p>}

      {!loading && logs.length > 0 && (
        <Table responsive striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.Log_ID}>
                <td>{new Date(log.DeliveredDate).toLocaleString()}</td>
                <td>
                  <div>{log.UserName}</div>
                  <small className="text-muted">{log.UserEmail}</small>
                </td>
                <td>{log.Subject || '-'}</td>
                <td><LogStatusBadge status={log.Status} /></td>
                <td><small className="text-danger">{log.ErrorMessage || '-'}</small></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
