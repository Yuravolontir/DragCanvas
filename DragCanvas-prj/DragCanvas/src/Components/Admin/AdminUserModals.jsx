import { Alert, Button, Form, Modal } from 'react-bootstrap';

/** Confirmation dialogs used by the user-management tab. */
export default function AdminUserModals({
  deleteDialog,
  resetDialog,
  roleDialog,
  alertDialog,
}) {
  return (
    <>
      <Modal show={deleteDialog.show} onHide={deleteDialog.onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Delete <strong>{deleteDialog.user?.UserName}</strong>{' '}
            ({deleteDialog.user?.UserEmail})?
          </p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={deleteDialog.onClose}>Cancel</Button>
          <Button variant="danger" onClick={deleteDialog.onConfirm}>Delete</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={resetDialog.show} onHide={resetDialog.onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Reset password for <strong>{resetDialog.user?.UserName}</strong>{' '}
            ({resetDialog.user?.UserEmail})?
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Temporary Password:</Form.Label>
            <Form.Control
              type="text"
              value={resetDialog.password}
              onChange={(event) => resetDialog.onPasswordChange(event.target.value)}
            />
          </Form.Group>
          <p className="text-warning">User should change this password after logging in.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetDialog.onClose}>Cancel</Button>
          <Button variant="warning" onClick={resetDialog.onConfirm}>Reset Password</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={roleDialog.show} onHide={roleDialog.onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{roleDialog.makeAdmin ? 'Make Admin' : 'Remove Admin'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {roleDialog.makeAdmin ? 'Grant admin role to' : 'Remove admin role from'}{' '}
            <strong>{roleDialog.user?.UserName}</strong> ({roleDialog.user?.UserEmail})?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={roleDialog.onClose}>Cancel</Button>
          <Button
            variant={roleDialog.makeAdmin ? 'info' : 'secondary'}
            onClick={roleDialog.onConfirm}
          >
            {roleDialog.makeAdmin ? 'Make Admin' : 'Remove Admin'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={alertDialog.show} onHide={alertDialog.onClose} centered>
        <Modal.Header
          closeButton
          className={alertDialog.type === 'success' ? 'text-success' : 'text-danger'}
        >
          <Modal.Title>{alertDialog.type === 'success' ? 'Success' : 'Error'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={alertDialog.type === 'success' ? 'success' : 'danger'}>
            {alertDialog.message}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={alertDialog.onClose}>OK</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
