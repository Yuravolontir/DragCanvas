import { apiFetch } from './api.js';
import { useState, useEffect } from 'react'
import NavBar from './NavBar';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import PublishInfoModal from './Components/PublishInfoModal';

export default function MyProject() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  // Form submissions that arrived from published sites, keyed by project id
  const [inbox, setInbox] = useState({});
  const [openInbox, setOpenInbox] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser?.User_ID) {
      fetchProjects();
    }
    // Keyed on the user: fetchProjects is redefined every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchProjects = async () => {
    try {
      if (!currentUser?.User_ID) {
        console.error('No user logged in');
        return;
      }

      // The server reads the owner from the token, so no userId in the URL
      const data = await apiFetch('/api/projects/user');
      setProjects(data);
      loadInboxCounts(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      showAlertModal('Failed to load projects: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * How many messages each published project has received. Only published ones
   * are asked about - an unpublished site has no visitors.
   */
  const loadInboxCounts = async (list) => {
    const published = list.filter((p) => p.IsPublished);
    const results = await Promise.all(
      published.map((p) =>
        apiFetch(`/api/forms/project/${p.Project_ID}`)
          .then((r) => [p.Project_ID, r])
          .catch(() => null)
      )
    );
    const next = {};
    results.filter(Boolean).forEach(([id, r]) => { next[id] = r; });
    setInbox(next);
  };

  const markRead = async (projectId, submissionId) => {
    try {
      await apiFetch(`/api/forms/project/${projectId}/${submissionId}/read`, { method: 'PUT' });
      setInbox((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          unread: Math.max(0, (prev[projectId]?.unread || 1) - 1),
          submissions: prev[projectId].submissions.map((x) =>
            x.Submission_ID === submissionId ? { ...x, IsRead: true } : x
          ),
        },
      }));
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const showAlertModal = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const loadProject = (projectId) => {
    navigate('/create-new-project', {
      state: { projectId: projectId }
    });
  };

  const handleDeleteClick = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);

    try {
      await apiFetch(`/api/projects/${projectToDelete}`, { method: 'DELETE' });
      fetchProjects();
      showAlertModal('Project deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showAlertModal('Error deleting project: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <NavBar />

      <div style={{ paddingTop: '100px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px',
          }}>
            {projects.map((project, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={project.Project_ID}
                  className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                  style={{
                    gridColumn: isFirst ? 'span 8' : 'span 4',
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
                  {/* Thumbnail */}
                  {project.ThumbnailURL && (
                    <div style={{
                      height: isFirst ? '300px' : '200px',
                      overflow: 'hidden',
                      background: 'var(--surface-dim)',
                    }}>
                      <img
                        src={project.ThumbnailURL}
                        alt={project.ProjectName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'all 0.5s ease',
                        }}
                        draggable={false}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      />
                    </div>
                  )}

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

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                          title="Messages from your site"
                          style={{
                            padding: '10px 12px',
                            background: inbox[project.Project_ID].unread > 0 ? 'var(--haze)' : 'transparent',
                            color: inbox[project.Project_ID].unread > 0 ? '#fff' : 'var(--haze)',
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
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
                          {inbox[project.Project_ID].unread > 0
                            ? inbox[project.Project_ID].unread
                            : inbox[project.Project_ID].submissions.length}
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
      <Modal show={!!openInbox} onHide={() => setOpenInbox(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Messages from your site
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {(inbox[openInbox]?.submissions || []).length === 0 ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>No messages yet.</p>
          ) : (
            (inbox[openInbox]?.submissions || []).map((item) => (
              <div
                key={item.Submission_ID}
                onClick={() => !item.IsRead && markRead(openInbox, item.Submission_ID)}
                style={{
                  border: '1px solid #eee',
                  borderLeft: item.IsRead ? '1px solid #eee' : '3px solid var(--haze)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 10,
                  cursor: item.IsRead ? 'default' : 'pointer',
                  background: item.IsRead ? '#fff' : '#faf8ff',
                }}
              >
                <div style={{ fontSize: 11, color: '#a09aa8', marginBottom: 6 }}>
                  {new Date(item.CreatedDate).toLocaleString()}
                  {!item.IsRead && <span style={{ color: 'var(--haze)', marginLeft: 8 }}>• new</span>}
                </div>
                {Object.entries(item.Data || {}).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', gap: 10, fontSize: 14, marginBottom: 3 }}>
                    <span style={{ color: 'var(--muted)', minWidth: 90 }}>{key}</span>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
