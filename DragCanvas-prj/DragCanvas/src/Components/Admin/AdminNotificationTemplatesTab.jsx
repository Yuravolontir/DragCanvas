import { Badge, Button, Table } from 'react-bootstrap';

const TEMPLATE_TYPE_BADGES = {
  birthday: { label: 'Birthday', color: 'warning' },
  event: { label: 'Event', color: 'info' },
  newsletter: { label: 'Newsletter', color: 'primary' },
  custom: { label: 'Custom', color: 'secondary' },
};

function TemplateTypeBadge({ type }) {
  const badge = TEMPLATE_TYPE_BADGES[type];
  return badge ? <Badge bg={badge.color}>{badge.label}</Badge> : <span>-</span>;
}

/** Manages reusable message templates used by the notification system. */
export default function AdminNotificationTemplatesTab({
  templates,
  loading,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}) {
  const requestDelete = (templateId) => {
    if (window.confirm('Delete this template?')) {
      onDelete(templateId);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Notification Templates</h4>
        <Button variant="primary" onClick={onAdd}>Add Template</Button>
      </div>

      {loading && <p className="text-center mt-4">Loading templates...</p>}
      {!loading && templates.length === 0 && (
        <p className="text-center mt-4">No templates found.</p>
      )}

      {!loading && templates.length > 0 && (
        <Table responsive striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Variables</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.Template_ID}>
                <td>#{template.Template_ID}</td>
                <td>{template.TemplateName}</td>
                <td><TemplateTypeBadge type={template.TemplateType} /></td>
                <td>{template.Subject}</td>
                <td><small>{template.Variables || '-'}</small></td>
                <td>
                  <Badge bg={template.IsActive ? 'success' : 'secondary'}>
                    {template.IsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Button variant="outline-primary" size="sm" onClick={() => onEdit(template)}>
                      Edit
                    </Button>
                    <Button
                      variant={template.IsActive ? 'outline-warning' : 'outline-success'}
                      size="sm"
                      onClick={() => onToggle(template.Template_ID, !template.IsActive)}
                    >
                      {template.IsActive ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => requestDelete(template.Template_ID)}
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
