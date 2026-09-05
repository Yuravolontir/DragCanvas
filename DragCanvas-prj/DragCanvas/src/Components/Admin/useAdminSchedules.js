import { useEffect, useState } from 'react';

import { apiFetch } from '../../api.js';

/**
 * Automatic notification schedules - birthday messages, recurring events - and
 * the dialog that creates or edits one.
 *
 * @param {object|null} currentUser  fetchSchedules needs an id to fetch for
 * @param {(message: string, type?: 'success'|'error') => void} showAlertModal
 */
export function useAdminSchedules({ currentUser, showAlertModal }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchSchedules = async () => {
    if (!currentUser?.User_ID) return;

    setLoading(true);
    try {
      const data = await apiFetch('/api/notifications/schedules');
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Loaded as soon as an admin is known, independent of which tab is open -
  // the same as the notification templates, logs and settings below it.
  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.User_ID]);

  const handleSave = async (scheduleData) => {
    try {
      const url = editingSchedule
        ? `/api/notifications/schedules/${editingSchedule.Schedule_ID}`
        : '/api/notifications/schedules';

      await apiFetch(url, {
        method: editingSchedule ? 'PUT' : 'POST',
        body: scheduleData,
      });

      showAlertModal(editingSchedule ? 'Schedule updated!' : 'Schedule created!', 'success');
      setShowForm(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleToggle = async (scheduleId, isActive) => {
    try {
      await apiFetch(`/api/notifications/schedules/${scheduleId}/toggle`, {
        method: 'PUT',
        body: { isActive },
      });
      showAlertModal('Schedule updated!', 'success');
      fetchSchedules();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      await apiFetch(`/api/notifications/schedules/${scheduleId}`, { method: 'DELETE' });
      showAlertModal('Schedule deleted!', 'success');
      fetchSchedules();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  return {
    schedules,
    loading,

    tabProps: {
      schedules,
      loading,
      onAdd: () => { setEditingSchedule(null); setShowForm(true); },
      onEdit: (schedule) => { setEditingSchedule(schedule); setShowForm(true); },
      onToggle: handleToggle,
      onDelete: handleDelete,
    },
    formDialog: {
      show: showForm,
      schedule: editingSchedule,
      onSave: handleSave,
      onClose: () => setShowForm(false),
    },
  };
}
