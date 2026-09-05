import { useEffect, useState } from 'react';

import { apiFetch } from '../../api.js';

/** Which notification types are switched on system-wide, and the toggle for each. */
export function useAdminNotificationSettings({ currentUser, showAlertModal }) {
  const [settings, setSettings] = useState([]);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch('/api/notifications/settings');
      setSettings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
      setSettings([]);
    }
  };

  useEffect(() => {
    // A one-time fetch when the admin id becomes known, not a synchronous
    // render-cycle update - fetchSettings only sets state after the request
    // resolves, in a later microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, [currentUser?.User_ID]);

  const handleToggle = async (setting) => {
    const nextEnabled = !setting.IsEnabled;

    try {
      await apiFetch('/api/notifications/settings', {
        method: 'PUT',
        body: {
          settings: [{ notificationType: setting.NotificationType, isEnabled: nextEnabled }],
        },
      });

      // Applied to the row in place rather than re-fetched: the server has
      // nothing more to say about this setting than what was just sent.
      setSettings((current) => current.map((row) => (
        row.Setting_ID === setting.Setting_ID ? { ...row, IsEnabled: nextEnabled } : row
      )));

      showAlertModal(`${setting.NotificationType} ${nextEnabled ? 'enabled' : 'disabled'}!`, 'success');
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  return {
    tabProps: { settings, onToggle: handleToggle },
  };
}
