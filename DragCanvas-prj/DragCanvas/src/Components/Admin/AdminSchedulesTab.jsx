import { Badge, Button, Table } from 'react-bootstrap';

const SCHEDULE_TYPE_BADGES = {
  birthday: { label: 'Birthday', color: 'warning' },
  event: { label: 'Event', color: 'info' },
  custom: { label: 'Custom', color: 'secondary' },
};

function ScheduleTypeBadge({ type }) {
  const badge = SCHEDULE_TYPE_BADGES[type];
  return badge ? <Badge bg={badge.color}>{badge.label}</Badge> : <span>-</span>;
}

/** Displays automatic notification schedules and their available actions. */
export default function AdminSchedulesTab({
  schedules,
  loading,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}) {
  const requestDelete = (scheduleId) => {
    if (window.confirm('Delete this schedule?')) {
      onDelete(scheduleId);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Notification Schedules</h4>
        <Button variant="primary" onClick={onAdd}>Add Schedule</Button>
      </div>

      {loading && <p className="text-center mt-4">Loading schedules...</p>}
      {!loading && schedules.length === 0 && (
        <p className="text-center mt-4">No schedules found.</p>
      )}

      {!loading && schedules.length > 0 && (
        <Table responsive striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Frequency</th>
              <th>Time</th>
              <th>Next Run</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.Schedule_ID}>
                <td>#{schedule.Schedule_ID}</td>
                <td>{schedule.ScheduleName}</td>
                <td><ScheduleTypeBadge type={schedule.NotificationType} /></td>
                <td>{schedule.Frequency}</td>
                <td>{schedule.ScheduleTime}</td>
                <td>
                  {schedule.NextRunDate
                    ? new Date(schedule.NextRunDate).toLocaleString()
                    : '-'}
                </td>
                <td>
                  <Badge bg={schedule.IsActive ? 'success' : 'secondary'}>
                    {schedule.IsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Button variant="outline-primary" size="sm" onClick={() => onEdit(schedule)}>
                      Edit
                    </Button>
                    <Button
                      variant={schedule.IsActive ? 'outline-warning' : 'outline-success'}
                      size="sm"
                      onClick={() => onToggle(schedule.Schedule_ID, !schedule.IsActive)}
                    >
                      {schedule.IsActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => requestDelete(schedule.Schedule_ID)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
