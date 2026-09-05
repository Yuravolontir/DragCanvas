import { useState } from 'react';

import { apiFetch } from '../../api.js';

/**
 * The "manage" tab of Notifications: the list of what has already gone out,
 * and the composer that sends a new newsletter.
 *
 * A newsletter is a notification the moment it is sent, so the composer's
 * state lives beside the list it will end up in rather than off on its own.
 *
 * @param {object|null} currentUser  fetchNotifications needs an id to fetch for
 * @param {(message: string, type?: 'success'|'error') => void} showAlertModal
 */
export function useAdminNotifications({ currentUser, showAlertModal }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser?.User_ID) return;

    setLoading(true);
    try {
      const data = await apiFetch('/api/notifications/all');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const resetCompose = () => {
    setSubject('');
    setMessage('');
    setRecipientType('all');
    setSelectedRecipients([]);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      showAlertModal('Please enter subject and message', 'error');
      return;
    }
    if (recipientType === 'selected' && selectedRecipients.length === 0) {
      showAlertModal('Please select at least one recipient', 'error');
      return;
    }

    setSending(true);
    try {
      const data = await apiFetch('/api/notifications/send-newsletter', {
        method: 'POST',
        body: {
          subject,
          message,
          recipientType,
          recipientIds: recipientType === 'selected' ? selectedRecipients : null,
        },
      });

      showAlertModal(`Newsletter sent to ${data.sentCount} recipients!`, 'success');
      setShowCompose(false);
      resetCompose();
      fetchNotifications();
    } catch (err) {
      showAlertModal(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return {
    notifications,
    loading,
    fetchNotifications,

    composeDialog: {
      show: showCompose,
      subject,
      message,
      recipientType,
      selectedRecipientIds: selectedRecipients,
      sending,
      onSubjectChange: setSubject,
      onMessageChange: setMessage,
      onRecipientTypeChange: setRecipientType,
      onSelectedRecipientsChange: setSelectedRecipients,
      onSend: handleSend,
      onClose: () => setShowCompose(false),
    },
    openCompose: () => setShowCompose(true),
  };
}
