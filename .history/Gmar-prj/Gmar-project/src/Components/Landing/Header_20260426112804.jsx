  import { useEditor } from '@craftjs/core';
  import { Tooltip } from '@mui/material';
  import { Modal, Form, Alert, Button } from 'react-bootstrap';
  import cx from 'classnames';
  import React, { useEffect, useState } from 'react';
  import styled from 'styled-components';
  import { useUserContext } from '../../UserContextProvider';
  import html2canvas from 'html2canvas';
  import { exportToHtml } from '../../utils/exportToHtml';


const HeaderDiv = styled.div`
  width: 100%;
  height: 45px;
  z-index: 99999;
  position: relative;
  padding: 0px 10px;
  background: #f7f4ec;
  display: flex;
`;

const Btn = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  color: #fff;
  font-size: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  gap: 5px;
  white-space: nowrap;
  .material-symbols-outlined {
    font-size: 15px;
    color: #fff;
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
    color: #79747e;
    transition: color 0.15s ease;
  }
  &:hover {
    background: #e3f2fd;
    .material-symbols-outlined {
      color: #0060ac;
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



export const Header = () => {

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');


  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Landing Page');

  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  const { enabled, canUndo, canRedo, actions , query } = useEditor((state, query) => ({
    enabled: state.options.enabled,
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

 const { addproject } = useUserContext();
 

   useEffect(() => {
     const storedUser = localStorage.getItem('currentUser');
     if (storedUser) {
       setCurrentUser(JSON.parse(storedUser));
     }
   }, []);

   
 const openSaveModal = () => {
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
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
          allowTaint: false,
          logging: false
        });
        thumbnailData = canvas.toDataURL('image/jpeg', 0.8);
      }

      // Save as project
      const response = await
  fetch('http://localhost:3001/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: null,
          userId: currentUser.User_ID,
          projectName: projectName,
          projectDescription: projectDescription || null,
          componentCount: componentCount,
          projectSizeKB: projectSizeKB,
          projectData: jsonString,
          thumbnailUrl: thumbnailData  // ADD THIS
        })
      });

      const data = await response.json();

      if (response.ok) {
        // If save as template is checked
        if (saveAsTemplate && templateName) {
          await saveAsTemplateFunc(jsonString, componentCount);
        }

        showAlertModal(`Project saved successfully! ID:
  ${data.projectId}`, 'success');
        setShowSaveModal(false);
        setProjectName('');
        setProjectDescription('');
        setSaveAsTemplate(false);
        setTemplateName('');
      } else {
        showAlertModal(data.error || 'Failed to save project',
  'error');
      }
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
          backgroundColor: '#ffffff',
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
        const response = await
    fetch('http://localhost:3001/api/templates/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateName: templateName,
            category: templateCategory,
            projectData: projectData,
            componentCount: componentCount,
            createdBy: currentUser.User_ID,
            thumbnailData: thumbnailData
          })
        });

        if (response.ok) {
          showAlertModal('Template saved successfully!', 'success');
        }
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
  
  const deploy = async () => {
  const content = document.querySelector('.craftjs-renderer > .relative > .m-auto');

  if (!content) {
    alert('No content to deploy!');
    return;
  }

  if (!accessToken) {
    alert('Please enter your Netlify Personal Access Token');
    return;
  }

  localStorage.setItem('netlify_token', accessToken);

  const clone = content.cloneNode(true);

  // Remove editor-only attributes
  clone.querySelectorAll('[contenteditable]').forEach(el =>
    el.removeAttribute('contenteditable')
  );

  clone.querySelectorAll('[data-craft-node-id]').forEach(el =>
    el.removeAttribute('data-craft-node-id')
  );

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(projectName || 'My Website')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;

  await deployToNetlify(html, accessToken);
};

// optional but nice: avoid breaking <title> if user types <>
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

   


