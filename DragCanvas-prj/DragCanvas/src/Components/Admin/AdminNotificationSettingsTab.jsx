import { Button } from 'react-bootstrap';

const SETTING_LABELS = {
  newsletter: 'Newsletter Notifications',
  birthday: 'Birthday Notifications',
  event: 'Event Notifications',
  automated: 'Automated Notifications',
};

/** Enables or disables each notification category for the whole application. */
export default function AdminNotificationSettingsTab({ settings, onToggle }) {
  return (
    <>
      <h4 className="mb-3">Notification Settings</h4>
      <p className="text-muted mb-3">Enable or disable notification types globally.</p>

      {settings.length === 0 ? (
        <p className="text-center mt-4">Loading settings...</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {settings.map((setting) => (
            <div
              key={setting.Setting_ID}
              className="d-flex justify-content-between align-items-center p-3 border rounded"
            >
              <div>
                <h5 className="mb-1">
                  {SETTING_LABELS[setting.NotificationType] || setting.NotificationType}
                </h5>
                <small className="text-muted">
                  {setting.IsEnabled
                    ? 'Currently enabled — users will receive these notifications.'
                    : 'Currently disabled — users will not receive these notifications.'}
                </small>
              </div>
              <Button
                variant={setting.IsEnabled ? 'success' : 'secondary'}
                onClick={() => onToggle(setting)}
              >
                {setting.IsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
