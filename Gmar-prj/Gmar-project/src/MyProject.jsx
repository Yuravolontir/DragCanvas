import { useState, useEffect } from 'react'
import NavBar from './NavBar';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';

export default function MyProject() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser?.User_ID) {
      fetchProjects();
    }
  }, [currentUser]);

  const fetchProjects = async () => {
    try {
      if (!currentUser?.User_ID) {
        console.error('No user logged in');
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/projects/user/${currentUser.User_ID}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      showAlertModal('Failed to load projects: ' + err.message, 'error');
    } finally {
      setLoading(false);
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
      const response = await fetch(
        `http://localhost:3001/api/projects/${projectToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.User_ID
        })
      });

      if (response.ok) {
        fetchProjects();
        showAlertModal('Project deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showAlertModal('Error deleting project: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ background: '#0b1325', minHeight: '100vh' }}>
      <NavBar />

      <div style={{ paddingTop: '100px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.8rem', color: '#4f6ef7', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', fontWeight: 700 }}>
              The Collection
            </p>
            <h1 style={{
              fontFamily: "'Noto Serif', serif",
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 900,
              color: '#dbe2fb',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              margin: 0,
            }}>
              Workspace<span style={{ color: '#4f6ef7' }}>.</span>
            </h1>
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '1rem',
              color: '#71717a',
              marginTop: '16px',
              maxWidth: '400px',
              lineHeight: 1.6,
            }}>
              Curate your digital presence. {projects.length} {projects.length === 1 ? 'project' : 'projects'} in your workspace.
            </p>
          </div>
          <button
            onClick={() => navigate('/create-new-project')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: '#4f6ef7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6e88ff';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4f6ef7';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            New Project
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
            <div style={{ fontFamily: "'Manrope', sans-serif", color: '#71717a', fontSize: '0.9rem' }}>
              Loading projects...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: 'rgba(23, 31, 50, 0.5)',
            borderRadius: '20px',
            border: '2px dashed rgba(68, 70, 84, 0.3)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(79, 110, 247, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(79, 110, 247, 0.15)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#4f6ef7' }}>add_circle</span>
            </div>
            <h3 style={{
              fontFamily: "'Noto Serif', serif",
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#71717a',
              marginBottom: '8px',
            }}>
              Create Template
            </h3>
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.85rem',
              color: '#71717a',
              marginBottom: '24px',
            }}>
              Start with a curated layout
            </p>
            <button
              onClick={() => navigate('/create-new-project')}
              style={{
                padding: '12px 28px',
                background: 'rgba(79, 110, 247, 0.1)',
                color: '#b9c3ff',
                border: '1px solid rgba(79, 110, 247, 0.2)',
                borderRadius: '10px',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 110, 247, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(79, 110, 247, 0.1)'}
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
                    background: 'rgba(19, 27, 45, 0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(68, 70, 84, 0.15)',
                    transition: 'all 0.4s ease',
                    cursor: 'default',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(34, 42, 61, 0.8)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(19, 27, 45, 0.6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
                  }}
                >
                  {/* Thumbnail */}
                  {project.ThumbnailURL && (
                    <div style={{
                      height: isFirst ? '300px' : '200px',
                      overflow: 'hidden',
                      background: '#060e1f',
                    }}>
                      <img
                        src={project.ThumbnailURL}
                        alt={project.ProjectName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          opacity: 0.7,
                          transition: 'all 0.5s ease',
                        }}
                        draggable={false}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = '1';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = '0.7';
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
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background: 'rgba(79, 110, 247, 0.15)',
                          color: '#b9c3ff',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: "'Manrope', sans-serif",
                        }}>
                          Featured
                        </span>
                      </div>
                    )}

                    <h3 style={{
                      fontFamily: "'Noto Serif', serif",
                      fontSize: isFirst ? '1.5rem' : '1.15rem',
                      fontWeight: 700,
                      color: '#dbe2fb',
                      marginBottom: '6px',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {project.ProjectName || 'Untitled Project'}
                    </h3>

                    {project.ProjectDescription && (
                      <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '0.85rem',
                        color: '#71717a',
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
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: '0.75rem',
                      color: '#71717a',
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
                          background: 'rgba(79, 110, 247, 0.1)',
                          color: '#b9c3ff',
                          border: '1px solid rgba(79, 110, 247, 0.2)',
                          borderRadius: '8px',
                          fontFamily: "'Manrope', sans-serif",
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
                          e.target.style.background = '#4f6ef7';
                          e.target.style.color = 'white';
                          e.target.style.borderColor = '#4f6ef7';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(79, 110, 247, 0.1)';
                          e.target.style.color = '#b9c3ff';
                          e.target.style.borderColor = 'rgba(79, 110, 247, 0.2)';
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteClick(project.Project_ID)}
                        style={{
                          padding: '10px',
                          background: 'transparent',
                          color: '#71717a',
                          border: '1px solid rgba(68, 70, 84, 0.2)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ff6b6b';
                          e.currentTarget.style.borderColor = '#ff6b6b';
                          e.currentTarget.style.background = 'rgba(255,107,107,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#71717a';
                          e.currentTarget.style.borderColor = 'rgba(68, 70, 84, 0.2)';
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
    </div>
  );
}
