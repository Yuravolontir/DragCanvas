import { useEditor } from '@craftjs/core';
import { Tooltip } from '@mui/material';
import cx from 'classnames';
import React from 'react';
import styled from 'styled-components';
import { useState } from 'react';
import { useUserContext } from '../../UserContextProvider';
import { Checkmark, Customize, Redo, Undo } from '../Icons';

const HeaderDiv = styled.div`
  width: 100%;
  height: 45px;
  z-index: 99999;
  position: relative;
  padding: 0px 10px;
  background: #d4d4d4;
  display: flex;
`;

const Btn = styled.a`
  display: flex;
  align-items: center;
  padding: 5px 15px;
  border-radius: 3px;
  color: #fff;
  font-size: 13px;
  text-decoration: none;
  svg {
    margin-right: 6px;
    width: 12px;
    height: 12px;
    fill: #fff;
    opacity: 0.9;
  }
`;

const Item = styled.a`
  margin-right: 10px;
  cursor: pointer;
  svg {
    width: 20px;
    height: 20px;
    fill: #707070;
  }
  ${(props) =>
    props.$disabled &&
    `
    opacity:0.5;
    cursor: not-allowed;
  `}
`;



export const Header = () => {

  const [projectName, setProjectName] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const { enabled, canUndo, canRedo, actions , query } = useEditor((state, query) => ({
    enabled: state.options.enabled,
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

 const { addproject } = useUserContext();
 
  const saveproject = () => {
if (!projectName) {

  return;
}
else {
      const jsonContent = query.serialize();
      console.log('Saving...');
      addproject(projectName,jsonContent);
}
}

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
                <Undo />
              </Item>
            </Tooltip>
            <Tooltip title="Redo" placement="bottom">
              <Item
                $disabled={!canRedo}
                onClick={() => canRedo && actions.history.redo()}
              >
                <Redo />
              </Item>
            </Tooltip>
          </div>
        )}
        <div className="flex">
          <Btn
            className={cx([
              'transition cursor-pointer',
              {
                'bg-green-400': enabled,
                'bg-primary': !enabled,
              },
            ])}
            onClick={() => {
              actions.setOptions((options) => (options.enabled = !enabled));
            }}
          >
            {enabled ? (
              <Checkmark viewBox="-3 -3 20 20" />
            ) : (
              <Customize viewBox="2 0 16 16" />
            )}
            {enabled ? 'Finish Editing' : 'Edit'}
          </Btn>
          <Btn   className="ml-2 bg-blue-500" onClick={saveproject}>
            Save
            <input
    type="text"
    placeholder="Project Name"
    value={projectName}
    onChange={(e) => setProjectName(e.target.value)}
    className="ml-2 p-1 rounded"
    style={{ width: '150px' }}
  />
  {!projectName && (
    <small className="ml-2 text-danger">* Required</small>                                               
  )}
          </Btn>
            <Btn className="ml-2 bg-purple-500"
  onClick={downloadHTML}>
              <Checkmark viewBox="-3 -3 20 20" />
              Get HTML
            </Btn>


<Btn   className="ml-2 bg-blue-500" onClick={deploy}>
           Netlify
            <input
    type="text"
    placeholder="Personal Access Token"
    value={accessToken}
    onChange={(e) => setAccessToken(e.target.value)}
    className="ml-2 p-1 rounded"
    style={{ width: '150px' }}
  />
  {!accessToken && (
    <small className="ml-2 text-danger">* Required</small>                                               
  )}
          </Btn>


        </div>
      </div>
    </HeaderDiv>
  );
};
