import { Button } from 'react-bootstrap';

const MAIN_TABS = [
  { id: 'users', label: 'Users' },
  { id: 'templates', label: 'Templates' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'statistics', label: 'Statistics' },
];

const NOTIFICATION_TABS = [
  { id: 'manage', label: 'Manage' },
  { id: 'schedules', label: 'Schedules' },
  { id: 'templates', label: 'Templates' },
  { id: 'logs', label: 'Logs' },
  { id: 'settings', label: 'Settings' },
];

function TabButtons({ tabs, activeTab, onTabChange, size }) {
  return tabs.map((tab) => (
    <Button
      key={tab.id}
      variant={activeTab === tab.id ? 'primary' : 'outline-primary'}
      size={size}
      onClick={() => onTabChange(tab.id)}
    >
      {tab.label}
    </Button>
  ));
}

/** Page title and the four main sections of the admin workspace. */
export function AdminMainNavigation({ activeTab, onTabChange }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4 dc-admin-row">
      <div className="admin-page-title">
        <span className="admin-page-eyebrow">Workspace</span>
        <h1>Admin panel</h1>
        <p>Manage people, templates, communications and platform activity.</p>
      </div>
      <nav aria-label="Admin sections">
        <TabButtons tabs={MAIN_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      </nav>
    </div>
  );
}

/** Sections available inside the notification workspace. */
export function NotificationNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="d-flex gap-2 mb-3 dc-admin-row" aria-label="Notification sections">
      <TabButtons
        tabs={NOTIFICATION_TABS}
        activeTab={activeTab}
        onTabChange={onTabChange}
        size="sm"
      />
    </nav>
  );
}
