import { Modal } from 'react-bootstrap';

import NotificationTemplateForm from './NotificationTemplateForm.jsx';
import ScheduleForm from './ScheduleForm.jsx';

/** Hosts the two editor forms used by the notification administration tabs. */
export default function AdminNotificationEditorModals({
  scheduleDialog,
  templateDialog,
  users,
  notificationTemplates,
}) {
  return (
    <>
      <Modal show={scheduleDialog.show} onHide={scheduleDialog.onClose} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {scheduleDialog.schedule ? 'Edit Schedule' : 'Add Schedule'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ScheduleForm
            schedule={scheduleDialog.schedule}
            users={users}
            templates={notificationTemplates}
            onSave={scheduleDialog.onSave}
            onCancel={scheduleDialog.onClose}
          />
        </Modal.Body>
      </Modal>

      <Modal show={templateDialog.show} onHide={templateDialog.onClose} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {templateDialog.template ? 'Edit Template' : 'Add Template'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <NotificationTemplateForm
            template={templateDialog.template}
            onSave={templateDialog.onSave}
            onCancel={templateDialog.onClose}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
