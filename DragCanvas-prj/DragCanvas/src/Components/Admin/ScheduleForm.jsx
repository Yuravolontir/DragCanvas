import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

function readRecipientIds(schedule) {
  if (!schedule?.RecipientIDs) return [];

  try {
    const recipientIds = JSON.parse(schedule.RecipientIDs);
    return Array.isArray(recipientIds) ? recipientIds : [];
  } catch {
    return [];
  }
}

function createInitialFormData(schedule) {
  return {
    scheduleName: schedule?.ScheduleName || '',
    notificationType: schedule?.NotificationType || 'custom',
    frequency: schedule?.Frequency || 'daily',
    scheduleTime: schedule?.ScheduleTime || '09:00',
    scheduleDay: schedule?.ScheduleDay || 1,
    templateId: schedule?.Template_ID || '',
    recipientType: schedule?.RecipientType || 'all',
    recipientIds: readRecipientIds(schedule),
    messageOverride: schedule?.MessageOverride || '',
  };
}

/** Form for creating or editing an automatic notification schedule. */
export default function ScheduleForm({ schedule, users, templates, onSave, onCancel }) {
  const [formData, setFormData] = useState(() => createInitialFormData(schedule));

  const activeUsers = users.filter((user) => user.IsActive);
  const activeTemplates = templates.filter((template) => template.IsActive);
  const needsScheduleDay = ['weekly', 'monthly'].includes(formData.frequency);

  const updateField = (fieldName, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
  };

  const toggleRecipient = (userId, shouldBeSelected) => {
    const nextRecipientIds = shouldBeSelected
      ? [...formData.recipientIds, userId]
      : formData.recipientIds.filter((recipientId) => recipientId !== userId);

    updateField('recipientIds', nextRecipientIds);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Schedule Name *</Form.Label>
        <Form.Control
          type="text"
          value={formData.scheduleName}
          onChange={(event) => updateField('scheduleName', event.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Notification Type *</Form.Label>
        <Form.Select
          value={formData.notificationType}
          onChange={(event) => updateField('notificationType', event.target.value)}
        >
          <option value="custom">Custom Message</option>
          <option value="birthday">Birthday Greeting</option>
          <option value="event">Event Reminder</option>
        </Form.Select>
      </Form.Group>

      <div className="d-flex gap-3 mb-3 dc-admin-row">
        <Form.Group className="flex-fill">
          <Form.Label>Frequency *</Form.Label>
          <Form.Select
            value={formData.frequency}
            onChange={(event) => updateField('frequency', event.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="flex-fill">
          <Form.Label>Time *</Form.Label>
          <Form.Control
            type="time"
            value={formData.scheduleTime}
            onChange={(event) => updateField('scheduleTime', event.target.value)}
            required
          />
        </Form.Group>
      </div>

      {needsScheduleDay && (
        <Form.Group className="mb-3">
          <Form.Label>
            Day ({formData.frequency === 'weekly' ? '1-7 (Sun-Sat)' : '1-31'}) *
          </Form.Label>
          <Form.Control
            type="number"
            min={1}
            max={formData.frequency === 'weekly' ? 7 : 31}
            value={formData.scheduleDay}
            onChange={(event) => updateField('scheduleDay', Number(event.target.value))}
            required
          />
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Recipients *</Form.Label>
        <Form.Select
          value={formData.recipientType}
          onChange={(event) => updateField('recipientType', event.target.value)}
        >
          <option value="all">All Users</option>
          <option value="selected">Selected Users</option>
        </Form.Select>
      </Form.Group>

      {formData.recipientType === 'selected' && (
        <Form.Group className="mb-3">
          <Form.Label>Select Users</Form.Label>
          <div className="dc-admin-scroll-box">
            {activeUsers.map((user) => (
              <Form.Check
                key={user.User_ID}
                type="checkbox"
                label={`${user.UserName} (${user.UserEmail})`}
                checked={formData.recipientIds.includes(user.User_ID)}
                onChange={(event) => toggleRecipient(user.User_ID, event.target.checked)}
              />
            ))}
          </div>
          <Form.Text muted>{formData.recipientIds.length} user(s) selected</Form.Text>
        </Form.Group>
      )}

      {formData.notificationType === 'custom' && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Or Use Template</Form.Label>
            <Form.Select
              value={formData.templateId}
              onChange={(event) => updateField('templateId', event.target.value)}
            >
              <option value="">No Template</option>
              {activeTemplates.map((template) => (
                <option key={template.Template_ID} value={template.Template_ID}>
                  {template.TemplateName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Message Override (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.messageOverride}
              onChange={(event) => updateField('messageOverride', event.target.value)}
              placeholder="Enter custom message or leave blank to use template..."
            />
            <Form.Text muted>HTML allowed. Use {'{username}'} for the user's name.</Form.Text>
          </Form.Group>
        </>
      )}

      <Modal.Footer>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {schedule ? 'Update' : 'Create'} Schedule
        </Button>
      </Modal.Footer>
    </Form>
  );
}