async function deployToNetlify(htmlString, token) {
  try {
    // 0️⃣ PREPARE CONTENT ACCURATELY
    // Convert string to UTF-8 Blob immediately. This ensures consistency.
    const encoder = new TextEncoder();
    const data = encoder.encode(htmlString);
    const blob = new Blob([data], { type: 'text/html' }); // We will upload this Blob
    
    // Calculate SHA1 of the exact data we will upload
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Prepared index.html SHA1:', sha1);

    // 1️⃣ Validate token (Optional but good)
    const userResponse = await fetch('https://api.netlify.com/api/v1/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userResponse.ok) throw new Error('Invalid Netlify token.');
    
    // 2️⃣ Get or Create Site
    // For testing, we create a new site. For prod, use a stored siteId.
    const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({}) // Creates a random site name
    });
    if (!siteResponse.ok) throw new Error('Failed to create site');
    const site = await siteResponse.json();
    console.log('Site created:', site.id);

    // 3️⃣ Create Deploy with known SHA1
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        files: {
          '/index.html': sha1  // Note the leading slash usually helps, though 'index.html' works too
        }
      })
    });

    if (!deployResponse.ok) throw new Error('Failed to create deploy');
    const deploy = await deployResponse.json();

    // 4️⃣ Check required files
    // If SHA1 matches what Netlify already has (rare for new sites), required might be empty.
    const requiredFiles = deploy.required || [];
    
    if (requiredFiles.length > 0) {
      console.log('Uploading required files:', requiredFiles);
      
      // We expect only one file (the sha1 we sent). 
      // If it asks for a different SHA, something is very wrong.
      const requiredHash = requiredFiles[0]; // This is the SHA1 Netlify is asking for
      
      if (requiredHash !== sha1) {
        console.warn(`Mismatch! Netlify wants ${requiredHash} but we prepared ${sha1}`);
        // In rare cases (e.g. empty file), logic might differ, but for HTML it should match.
      }

      // 5️⃣ Upload the Blob
      const uploadUrl = `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`; // Endpoint is /files/{path}

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'text/html' 
        },
        body: blob // Upload the exact binary data we hashed
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error('Upload failed: ' + errText);
      }
      console.log('Upload successful');
    } else {
      console.log('Netlify already had this file content (deduplication). No upload needed.');
    }

    // 6️⃣ Poll for readiness
    let state = deploy.state;
    let attempts = 0;
    while (state !== 'ready' && attempts < 20) {
      if (state === 'error') throw new Error('Deploy state is "error"');
      
      await new Promise(r => setTimeout(r, 1000));
      
      const checkResp = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys/${deploy.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const checkData = await checkResp.json();
      state = checkData.state;
      console.log('Deploy state:', state);
      attempts++;
    }

    const liveUrl = site.ssl_url || site.url;
    alert(`✅ Deployed! ${liveUrl}`);
    window.open(liveUrl, '_blank');

  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

const handlePublish = async () => {
    setPublishing(true);
    try {
      const json = query.serialize();
      const html = exportToHtml(JSON.parse(json), projectName);
      const res = await
  fetch('http://localhost:3001/api/publish-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: null, html, domain:
  customDomain || null })
      });
      const data = await res.json();
      if (data.success) {
        alert(customDomain
          ? `Published! Go to your domain registrar and add:\n\nA
  record: @ → your-server-ip\nCNAME: www → your-server-ip\n\nThen
  ${customDomain} will show your site.`
          : 'Site published!');
        setPublishModal(false);
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setPublishing(false);
  };

  return (
    <HeaderDiv className="header text-white transition w-full">
      <div className="items-center flex w-full px-4 justify-end">
        {enabled && (
          <div className="flex-1 flex">
            <Tooltip title="Undo" placement="bottom">
              <Item
                $disabled={!canUndo}
                onClick={() => canUndo && actions.history.undo()}
              >
                <span className="material-symbols-outlined">undo</span>
              </Item>
            </Tooltip>
            <Tooltip title="Redo" placement="bottom">
              <Item
                $disabled={!canRedo}
                onClick={() => canRedo && actions.history.redo()}
              >
                <span className="material-symbols-outlined">redo</span>
              </Item>
            </Tooltip>
          </div>
        )}
        <div className="flex" style={{ gap: '6px', alignItems: 'center' }}>
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
            {enabled ? 'Finish' : 'Edit'}
          </Btn>

            <Btn style={{ background: '#8b6f47' }} onClick={downloadHTML}>
              <span className="material-symbols-outlined">code</span>
              HTML
            </Btn>

          <Btn style={{ background: '#3b82c4' }} onClick={openSaveModal}>
            <span className="material-symbols-outlined">save</span>
            Save
          </Btn>

          <Btn style={{ background: '#4caf6a' ,cursor: 'pointer' }} onClick={() => setPublishModal(true)}>
            <span className="material-symbols-outlined">rocket_launch</span>
            Publish
          </Btn>

          <Btn style={{ background: '#7e57c2', cursor: accessToken ? 'pointer' : 'not-allowed', opacity: accessToken ? 1 : 0.5 }} onClick={deploy}>
            <span className="material-symbols-outlined">cloud_upload</span>
            Netlify
            <input
              type="text"
              placeholder="Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              style={{ width: '90px', padding: '3px 8px', borderRadius: '9999px', border: 'none', background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '11px', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </Btn>


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
  'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'white', padding: '32px',
  borderRadius: '20px', width: '420px', color: '#1c1b1f', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}>
        <h3 style={{ marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>Publish Your Site</h3>
        <label style={{ fontSize: '0.85rem', color: '#79747e' }}>Your
  Domain (optional)</label>
        <input
          placeholder="mysite.com"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '8px 0', background: '#f7f4ec', border: '1px solid #e8e0eb', borderRadius: '12px', color: '#1c1b1f', fontSize: '0.95rem', outline: 'none' }}
        />
        <p style={{ fontSize: '0.8rem', color: '#9994a0', marginBottom: '20px' }}>
          Buy a domain on <a href='https://www.namecheap.com/'>Namecheap</a> or <a href='https://www.godaddy.com/en'>GoDaddy</a>, then enter it here
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{ flex: 1, padding: '10px', background: publishing ? 'rgba(0,96,172,0.5)' : '#0060ac', color: 'white', border: 'none', borderRadius: '9999px', cursor: publishing ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={() => setPublishModal(false)}
            style={{ padding: '10px 20px', background: 'transparent', color: '#79747e', border: '1px solid #e8e0eb', borderRadius: '9999px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

              
    </HeaderDiv>
  );
};
