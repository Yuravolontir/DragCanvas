import { apiFetch } from './api.js';
import React, { useEffect, useMemo, useState } from 'react';
import NavBar from './NavBar';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from './userContext.js';
import DOMPurify from 'dompurify';
import './NotificationsPage.css';

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span', 'h1', 'h2', 'h3'];
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];
const TYPES = {
  newsletter: { label: 'Newsletter', icon: 'mail' },
  birthday: { label: 'Birthday', icon: 'cake' },
  event: { label: 'Event', icon: 'event' },
  general: { label: 'General', icon: 'notifications' },
};
const cleanHtml = (html) => DOMPurify.sanitize(String(html ?? ''), { ALLOWED_TAGS, ALLOWED_ATTR });
const plainText = (html) => String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const isDocument = (html) => /<!doctype|<html/i.test(String(html ?? ''));
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
  const { currentUser, refreshNotifications } = useUserContext();

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate('/login', { replace: true });
      return undefined;
    }
    if (!currentUser?.User_ID) return undefined;

    let cancelled = false;
    const load = async () => {
      try {
        const response = await apiFetch('/api/notifications/user');
        const data = Array.isArray(response) ? response : [];
        if (cancelled) return;
        setNotifications(data);
        const ids = data.map((item) => item.Notification_ID);
        localStorage.setItem(`viewedNotifications_${currentUser.User_ID}`, JSON.stringify(ids));
        if (ids.length) apiFetch('/api/notifications/mark-viewed', { method: 'PUT', body: { notificationIds: ids } }).catch(console.error);
        refreshNotifications();
      } catch (error) {
        if (!cancelled) setLoadError('We could not load your notifications. Please refresh and try again.');
        console.error('Failed to fetch notifications:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // refreshNotifications changes identity on context renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.User_ID, navigate]);

  const counts = useMemo(() => notifications.reduce((result, item) => {
    const type = item.NotificationType || 'general';
    result[type] = (result[type] || 0) + 1;
    return result;
  }, {}), [notifications]);

  const visible = useMemo(() => [...notifications]
    .filter((item) => activeType === 'all' || (item.NotificationType || 'general') === activeType)
    .sort((a, b) => new Date(b.SentDate).getTime() - new Date(a.SentDate).getTime()), [activeType, notifications]);

  const askDelete = (id) => setNotificationToDelete(id);
  const confirmDelete = async () => {
    const id = notificationToDelete;
    setNotificationToDelete(null);
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications((items) => items.filter((item) => item.Notification_ID !== id));
      setExpandedId((current) => current === id ? null : current);
      refreshNotifications();
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage('The notification could not be deleted. Please try again.');
    }
  };

  return (
    <div className="notifications-page">
      <NavBar />
      <main className="notifications-shell">
        <header className="notifications-heading">
          <div className="notifications-heading__icon" aria-hidden="true"><span className="material-symbols-outlined">notifications</span></div>
          <div>
            <p className="notifications-heading__eyebrow">Inbox</p>
            <h1>Notifications</h1>
            <p>Updates, announcements and reminders from DragCanvas.</p>
          </div>
          {!loading && !loadError && <span className="notifications-heading__count">{notifications.length} {notifications.length === 1 ? 'message' : 'messages'}</span>}
        </header>

        {loading ? <PageState icon="" title="Loading notifications" text="Your inbox will be ready in a moment." loading />
          : loadError ? <PageState icon="cloud_off" title="Notifications are unavailable" text={loadError}><Button onClick={() => window.location.reload()}>Refresh page</Button></PageState>
            : notifications.length === 0 ? <PageState icon="notifications_off" title="You’re all caught up" text="New announcements and reminders will appear here." />
              : <>
                <nav className="notification-filters" aria-label="Filter notifications">
                  <Filter active={activeType === 'all'} onClick={() => setActiveType('all')}>All <span>{notifications.length}</span></Filter>
                  {Object.keys(counts).map((type) => <Filter key={type} active={activeType === type} onClick={() => setActiveType(type)}>{(TYPES[type] || TYPES.general).label} <span>{counts[type]}</span></Filter>)}
                </nav>
                <section className="notification-list" aria-label="Notification list">
                  {visible.map((item) => {
                    const id = item.Notification_ID;
                    const type = item.NotificationType || 'general';
                    const config = TYPES[type] || TYPES.general;
                    const expanded = expandedId === id;
                    const message = String(item.Message ?? '');
                    return <article className={`notification-card notification-card--${type}`} key={id}>
                      <button className="notification-card__toggle" type="button" aria-expanded={expanded} aria-controls={`notification-${id}`} onClick={() => setExpandedId(expanded ? null : id)}>
                        <span className="notification-card__type-icon material-symbols-outlined" aria-hidden="true">{config.icon}</span>
                        <span className="notification-card__summary">
                          <span className="notification-card__meta"><span>{config.label}</span><time dateTime={item.SentDate}>{formatDate(item.SentDate)}</time></span>
                          <strong>{item.Subject || 'Untitled notification'}</strong>
                          {!expanded && <span className="notification-card__preview">{plainText(message) || 'Open to view this notification.'}</span>}
                        </span>
                        <span className={`notification-card__chevron material-symbols-outlined ${expanded ? 'is-open' : ''}`} aria-hidden="true">expand_more</span>
                      </button>
                      {expanded && <div className="notification-card__content" id={`notification-${id}`}>
                        {isDocument(message) ? <iframe srcDoc={message} title={item.Subject || 'Notification content'} sandbox="" /> : <div className="notification-rich-text" dangerouslySetInnerHTML={{ __html: cleanHtml(message) }} />}
                        <div className="notification-card__actions"><button type="button" className="notification-delete" onClick={() => askDelete(id)}><span className="material-symbols-outlined" aria-hidden="true">delete</span>Delete notification</button></div>
                      </div>}
                    </article>;
                  })}
                </section>
              </>}
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
  return <button type="button" className={active ? 'is-active' : ''} aria-pressed={active} onClick={onClick}>{children}</button>;
}

function PageState({ children, icon, loading: isLoading, text, title }) {
  return <section className="notifications-state" role={isLoading ? 'status' : undefined} aria-live={isLoading ? 'polite' : undefined}>
    {isLoading ? <span className="notifications-spinner" aria-hidden="true" /> : <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>}
    <h2>{title}</h2><p>{text}</p>{children}
  </section>;
}
