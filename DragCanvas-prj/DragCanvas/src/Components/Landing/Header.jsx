import { apiFetch } from '../../api.js';
  import { useEditor } from '@craftjs/core';
  import { Tooltip } from '@mui/material';
  import { Modal, Form, Alert, Button } from 'react-bootstrap';
  import cx from 'classnames';
  import React, { useEffect, useState } from 'react';
  import styled from 'styled-components';
  import { useLocation } from 'react-router-dom';
  import html2canvas from 'html2canvas';
  import { exportToHtml } from '../../utils/exportToHtml';
  import PublishInfoModal from '../PublishInfoModal';
  import AuthPromptModal from '../AuthPromptModal';

const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:8000';


const HeaderDiv = styled.div`
  width: 100%;
  min-height: 56px;
  z-index: 99999;
  position: relative;
  padding: 0 12px;
  background: color-mix(in oklab, var(--surface) 96%, transparent);
  border-bottom: 1px solid var(--outline-light, var(--outline-light));
  box-shadow: 0 2px 12px color-mix(in oklab, var(--paper) 7%, transparent);
  display: flex;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  color: 'var(--on-primary)';
  font-size: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  text-decoration: none;
  border: 0;
  transition: all 0.15s ease;
  gap: 5px;
  white-space: nowrap;
  .material-symbols-outlined {
    font-size: 15px;
    color: 'var(--on-primary)';
  }
  &:hover {
    filter: brightness(1.08);
  }
`;

const Item = styled.a`
  margin-right: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 20px;
    color: var(--muted);
    transition: color 0.15s ease;
  }
  &:hover {
    background: #e3f2fd;
    .material-symbols-outlined {
      color: var(--primary, var(--primary));
    }
  }
  ${(props) =>
    props.$disabled &&
    `
    opacity:0.5;
    cursor: not-allowed;
    pointer-events: none;
  `}
`;

const Divider = styled.span`
  width: 1px;
  height: 26px;
  background: var(--outline-light, var(--outline-light));
  margin: 0 4px;
`;



