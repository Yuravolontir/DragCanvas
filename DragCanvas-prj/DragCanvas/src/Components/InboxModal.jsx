import Modal from 'react-bootstrap/Modal';

import SubmissionList from './SubmissionList.jsx';
import './InboxModal.css';

/**
 * The messages one published site has received.
 *
 * The list itself is the shared SubmissionList - the same one the project's
 * Leads tab shows - so this dialog only frames it and offers the one action
 * that belongs to the whole inbox rather than to a single message.
 *
 * @param {string} projectName   whose site these came from
 * @param {object} projectInbox  the API answer: { submissions, unread }
 * @param {number} busyReadId    the message currently being marked read
 * @param {boolean} markingAll   the whole inbox is being marked read
 */
export default function InboxModal({
  projectName,
  projectInbox,
  busyReadId,
  markingAll,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) {
  const submissions = projectInbox?.submissions || [];
  const unread = submissions.filter((submission) => submission.IsRead === false).length;

  const subtitle = [
    `${submissions.length} message${submissions.length === 1 ? '' : 's'}`,
    unread ? `${unread} unread` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Modal
      show={Boolean(projectInbox)}
      onHide={onClose}
      centered
      size="lg"
      scrollable
      contentClassName="inbox-modal"
      aria-labelledby="inbox-modal-heading"
    >
      <Modal.Header>
        <div className="inbox-modal__title">
          <div className="inbox-modal__icon" aria-hidden="true">
            <span className="material-symbols-outlined">forum</span>
          </div>
          <div className="inbox-modal__heading">
            <strong id="inbox-modal-heading">
              {projectName ? `Messages · ${projectName}` : 'Messages from your site'}
            </strong>
            <span>{subtitle}</span>
          </div>
        </div>

        <button
          className="inbox-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </Modal.Header>

      <Modal.Body>
        <SubmissionList
          rows={submissions}
          busyId={busyReadId}
          onMarkRead={onMarkRead}
          emptyText="Nobody has written through your form yet."
        />
      </Modal.Body>

      <Modal.Footer>
        {unread > 0 && (
          <button
            className="inbox-modal__footer-button"
            type="button"
            disabled={markingAll}
            onClick={onMarkAllRead}
          >
            <span className="material-symbols-outlined" aria-hidden="true">done_all</span>
            {markingAll ? 'Marking…' : `Mark all ${unread} as read`}
          </button>
        )}
        <button
          className="inbox-modal__footer-button inbox-modal__footer-button--primary"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}
