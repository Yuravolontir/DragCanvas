import { Button, Form, Modal } from 'react-bootstrap';

/** Form used by an admin to send a newsletter to all or selected users. */
export default function NewsletterModal({
  show,
  users,
  subject,
  message,
  recipientType,
  selectedRecipientIds,
  sending,
  onSubjectChange,
  onMessageChange,
  onRecipientTypeChange,
  onSelectedRecipientsChange,
  onSend,
  onClose,
}) {
  const activeUsers = users.filter((user) => user.IsActive);

  const toggleRecipient = (userId, shouldBeSelected) => {
    const nextIds = shouldBeSelected
      ? [...selectedRecipientIds, userId]
      : selectedRecipientIds.filter((selectedId) => selectedId !== userId);

    onSelectedRecipientsChange(nextIds);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Compose Newsletter</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Subject *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter newsletter subject..."
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              maxLength={200}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Recipients *</Form.Label>
            <Form.Select
              value={recipientType}
              onChange={(event) => onRecipientTypeChange(event.target.value)}
            >
              <option value="all">All Users</option>
              <option value="selected">Selected Users</option>
            </Form.Select>
          </Form.Group>

          {recipientType === 'selected' && (
            <Form.Group className="mb-3">
              <Form.Label>Select Users</Form.Label>
              <div className="dc-admin-scroll-box dc-admin-recipient-list">
                {activeUsers.map((user) => (
                  <Form.Check
                    key={user.User_ID}
                    type="checkbox"
                    id={`newsletter-user-${user.User_ID}`}
                    label={`${user.UserName} (${user.UserEmail})`}
                    checked={selectedRecipientIds.includes(user.User_ID)}
                    onChange={(event) => toggleRecipient(user.User_ID, event.target.checked)}
                  />
                ))}
              </div>
              <Form.Text muted>{selectedRecipientIds.length} user(s) selected</Form.Text>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Message *</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              placeholder="Enter your newsletter message..."
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
            />
            <Form.Text muted>HTML tags allowed</Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onSend} disabled={sending}>
          {sending ? 'Sending...' : 'Send Newsletter'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
