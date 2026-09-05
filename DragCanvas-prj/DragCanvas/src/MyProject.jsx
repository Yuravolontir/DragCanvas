import { useCallback, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from './api.js';
import SitePreview from './Components/SitePreview.jsx';
import NavBar from './NavBar';
import PublishInfoModal from './Components/PublishInfoModal';
import InboxModal from './Components/InboxModal.jsx';
import { useUserContext } from './userContext.js';

/** What the inbox button on a card promises before it is pressed. */
const inboxTooltip = (projectInbox) => {
  const total = projectInbox?.submissions?.length || 0;
  const unread = Number(projectInbox?.unread || 0);
  const messages = `${total} message${total === 1 ? '' : 's'} from your site`;
  return unread ? `${messages}, ${unread} unread` : messages;
};

export default function MyProject() {
  const navigate = useNavigate();
  const { currentUser, sessionReady } = useUserContext();

  // Project list and messages sent through each published site.
  const [projects, setProjects] = useState([]);
  const [inbox, setInbox] = useState({});
  const [openInbox, setOpenInbox] = useState(null);
  const [loading, setLoading] = useState(true);

  // Which message is being marked read, and whether the whole inbox is.
  const [busyReadId, setBusyReadId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Dialog state.
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);

  const showAlertModal = useCallback((message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  }, []);

  /**
   * How many messages each published project has received. Only published ones
   * are asked about - an unpublished site has no visitors.
   */
  const loadInboxCounts = useCallback(async (projectList) => {
    const publishedProjects = projectList.filter((project) => project.IsPublished);
    const results = await Promise.all(
      publishedProjects.map((project) =>
        apiFetch(`/api/forms/project/${project.Project_ID}`)
          .then((response) => [project.Project_ID, response])
          .catch(() => null)
      ),
    );

    const inboxByProjectId = {};
    results.filter(Boolean).forEach(([projectId, response]) => {
      inboxByProjectId[projectId] = response;
    });
    setInbox(inboxByProjectId);
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!currentUser?.User_ID) return;

    try {
      // The server reads the owner from the token, so no userId belongs in the URL.
      const projectList = await apiFetch('/api/projects/user');
      setProjects(projectList);
      await loadInboxCounts(projectList);
    } catch (loadError) {
      console.error('Error fetching projects:', loadError);
      showAlertModal(`Failed to load projects: ${loadError.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.User_ID, loadInboxCounts, showAlertModal]);

  useEffect(() => {
    if (!sessionReady) return;

    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    fetchProjects();
  }, [currentUser, fetchProjects, navigate, sessionReady]);

  /** Mark the messages read here as well as on the server, without a reload. */
  const rememberRead = (projectId, readIds) => {
    setInbox((previousInbox) => {
      const projectInbox = previousInbox[projectId];
      if (!projectInbox) return previousInbox;

      const submissions = projectInbox.submissions.map((submission) => (
        readIds.includes(submission.Submission_ID)
          ? { ...submission, IsRead: true }
          : submission
      ));

      return {
        ...previousInbox,
        [projectId]: {
          ...projectInbox,
          unread: submissions.filter((submission) => submission.IsRead === false).length,
          submissions,
        },
      };
    });
  };

  const markRead = async (projectId, submissionId) => {
    setBusyReadId(submissionId);
    try {
      await apiFetch(`/api/forms/project/${projectId}/${submissionId}/read`, { method: 'PUT' });
      rememberRead(projectId, [submissionId]);
    } catch (markReadError) {
      showAlertModal(markReadError.message, 'error');
    } finally {
      setBusyReadId(null);
    }
  };

  /**
   * Clear the whole inbox at once.
   *
   * Somebody who has read the list does not want to press a button per message,
   * and the badge on the card keeps counting until every one of them is marked.
   */
  const markAllRead = async (projectId) => {
    const unreadIds = (inbox[projectId]?.submissions || [])
      .filter((submission) => submission.IsRead === false)
      .map((submission) => submission.Submission_ID);
    if (!unreadIds.length) return;

    setMarkingAll(true);
    try {
      await Promise.all(unreadIds.map((submissionId) => apiFetch(
        `/api/forms/project/${projectId}/${submissionId}/read`,
        { method: 'PUT' },
      )));
      rememberRead(projectId, unreadIds);
    } catch (markReadError) {
      showAlertModal(markReadError.message, 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const loadProject = (projectId) => {
    navigate('/create-new-project', {
      state: { projectId },
    });
  };

  // Whose inbox is open, so the dialog can say which site these came from.
  const openInboxProject = projects.find((project) => project.Project_ID === openInbox);

  const handleDeleteClick = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);

    try {
      await apiFetch(`/api/projects/${projectToDelete}`, { method: 'DELETE' });
      await fetchProjects();
      showAlertModal('Project deleted successfully', 'success');
    } catch (deleteError) {
      console.error('Delete error:', deleteError);
      showAlertModal(`Error deleting project: ${deleteError.message}`, 'error');
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <NavBar />

      <div style={{ paddingTop: '100px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="dc-projects-header">
          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', fontWeight: 700 }}>
              Dashboard
            </p>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: 'var(--on-surface)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              margin: 0,
            }}>
              My Workspace
            </h1>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1rem',
              color: 'var(--on-surface-variant)',
              marginTop: '16px',
              maxWidth: '400px',
              lineHeight: 1.6,
            }}>
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} in your workspace.
            </p>
          </div>
          <button
            onClick={() => navigate('/create-new-project')}
            className="dc-projects-new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: 'none',
              borderRadius: '9999px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 96, 172, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px color-mix(in oklab, var(--primary) 40%, transparent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 96, 172, 0.2)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            New Project
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--muted)', fontSize: '0.9rem' }}>
              Loading projects...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: 'var(--surface)',
            borderRadius: '24px',
            border: '2px dashed var(--outline-light)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--primary-light)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>add_circle</span>
            </div>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--on-surface)',
              marginBottom: '8px',
            }}>
              No projects yet
            </h3>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.85rem',
              color: 'var(--muted)',
              marginBottom: '24px',
            }}>
              Start with a curated layout or create from scratch
            </p>
            <button
              onClick={() => navigate('/create-new-project')}
              style={{
                padding: '12px 28px',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                border: 'none',
                borderRadius: '9999px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 96, 172, 0.2)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="dc-projects-grid">
            {projects.map((project, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={project.Project_ID}
                  className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid var(--outline-light)',
                    transition: 'all 0.4s ease',
                    cursor: 'default',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/*
                    * The site itself, not a picture of it.
                    *
                    * This was a stored ThumbnailURL, and the whole block was
                    * skipped when there was not one - which is most of the
                    * time, so a list of somebody's own sites showed no sites.
                    * The gallery already renders a real page on each card; a
                    * project deserves the same and now shares the component.
                    * The slice each card shows lives in responsive.css, so the
                    * featured card can stop being a different shape at the
                    * width where it stops being a different size.
                    */}
                  <SitePreview
                    className="dc-project-preview"
                    endpoint={`/api/projects/${project.Project_ID}`}
                    designKey="ProjectData"
                    name={project.ProjectName}
                    fallbackSrc={project.ThumbnailURL}
                  />

                  {/* Body */}
                  <div style={{ padding: '24px' }}>
                    {isFirst && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          background: 'var(--secondary-light)',
                          color: 'var(--secondary)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                          Featured
                        </span>
                      </div>
                    )}

                    <h3 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: isFirst ? '1.5rem' : '1.1rem',
                      fontWeight: 700,
                      color: 'var(--on-surface)',
                      marginBottom: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {project.ProjectName || 'Untitled Project'}
                    </h3>

                    {project.IsPublished && project.PublishedUrl && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 10px', background: 'rgba(76,175,106,0.12)',
                        color: '#2e7d46', borderRadius: '9999px', fontSize: '0.7rem',
                        fontWeight: 700, marginBottom: '8px',
                      }}>
                        <span style={{ width: '6px', height: '6px', background: '#4caf6a', borderRadius: '50%' }} />
                        Live
                      </span>
                    )}

                    {project.ProjectDescription && (
                      <p style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.85rem',
                        color: 'var(--on-surface-variant)',
                        marginBottom: '12px',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {project.ProjectDescription}
                      </p>
                    )}

                    {/* Meta */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '16px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.75rem',
                      color: 'var(--muted)',
                    }}>
                      <span>{project.ComponentCount} components</span>
                      <span>{project.ProjectSizeKB} KB</span>
                      <span>{new Date(project.CreatedDate).toLocaleDateString()}</span>
                    </div>

                    {/*
                      Actions

                      Wrapping, because this row is not a fixed set: analytics and
                      Open are always here, the inbox button appears once a form has
                      been filled in, and the QR button once the site is published.
                      At four or five buttons in the width a phone leaves after the
                      sensor-housing inset, a nowrap row pushed the last one - delete
                      - into the inset, where it cannot be tapped at all. Found by
                      check-responsive at 402x874 with the insets forced on.
                    */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button onClick={() => navigate(`/projects/${project.Project_ID}/operations`)} title="Analytics, bookings, orders and reviews" style={{ padding: '10px 12px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '12px', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>monitoring</span></button>
                      <button
                        onClick={() => loadProject(project.Project_ID)}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          border: 'none',
                          borderRadius: '9999px',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'var(--primary)';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'var(--primary-light)';
                          e.target.style.color = 'var(--primary)';
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                        Open
                      </button>
                      {inbox[project.Project_ID]?.submissions?.length > 0 && (
                        <button
                          onClick={() => setOpenInbox(project.Project_ID)}
                          /*
                            The number used to be the unread count when there
                            was one and the total when there was not, so "4"
                            meant two different things and the button could not
                            be trusted. It is always the total now; unread is
                            said in words, where it cannot be misread.
                          */
                          title={inboxTooltip(inbox[project.Project_ID])}
                          aria-label={inboxTooltip(inbox[project.Project_ID])}
                          style={{
                            padding: '10px 12px',
                            background: inbox[project.Project_ID].unread > 0 ? 'var(--haze)' : 'transparent',
                            color: inbox[project.Project_ID].unread > 0 ? 'var(--on-primary)' : 'var(--haze)',
                            border: '1px solid var(--haze)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            {inbox[project.Project_ID].unread > 0 ? 'mark_email_unread' : 'mail'}
                          </span>
                          {inbox[project.Project_ID].submissions.length}
                        </button>
                      )}
                      {project.PublishedUrl && (
                        <button
                          onClick={() => setShareUrl(project.PublishedUrl)}
                          title="Link & QR code"
                          style={{
                            padding: '10px',
                            background: 'transparent',
                            color: 'var(--primary)',
                            border: '1px solid #b3d4f0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--primary-light)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = '#b3d4f0';
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code_2</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(project.Project_ID)}
                        style={{
                          padding: '10px',
                          background: 'transparent',
                          color: 'var(--muted)',
                          border: '1px solid var(--outline-light)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--error)';
                          e.currentTarget.style.borderColor = 'var(--error)';
                          e.currentTarget.style.background = 'rgba(186,26,26,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--muted)';
                          e.currentTarget.style.borderColor = 'var(--outline-light)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Modal */}
      <Modal show={showAlert} onHide={() => setShowAlert(false)} centered>
        <Modal.Header closeButton className={alertType === 'success' ? 'text-success' : 'text-danger'}>
          <Modal.Title>{alertType === 'success' ? 'Success' : 'Error'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={alertType === 'success' ? 'success' : 'danger'}>
            {alertMessage}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowAlert(false)}>OK</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{projects.find(p => p.Project_ID === projectToDelete)?.ProjectName || 'this project'}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      <PublishInfoModal
        show={!!shareUrl}
        url={shareUrl}
        onClose={() => setShareUrl(null)}
      />

      {/* What visitors wrote through the form on a published site */}
      <InboxModal
        projectName={openInboxProject?.ProjectName}
        projectInbox={inbox[openInbox]}
        busyReadId={busyReadId}
        markingAll={markingAll}
        onMarkRead={(submissionId) => markRead(openInbox, submissionId)}
        onMarkAllRead={() => markAllRead(openInbox)}
        onClose={() => setOpenInbox(null)}
      />
    </div>
  );
}
