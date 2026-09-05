import { useEffect, useState } from 'react';

import { apiFetch } from '../../api.js';

/**
 * The reusable message text a schedule or a manual send can pick from, and the
 * dialog that creates or edits one.
 *
 * Not to be confused with `useAdminSiteTemplates` - these are outgoing message
 * text, that hook's templates are page designs.
 *
 * @param {object|null} currentUser  fetchTemplates needs an id to fetch for
 * @param {(message: string, type?: 'success'|'error') => void} showAlertModal
 */
export function useAdminNotificationTemplates({ currentUser, showAlertModal }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/notifications/templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notification templates:', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [currentUser?.User_ID]);

  const handleSave = async (templateData) => {
    try {
      const url = editingTemplate
        ? `/api/notifications/templates/${editingTemplate.Template_ID}`
        : '/api/notifications/templates';

      await apiFetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        body: templateData,
      });

      showAlertModal(editingTemplate ? 'Template updated!' : 'Template created!', 'success');
      setShowForm(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleToggle = async (templateId, isActive) => {
    try {
      await apiFetch(`/api/notifications/templates/${templateId}/toggle`, {
        method: 'PUT',
        body: { isActive },
      });
      showAlertModal('Template updated!', 'success');
      fetchTemplates();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleDelete = async (templateId) => {
    try {
      await apiFetch(`/api/notifications/templates/${templateId}`, { method: 'DELETE' });
      showAlertModal('Template deleted!', 'success');
      fetchTemplates();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  return {
    templates,
    loading,

    tabProps: {
      templates,
      loading,
      onAdd: () => { setEditingTemplate(null); setShowForm(true); },
      onEdit: (template) => { setEditingTemplate(template); setShowForm(true); },
      onToggle: handleToggle,
      onDelete: handleDelete,
    },
    formDialog: {
      show: showForm,
      template: editingTemplate,
      onSave: handleSave,
      onClose: () => setShowForm(false),
    },
  };
}
