import { Badge, Button, Table } from 'react-bootstrap';

function TemplateStatus({ isVisible }) {
  return (
    <Badge bg={isVisible ? 'success' : 'secondary'}>
      {isVisible ? 'Visible' : 'Hidden'}
    </Badge>
  );
}

/** Shows every editor template and lets an admin control its visibility. */
export default function AdminTemplatesTab({ templates, loading, onVisibilityChange }) {
  if (loading) {
    return <p className="text-center mt-4">Loading templates...</p>;
  }

  if (templates.length === 0) {
    return <p className="text-center mt-4">No templates found.</p>;
  }

  return (
    <Table responsive striped bordered hover>
      <thead className="table-dark">
        <tr>
          <th>ID</th>
          <th>Thumbnail</th>
          <th>Name</th>
          <th>Category</th>
          <th>Components</th>
          <th>Created By</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {templates.map((template) => (
          <tr key={template.Template_ID}>
            <td>#{template.Template_ID}</td>
            <td>
              {template.ThumbnailURL ? (
                <img
                  className="dc-admin-template-thumbnail"
                  src={template.ThumbnailURL}
                  alt={`Preview of ${template.TemplateName}`}
                />
              ) : (
                <span className="text-muted">No image</span>
              )}
            </td>
            <td>{template.TemplateName}</td>
            <td><Badge bg="info">{template.Category}</Badge></td>
            <td>{template.ComponentCount}</td>
            <td>{template.CreatedByName}</td>
            <td><TemplateStatus isVisible={template.IsActive} /></td>
            <td>
              <Button
                variant={template.IsActive ? 'warning' : 'success'}
                size="sm"
                onClick={() => onVisibilityChange(template.Template_ID, template.IsActive)}
              >
                {template.IsActive ? 'Hide' : 'Show'}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
