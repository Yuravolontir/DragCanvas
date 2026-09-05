import { useState } from 'react';

import { apiFetch } from '../../api.js';

/**
 * The gallery templates shown on the "Templates" tab, and whether each one is
 * visible to visitors.
 *
 * Not to be confused with `useAdminNotificationTemplates` - these are page
 * designs, that hook's templates are outgoing message text.
 *
 * @param {object|null} currentUser  fetchTemplates needs an id to fetch for
 * @param {(message: string, type?: 'success'|'error') => void} showAlertModal
 */
export function useAdminSiteTemplates({ currentUser, showAlertModal }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (!currentUser?.User_ID) return;

    setLoading(true);
    try {
      const data = await apiFetch('/api/templates/all');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (templateId, currentStatus) => {
    try {
      // The state it should end in, not a flip of what we happen to have read.
      // Two admins clicking at the same moment then cannot leave it in the
      // state neither of them chose.
      const data = await apiFetch(`/api/templates/${templateId}/visibility`, {
        method: 'PATCH',
        body: { isActive: !currentStatus },
      });
      showAlertModal(data.message || 'Template visibility updated', 'success');
      fetchTemplates();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  return { templates, loading, fetchTemplates, toggleVisibility };
}
