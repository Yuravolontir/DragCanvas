import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';

import { useUserContext } from './userContext.js';
import NavBar from './NavBar';

import AdminStatistics from './AdminStatistics';
import { AdminMainNavigation, NotificationNavigation } from './Components/Admin/AdminNavigation.jsx';
import AdminUsersTab from './Components/Admin/AdminUsersTab.jsx';
import AdminTemplatesTab from './Components/Admin/AdminTemplatesTab.jsx';
import AdminNotificationsList from './Components/Admin/AdminNotificationsList.jsx';
import AdminSchedulesTab from './Components/Admin/AdminSchedulesTab.jsx';
import AdminNotificationTemplatesTab from './Components/Admin/AdminNotificationTemplatesTab.jsx';
import AdminNotificationLogsTab from './Components/Admin/AdminNotificationLogsTab.jsx';
import AdminNotificationSettingsTab from './Components/Admin/AdminNotificationSettingsTab.jsx';
import AdminUserModals from './Components/Admin/AdminUserModals.jsx';
import UserProfileModal from './Components/Admin/UserProfileModal.jsx';
import NewsletterModal from './Components/Admin/NewsletterModal.jsx';
import AdminNotificationEditorModals from './Components/Admin/AdminNotificationEditorModals.jsx';

import { useAdminAlert } from './Components/Admin/useAdminAlert.js';
import { useAdminUsers } from './Components/Admin/useAdminUsers.js';
import { useAdminSiteTemplates } from './Components/Admin/useAdminSiteTemplates.js';
import { useAdminNotifications } from './Components/Admin/useAdminNotifications.js';
import { useAdminSchedules } from './Components/Admin/useAdminSchedules.js';
import { useAdminNotificationTemplates } from './Components/Admin/useAdminNotificationTemplates.js';
import { useAdminNotificationLogs } from './Components/Admin/useAdminNotificationLogs.js';
import { useAdminNotificationSettings } from './Components/Admin/useAdminNotificationSettings.js';

import './AdminPanel.css';

function LoadingScreen() {
  return (
    <div className="admin-page-shell">
      <NavBar />
      <div className="admin-page-state" role="status" aria-live="polite">
        <span className="admin-spinner" aria-hidden="true" />
        <h2>Loading admin workspace</h2>
        <p>Preparing users, templates and notifications.</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="admin-page-shell">
      <NavBar />
      <Container className="dc-admin-page">
        <div className="admin-page-state" role="alert">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
          <h2>Admin workspace is unavailable</h2>
          <p>{message}</p>
        </div>
      </Container>
    </div>
  );
}

/**
 * The whole "Notifications" tab: its own sub-navigation, plus the five things
 * an admin can do with notifications - send one, schedule one, write the
 * template text for one, read the delivery log, or switch a category off.
 *
 * Each of those five is its own hook (useAdminNotifications, useAdminSchedules,
 * useAdminNotificationTemplates, useAdminNotificationLogs,
 * useAdminNotificationSettings); this component only wires their output to the
 * matching sub-tab.
 */
function NotificationsTab({
  activeSubTab,
  onSubTabChange,
  notifications,
  schedules,
  notificationTemplates,
  notificationLogs,
  notificationSettings,
}) {
  return (
    <>
      <NotificationNavigation activeTab={activeSubTab} onTabChange={onSubTabChange} />

      {activeSubTab === 'manage' && (
        <AdminNotificationsList
          notifications={notifications.notifications}
          loading={notifications.loading}
          onCompose={notifications.openCompose}
        />
      )}

      {activeSubTab === 'schedules' && <AdminSchedulesTab {...schedules.tabProps} />}

      {activeSubTab === 'templates' && (
        <AdminNotificationTemplatesTab {...notificationTemplates.tabProps} />
      )}

      {activeSubTab === 'logs' && <AdminNotificationLogsTab {...notificationLogs.tabProps} />}

      {activeSubTab === 'settings' && (
        <AdminNotificationSettingsTab {...notificationSettings.tabProps} />
      )}
    </>
  );
}