export const Header = () => {

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  // Read once during the first render rather than in an effect: the value is
  // already known, and setting it from an effect made the component render
  // twice on every mount.
  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');


  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Landing Page');

  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [publishTarget, setPublishTarget] = useState('netlify');
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [publishInfoOpen, setPublishInfoOpen] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const location = useLocation();
  const projectId = location.state?.projectId || savedProjectId;

  const { enabled, canUndo, canRedo, actions , query } = useEditor((state, query) => ({
    enabled: state.options.enabled,
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

 

   // If the loaded project was published before, restore its live URL (for the Published chip)
   useEffect(() => {
     if (!projectId || !currentUser) return;
     apiFetch(`/api/projects/${projectId}`)
       .then((project) => {
         if (project?.PublishedUrl) setPublishedUrl(project.PublishedUrl);
       })
       .catch(() => {});
   }, [projectId, currentUser]);

   
 // Anonymous user hit a registered-only action: keep their canvas as a
 // draft (restored by LoadProjectOnMount after signup) and show the prompt.
 const promptSignup = () => {
    try {
      localStorage.setItem('dragcanvas_draft', query.serialize());
    } catch {
      // canvas not serializable — still show the prompt
    }
    setShowAuthPrompt(true);
  }

 const openSaveModal = () => {
    if (!currentUser) {
      promptSignup();
      return;
    }
    setShowSaveModal(true);
  }

  const showAlertModal = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const saveproject = async () => {
    try {
      const jsonData = query.serialize();
      const jsonString = JSON.stringify(jsonData);
      const projectSizeKB = (jsonString.length / 1024).toFixed(2);
      const nodes = Object.keys(jsonData).filter(key => key !==
  'ROOT');
      const componentCount = nodes.length;

      // Generate thumbnail
      let thumbnailData = null;
      const canvasElement =
  document.querySelector('.craftjs-renderer > .relative > .m-auto');
      if (canvasElement) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await html2canvas(canvasElement, {
          backgroundColor: 'var(--surface)',
          scale: 1,
          useCORS: true,
          allowTaint: false,
          logging: false
        });
        thumbnailData = canvas.toDataURL('image/jpeg', 0.8);
      }

      // Save as project
      const data = await apiFetch('/api/projects/save', {
        method: 'POST',
        body: {
          projectId: null,
          projectName: projectName,
          projectDescription: projectDescription || null,
          componentCount: componentCount,
          projectSizeKB: projectSizeKB,
          projectData: jsonString,
          thumbnailUrl: thumbnailData
        }
      });

      // If "save as template" is checked, store it as a template too
      if (saveAsTemplate && templateName) {
        await saveAsTemplateFunc(jsonString, componentCount);
      }

      setSavedProjectId(data.projectId);
      showAlertModal(`Project saved successfully! ID: ${data.projectId}`, 'success');
      setShowSaveModal(false);
      setProjectName('');
      setProjectDescription('');
      setSaveAsTemplate(false);
      setTemplateName('');
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

      // Generate thumbnail and save template
    const saveAsTemplateFunc = async (projectData, componentCount) =>
     {
      try {
        // Capture preview from canvas
        const canvasElement = document.querySelector('.craftjs-renderer > .relative > .m-auto');
        if (!canvasElement) {
          showAlertModal('Could not generate template preview',
    'error');
          return;
        }

        // Wait a bit for any pending renders
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(canvasElement, {
          backgroundColor: 'var(--surface)',
          scale: 1,
          useCORS: true,
          allowTaint: false,
          logging: false,
          windowWidth: canvasElement.scrollWidth,
          windowHeight: canvasElement.scrollHeight,
          scrollX: 0,
          scrollY: 0
        });

        // Convert to base64
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.8);

        console.log('Thumbnail generated, size:', thumbnailData.length);

        // Save template
        await apiFetch('/api/templates/save', {
          method: 'POST',
          body: {
            templateName: templateName,
            category: templateCategory,
            projectData: projectData,
            componentCount: componentCount,
            thumbnailData: thumbnailData
          }
        });

        showAlertModal('Template saved successfully!', 'success');
      } catch (err) {
        console.error('Save template error:', err);
        showAlertModal('Failed to save template: ' + err.message,
    'error');
      }
    };



const downloadHTML = () => {
  const content = document.querySelector(
    '.craftjs-renderer > .relative > .m-auto'
  );

  if (!content) return;

  const clone = content.cloneNode(true);

  // Remove Craft-specific attributes
  clone.querySelectorAll('[contenteditable]').forEach(el =>
    el.removeAttribute('contenteditable')
  );

  clone.querySelectorAll('[data-craft-node-id]').forEach(el =>
    el.removeAttribute('data-craft-node-id')
  );

  // Remove class names (optional)
  clone.querySelectorAll('*').forEach(el => {
    el.removeAttribute('class');
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${projectName || 'My Website'}</title>
</head>
<body>
${clone.outerHTML}
</body>
</html>
`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName || 'website'}.html`;
  a.click();

  URL.revokeObjectURL(url);
  }

const handlePublish = async () => {
    if (!projectId) {
      setPublishModal(false);
      showAlertModal('Please save your project first, then publish.', 'error');
      return;
    }
    if (publishTarget === 'custom' && !customDomain.trim()) {
      alert('Please enter your domain');
      return;
    }
    setPublishing(true);
    try {
      const json = query.serialize();
      const html = exportToHtml(JSON.parse(json), projectName, { projectId });
      const data = await apiFetch('/api/publish/site', {
        method: 'POST',
        body: {
          projectId,
          html,
          target: publishTarget,
          domain: publishTarget === 'custom' ? customDomain.trim() : null
        }
      });

      if (publishTarget === 'custom') {
        setPublishModal(false);
        showAlertModal(`Published! Go to your domain registrar and add:\nA record: @ → your-server-ip\nCNAME: www → your-server-ip\nThen ${customDomain} will show your site.`, 'success');
      } else {
        setPublishedUrl(data.publishedUrl);
        setPublishModal(false);
        setPublishInfoOpen(true);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setPublishing(false);
  };

  return (
    <HeaderDiv className="header text-white transition w-full">
      <div className="items-center flex w-full px-2 justify-end">
        {enabled && (
          <div className="flex-1 flex">
            <Tooltip title="Undo last change" placement="bottom">
              <Item
                $disabled={!canUndo}
                onClick={() => canUndo && actions.history.undo()}
              >
                <span className="material-symbols-outlined">undo</span>
              </Item>
            </Tooltip>
            <Tooltip title="Redo last change" placement="bottom">
              <Item
                $disabled={!canRedo}
                onClick={() => canRedo && actions.history.redo()}
              >
                <span className="material-symbols-outlined">redo</span>
              </Item>
            </Tooltip>
          </div>
        )}
        <div className="flex" style={{ gap: '7px', alignItems: 'center' }}>
          <Btn
            className={cx([
              'transition cursor-pointer',
              {
                'bg-green-600': enabled,
                'bg-blue-600': !enabled,
              },
            ])}
            onClick={() => {
              actions.setOptions((options) => (options.enabled = !enabled));
            }}
          >
            <span className="material-symbols-outlined">{enabled ? 'check_circle' : 'edit'}</span>
            {enabled ? 'Preview' : 'Edit page'}
          </Btn>

          <Divider />

          <Tooltip title="Download the page as an HTML file" placement="bottom">
            <Btn style={{ background: '#675f58',cursor: 'pointer' }} onClick={() => (currentUser ? downloadHTML() : promptSignup())}>
              <span className="material-symbols-outlined">download</span>
              Export
            </Btn>
          </Tooltip>

          <Btn style={{ background: '#3b82c4',cursor: 'pointer' }} onClick={openSaveModal}>
            <span className="material-symbols-outlined">save</span>
            Save project
          </Btn>

          <Btn style={{ background: '#4caf6a' ,cursor: 'pointer' }} onClick={() => (currentUser ? setPublishModal(true) : promptSignup())}>
            <span className="material-symbols-outlined">rocket_launch</span>
            Publish
          </Btn>

          {publishedUrl && (
            <Tooltip title="Your site is live — link & QR" placement="bottom">
              <Btn style={{ background: 'var(--primary)', cursor: 'pointer', marginLeft: '6px' }} onClick={() => setPublishInfoOpen(true)}>
                <span className="material-symbols-outlined">qr_code_2</span>
                Live
              </Btn>
            </Tooltip>
          )}

        </div>
      </div>
                {/* Save Project Modal */}
            <Modal show={showSaveModal} onHide={() =>
            setShowSaveModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Save Project</Modal.Title>
              </Modal.Header>
               <Modal.Body>
                  <Form.Group>
                    <Form.Label>Project Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={(e) =>
  setProjectName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mt-3">
                    <Form.Label>Project Description</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter project description"
                      value={projectDescription}
                      onChange={(e) =>
  setProjectDescription(e.target.value)}
                    />
                  </Form.Group>

                  {/* Show template options only for admins */}
                  {(currentUser?.IsAdmin ||
  currentUser?.IsSuperAdmin) && (
                    <Form.Group className="mt-3">
                      <Form.Check
                        type="checkbox"
                        label="Save as Template (available to all
  users)"
                        checked={saveAsTemplate}
                        onChange={(e) =>
  setSaveAsTemplate(e.target.checked)}
                      />
                      {saveAsTemplate && (
                        <>
                          <Form.Control
                            className="mt-2"
                            type="text"
                            placeholder="Template Name"
                            value={templateName}
                            onChange={(e) =>
  setTemplateName(e.target.value)}
                          />
                          <Form.Select
                            className="mt-2"
                            value={templateCategory}
                            onChange={(e) =>
  setTemplateCategory(e.target.value)}
                          >
                            <option value="Landing Page">Landing
  Page</option>
                            <option
  value="Portfolio">Portfolio</option>
                            <option value="Blog">Blog</option>
                            <option
  value="E-commerce">E-commerce</option>
                          </Form.Select>
                        </>
                      )}
                    </Form.Group>
                  )}
                </Modal.Body>
              <Modal.Footer>
              <Button variant="secondary" onClick={() =>
              setShowSaveModal(false)}>Cancel</Button>
                <button variant="primary" onClick={saveproject}
            disabled={!projectName}>Save</button>
              </Modal.Footer>
            </Modal>
                  
              {/* Alert Modal */}
              <Modal show={showAlert} onHide={() => setShowAlert(false)}
        centered>
                <Modal.Header closeButton className={alertType ===
        'success' ? 'text-success' : 'text-danger'}>
                  <Modal.Title>{alertType === 'success' ? 'Success' :
        'Error'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Alert variant={alertType === 'success' ? 'success' :
        'danger'}>
                    {alertMessage}
                  </Alert>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="primary" onClick={() =>
        setShowAlert(false)}>OK</Button>
                </Modal.Footer>
              </Modal>

  {publishModal && (
    <div style={{ position: 'fixed', inset: 0, background:
  'var(--shadow-md)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'var(--surface)', padding: '32px',
  borderRadius: '20px', width: '420px', color: 'var(--on-surface)', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}>
        <h3 style={{ marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>Publish Your Site</h3>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', marginBottom: '10px', background: publishTarget === 'netlify' ? 'var(--primary-light)' : 'var(--surface-dim)', border: `1px solid ${publishTarget === 'netlify' ? 'var(--primary)' : 'var(--outline-light)'}`, borderRadius: '12px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="publishTarget"
            checked={publishTarget === 'netlify'}
            onChange={() => setPublishTarget('netlify')}
            style={{ marginTop: '3px' }}
          />
          <span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Netlify subdomain</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--hint)' }}>Free instant URL (*.netlify.app) + QR code</span>
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', marginBottom: '10px', background: publishTarget === 'custom' ? 'var(--primary-light)' : 'var(--surface-dim)', border: `1px solid ${publishTarget === 'custom' ? 'var(--primary)' : 'var(--outline-light)'}`, borderRadius: '12px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="publishTarget"
            checked={publishTarget === 'custom'}
            onChange={() => setPublishTarget('custom')}
            style={{ marginTop: '3px' }}
          />
          <span style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>My own domain</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--hint)' }}>
              Buy a domain on <a href='https://www.namecheap.com/'>Namecheap</a> or <a href='https://www.godaddy.com/en'>GoDaddy</a>, then enter it here
            </span>
            {publishTarget === 'custom' && (
              <input
                placeholder="mysite.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                style={{ width: '100%', padding: '10px', margin: '8px 0 0', background: 'var(--surface)', border: '1px solid var(--outline-light)', borderRadius: '12px', color: 'var(--on-surface)', fontSize: '0.95rem', outline: 'none' }}
              />
            )}
          </span>
        </label>

        <div style={{ marginBottom: '10px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{ flex: 1, padding: '10px', background: publishing ? 'color-mix(in oklab, var(--primary) 55%, transparent)' : 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '9999px', cursor: publishing ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={() => setPublishModal(false)}
            style={{ padding: '10px 20px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--outline-light)', borderRadius: '9999px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

  <PublishInfoModal
    show={publishInfoOpen}
    url={publishedUrl}
    onClose={() => setPublishInfoOpen(false)}
  />

  <AuthPromptModal
    show={showAuthPrompt}
    onClose={() => setShowAuthPrompt(false)}
  />

    </HeaderDiv>
  );
};
