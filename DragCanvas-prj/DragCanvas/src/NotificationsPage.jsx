import React, { useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';

import { apiFetch } from './api.js';
import NavBar from './NavBar';
import { useUserContext } from './userContext.js';
import './NotificationsPage.css';

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span', 'h1', 'h2', 'h3'];
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];
const TYPES = {
  newsletter: { label: 'Newsletter', icon: 'mail' },
  birthday: { label: 'Birthday', icon: 'cake' },
  event: { label: 'Event', icon: 'event' },
  general: { label: 'General', icon: 'notifications' },
};
function cleanHtml(html) {
  return DOMPurify.sanitize(String(html ?? ''), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

function plainText(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCompleteHtmlDocument(html) {
  return /<!doctype|<html/i.test(String(html ?? ''));
}

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [activeType, setActiveType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { currentUser, refreshNotifications, sessionReady } = useUserContext();

  useEffect(() => {
    // Wait until UserContext has finished restoring the browser session. Without
    // this guard, a signed-in user could be redirected during the first render.
    if (!sessionReady) return undefined;

    if (!currentUser) {
      navigate('/login', { replace: true });
      return undefined;
    }

    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const response = await apiFetch('/api/notifications/user');
        const notificationList = Array.isArray(response) ? response : [];
        if (cancelled) return;

        setNotifications(notificationList);

        const notificationIds = notificationList.map((item) => item.Notification_ID);
        localStorage.setItem(
          `viewedNotifications_${currentUser.User_ID}`,
          JSON.stringify(notificationIds),
        );

        if (notificationIds.length) {
          apiFetch('/api/notifications/mark-viewed', {
            method: 'PUT',
            body: { notificationIds },
          }).catch(console.error);
        }

        refreshNotifications();
      } catch (loadNotificationsError) {
        if (!cancelled) {
          setLoadError('We could not load your notifications. Please refresh and try again.');
        }
        console.error('Failed to fetch notifications:', loadNotificationsError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [currentUser, navigate, refreshNotifications, sessionReady]);

  const counts = useMemo(() => {
    return notifications.reduce((result, notification) => {
      const type = notification.NotificationType || 'general';
      result[type] = (result[type] || 0) + 1;
      return result;
    }, {});
  }, [notifications]);

  const visibleNotifications = useMemo(() => {
    const matchesActiveFilter = (notification) => {
      const type = notification.NotificationType || 'general';
      return activeType === 'all' || type === activeType;
    };

    const newestFirst = (first, second) => {
      return new Date(second.SentDate).getTime() - new Date(first.SentDate).getTime();
    };

    return [...notifications].filter(matchesActiveFilter).sort(newestFirst);
  }, [activeType, notifications]);

  const confirmDelete = async () => {
    const notificationId = notificationToDelete;
    setNotificationToDelete(null);
    try {
      await apiFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications((currentNotifications) => (
        currentNotifications.filter((item) => item.Notification_ID !== notificationId)
      ));
      setExpandedId((currentId) => (currentId === notificationId ? null : currentId));
      refreshNotifications();
    } catch (deleteError) {
      console.error('Delete error:', deleteError);
      setErrorMessage('The notification could not be deleted. Please try again.');
    }
  };

  // Choose one complete page state instead of nesting several ternary
  // operators inside JSX.
  let pageContent;
  if (loading) {
    pageContent = (
      <PageState
        title="Loading notifications"
        text="Your inbox will be ready in a moment."
        loading
      />
    );
  } else if (loadError) {
    pageContent = (
      <PageState
        icon="cloud_off"
        title="Notifications are unavailable"
        text={loadError}
      >
        <Button onClick={() => window.location.reload()}>Refresh page</Button>
      </PageState>
    );
  } else if (notifications.length === 0) {
    pageContent = (
      <PageState
        icon="notifications_off"
        title="You’re all caught up"
        text="New announcements and reminders will appear here."
      />
    );
  } else {
    pageContent = (
      <NotificationInbox
        activeType={activeType}
        counts={counts}
        expandedId={expandedId}
        notifications={notifications}
        setActiveType={setActiveType}
        setExpandedId={setExpandedId}
        setNotificationToDelete={setNotificationToDelete}
        visibleNotifications={visibleNotifications}
      />
    );
  }

  return (
    <div className="notifications-page">
      <NavBar />
      <main className="notifications-shell">
        <header className="notifications-heading">
          <div className="notifications-heading__icon" aria-hidden="true">
            <span className="material-symbols-outlined">notifications</span>
          </div>
          <div>
            <p className="notifications-heading__eyebrow">Inbox</p>
            <h1>Notifications</h1>
            <p>Updates, announcements and reminders from DragCanvas.</p>
          </div>
          {!loading && !loadError && (
            <span className="notifications-heading__count">
              {notifications.length} {notifications.length === 1 ? 'message' : 'messages'}
            </span>
          )}
        </header>

        {pageContent}
      </main>

      <Modal show={notificationToDelete !== null} onHide={() => setNotificationToDelete(null)} centered>
        <Modal.Header closeButton><Modal.Title>Delete notification?</Modal.Title></Modal.Header>
        <Modal.Body>This notification will be permanently removed from your inbox.</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setNotificationToDelete(null)}>Keep it</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></Modal.Footer>
      </Modal>
      <Modal show={Boolean(errorMessage)} onHide={() => setErrorMessage('')} centered>
        <Modal.Header closeButton><Modal.Title>Something went wrong</Modal.Title></Modal.Header>
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer><Button onClick={() => setErrorMessage('')}>Close</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

function Filter({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={active ? 'is-active' : ''}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function NotificationInbox({
  activeType,
  counts,
  expandedId,
  notifications,
  setActiveType,
  setExpandedId,
  setNotificationToDelete,
  visibleNotifications,
}) {
  return (
    <>
      <nav className="notification-filters" aria-label="Filter notifications">
        <Filter active={activeType === 'all'} onClick={() => setActiveType('all')}>
          All <span>{notifications.length}</span>
        </Filter>

        {Object.keys(counts).map((type) => {
          const typeLabel = (TYPES[type] || TYPES.general).label;
          return (
            <Filter
              key={type}
              active={activeType === type}
              onClick={() => setActiveType(type)}
            >
              {typeLabel} <span>{counts[type]}</span>
            </Filter>
          );
        })}
      </nav>

      <section className="notification-list" aria-label="Notification list">
        {visibleNotifications.map((notification) => {
          const notificationId = notification.Notification_ID;
          const expanded = expandedId === notificationId;

          return (
            <NotificationCard
              key={notificationId}
              notification={notification}
              expanded={expanded}
              onToggle={() => setExpandedId(expanded ? null : notificationId)}
              onDelete={() => setNotificationToDelete(notificationId)}
            />
          );
        })}
      </section>
    </>
  );
}

function NotificationCard({ notification, expanded, onToggle, onDelete }) {
  const notificationId = notification.Notification_ID;
  const type = notification.NotificationType || 'general';
  const typeConfig = TYPES[type] || TYPES.general;
  const message = String(notification.Message ?? '');
  const contentId = `notification-${notificationId}`;

  return (
    <article className={`notification-card notification-card--${type}`}>
      <button
        className="notification-card__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span
          className="notification-card__type-icon material-symbols-outlined"
          aria-hidden="true"
        >
          {typeConfig.icon}
        </span>

        <span className="notification-card__summary">
          <span className="notification-card__meta">
            <span>{typeConfig.label}</span>
            <time dateTime={notification.SentDate}>
              {formatDate(notification.SentDate)}
            </time>
          </span>
          <strong>{notification.Subject || 'Untitled notification'}</strong>
          {!expanded && (
            <span className="notification-card__preview">
              {plainText(message) || 'Open to view this notification.'}
            </span>
          )}
        </span>

        <span
          className={`notification-card__chevron material-symbols-outlined ${expanded ? 'is-open' : ''}`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {expanded && (
        <div className="notification-card__content" id={contentId}>
          {isCompleteHtmlDocument(message) ? (
            <iframe
              srcDoc={message}
              title={notification.Subject || 'Notification content'}
              sandbox=""
            />
          ) : (
            // cleanHtml sanitizes this server-provided markup before React uses it.
            <div
              className="notification-rich-text"
              dangerouslySetInnerHTML={{ __html: cleanHtml(message) }}
            />
          )}

          <div className="notification-card__actions">
            <button type="button" className="notification-delete" onClick={onDelete}>
              <span className="material-symbols-outlined" aria-hidden="true">delete</span>
              Delete notification
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function PageState({ children, icon, loading: isLoading, text, title }) {
  return (
    <section
      className="notifications-state"
      role={isLoading ? 'status' : undefined}
      aria-live={isLoading ? 'polite' : undefined}
    >
      {isLoading ? (
        <span className="notifications-spinner" aria-hidden="true" />
      ) : (
        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      )}
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </section>
  );
}