/**
 * The admin workspace: users, gallery templates and notifications.
 *
 * Every concern here - the user table, the template gallery, newsletters,
 * schedules, message templates, delivery logs, category switches - is its own
 * hook under Components/Admin/. This component's job is small: confirm the
 * viewer belongs here, start the first load, and hand each hook's state to the
 * tab that displays it.
 */
export default function AdminPanel() {
  const { currentUser, isAdmin, isSuperAdmin, sessionReady } = useUserContext();

  const [activeTab, setActiveTab] = useState('users');
  const [activeNotificationSubTab, setActiveNotificationSubTab] = useState('manage');

  const { showAlertModal, alertDialog } = useAdminAlert();

  const usersHook = useAdminUsers({ showAlertModal });
  const siteTemplates = useAdminSiteTemplates({ currentUser, showAlertModal });
  const notifications = useAdminNotifications({ currentUser, showAlertModal });
  const schedules = useAdminSchedules({ currentUser, showAlertModal });
  const notificationTemplates = useAdminNotificationTemplates({ currentUser, showAlertModal });
  const notificationLogs = useAdminNotificationLogs({ currentUser });
  const notificationSettings = useAdminNotificationSettings({ currentUser, showAlertModal });

  /*
   * The user context is the single source of truth for login and role data.
   * Waiting for sessionReady avoids redirecting while a saved session is
   * still being restored from the server.
   *
   * Schedules, notification templates, logs and settings load on their own,
   * the moment `currentUser` is known - see each hook. Users, site templates
   * and notifications wait for this admin check instead, because reading them
   * needs the confirmed role, not just a cached id.
   */
  useEffect(() => {
    if (!sessionReady) return;

    if (!currentUser || (!isAdmin && !isSuperAdmin)) {
      window.location.replace('/');
      return;
    }

    usersHook.fetchUsers();
    siteTemplates.fetchTemplates();
    notifications.fetchNotifications();
    // Intentionally keyed on the id and the role flags, not on the fetchers
    // themselves - refetching every render would defeat the point of caching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.User_ID, isAdmin, isSuperAdmin, sessionReady]);

  if (usersHook.loading) return <LoadingScreen />;
  if (usersHook.error) return <ErrorScreen message={usersHook.error} />;

  return (
    <div className="admin-page-shell">
      <NavBar />
      <Container className="dc-admin-page">
        <AdminMainNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'statistics' && <AdminStatistics />}

        {activeTab === 'users' && currentUser && (
          <AdminUsersTab
            currentUser={currentUser}
            users={usersHook.filteredUsers}
            {...usersHook.filters}
            {...usersHook.actions}
          />
        )}

        {activeTab === 'templates' && (
          <AdminTemplatesTab
            templates={siteTemplates.templates}
            loading={siteTemplates.loading}
            onVisibilityChange={siteTemplates.toggleVisibility}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab
            activeSubTab={activeNotificationSubTab}
            onSubTabChange={setActiveNotificationSubTab}
            notifications={notifications}
            schedules={schedules}
            notificationTemplates={notificationTemplates}
            notificationLogs={notificationLogs}
            notificationSettings={notificationSettings}
          />
        )}
      </Container>

      <AdminUserModals
        deleteDialog={usersHook.deleteDialog}
        resetDialog={usersHook.resetDialog}
        roleDialog={usersHook.roleDialog}
        alertDialog={alertDialog}
      />

      <UserProfileModal {...usersHook.profileDialog} />

      <NewsletterModal users={usersHook.users} {...notifications.composeDialog} />

      <AdminNotificationEditorModals
        users={usersHook.users}
        notificationTemplates={notificationTemplates.templates}
        scheduleDialog={schedules.formDialog}
        templateDialog={notificationTemplates.formDialog}
      />
    </div>
  );
}
