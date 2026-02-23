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
                        <Btn   className="ml-2 bg-blue-500" onClick={saveproject}>
           Netlify
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
        </div>
      </div>
    </HeaderDiv>
  );
};
