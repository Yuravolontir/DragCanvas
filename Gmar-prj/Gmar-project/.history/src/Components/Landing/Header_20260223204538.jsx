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
  const content = document.querySelector(
    '.craftjs-renderer > .relative > .m-auto'
  );

  if (!content) {
    alert('No content to deploy!');
    return;
  }

  if (!accessToken) {
    alert('Please enter your Netlify Personal Access Token');
    return;
  }

  localStorage.setItem('netlify_token', accessToken);

  // Clone content (DO NOT remove classes)
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
  <title>${projectName || 'My Website'}</title>

  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;

  await deployToNetlify(html, accessToken);
};
   


async function deployToNetlify(html, token) {
  try {
    // 1️⃣ Validate token
    const userResponse = await fetch(
      'https://api.netlify.com/api/v1/user',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!userResponse.ok) {
      throw new Error('Invalid Netlify token');
    }

    const user = await userResponse.json();
    console.log('Deploying as:', user.email);

    // 2️⃣ Create site
    const siteResponse = await fetch(
      'https://api.netlify.com/api/v1/sites',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    if (!siteResponse.ok) {
      throw new Error('Failed to create site');
    }

    const site = await siteResponse.json();
    console.log('Site created:', site.id);

    // 3️⃣ Create deploy
    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    if (!deployResponse.ok) {
      throw new Error('Failed to create deploy');
    }

    const deploy = await deployResponse.json();
    console.log('Deploy created:', deploy.id);

    // 4️⃣ Upload index.html
    const uploadResponse = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/html'
        },
        body: html
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error('Upload failed: ' + errorText);
    }

    console.log('File uploaded');

    // 5️⃣ Wait for deploy to be ready
    let deployReady = false;

    while (!deployReady) {
      await new Promise(r => setTimeout(r, 2000));

      const statusResponse = await fetch(
        `https://api.netlify.com/api/v1/deploys/${deploy.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const deployStatus = await statusResponse.json();
      console.log('Deploy state:', deployStatus.state);

      if (deployStatus.state === 'ready') {
        deployReady = true;
      }

      if (deployStatus.state === 'error') {
        throw new Error('Deploy processing failed');
      }
    }

    // 6️⃣ Open live site
    const siteUrl = deploy.ssl_url || deploy.url;

    await navigator.clipboard.writeText(siteUrl);
    window.open(siteUrl, '_blank');

    alert(`✅ Deployed!\n\nURL copied to clipboard:\n${siteUrl}`);

  } catch (error) {
    console.error(error);
    alert('❌ ' + error.message);
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
