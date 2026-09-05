import { useState } from 'react';
import { Badge, Button, Form, Modal } from 'react-bootstrap';

function readTemplateVariables(template) {
  if (!template?.Variables) return [];

  try {
    const variables = JSON.parse(template.Variables);
    return Array.isArray(variables) ? variables : [];
  } catch {
    return [];
  }
}

/** Form for creating or editing a reusable notification message. */
export default function NotificationTemplateForm({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    templateName: template?.TemplateName || '',
    templateType: template?.TemplateType || 'custom',
    subject: template?.Subject || '',
    message: template?.Message || '',
    variables: readTemplateVariables(template),
  });

  const updateField = (fieldName, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  const addVariable = () => {
    const variableName = window.prompt('Enter variable name (e.g., username, date):');
    const cleanedName = variableName?.trim();

    if (!cleanedName || formData.variables.includes(cleanedName)) return;
    updateField('variables', [...formData.variables, cleanedName]);
  };

  const removeVariable = (variableIndex) => {
    const remainingVariables = formData.variables.filter(
      (_variable, index) => index !== variableIndex,
    );
    updateField('variables', remainingVariables);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Template Name *</Form.Label>
        <Form.Control
          type="text"
          value={formData.templateName}
          onChange={(event) => updateField('templateName', event.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Template Type *</Form.Label>
        <Form.Select
          value={formData.templateType}
          onChange={(event) => updateField('templateType', event.target.value)}
        >
          <option value="birthday">Birthday</option>
          <option value="event">Event</option>
          <option value="newsletter">Newsletter</option>
          <option value="custom">Custom</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Subject *</Form.Label>
        <Form.Control
          type="text"
          value={formData.subject}
          onChange={(event) => updateField('subject', event.target.value)}
          placeholder="e.g., Happy Birthday {username}!"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Message *</Form.Label>
        <Form.Control
          as="textarea"
          rows={6}
          value={formData.message}
          onChange={(event) => updateField('message', event.target.value)}
          placeholder="Enter message content... Use {variable} for placeholders"
          required
        />
        <Form.Text muted>
          HTML allowed. Common variables: {'{username}'}, {'{date}'}, {'{event_name}'}
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Variables (Placeholders)</Form.Label>
        <div className="d-flex gap-2 flex-wrap">
          {formData.variables.map((variable, index) => (
            <Badge key={`${variable}-${index}`} bg="info" className="d-flex align-items-center">
              {`{${variable}}`}
              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                aria-label={`Remove ${variable}`}
                onClick={() => removeVariable(index)}
              />
            </Badge>
          ))}
          <Button variant="outline-primary" size="sm" type="button" onClick={addVariable}>
            + Add Variable
          </Button>
        </div>
        <Form.Text muted>Use the remove button beside a placeholder to delete it.</Form.Text>
      </Form.Group>

      <Modal.Footer>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {template ? 'Update' : 'Create'} Template
        </Button>
      </Modal.Footer>
    </Form>
  );
}
