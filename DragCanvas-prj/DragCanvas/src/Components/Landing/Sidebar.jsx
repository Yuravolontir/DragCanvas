import cx from 'classnames';
import { useEditor } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import React, { useState } from 'react';
import styled from 'styled-components';

import { Toolbar } from './Toolbar';

const SidebarItemDiv = styled.div`
  height: ${(props) =>
    props.$visible && props.$height && props.$height !== 'full'
      ? `${props.$height}`
      : 'auto'};
  flex: ${(props) =>
    props.$visible && props.$height && props.$height === 'full'
      ? `1`
      : 'unset'};
  color: #49454f;
  border-bottom: 1px solid transparent;
  border-color: ${(props) => (props.$visible ? '#e8e0eb' : 'transparent')};
`;

const HeaderDiv = styled.div`
  color: #49454f;
  height: 45px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: #f7f4ec;
  border-bottom: 1px solid #e8e0eb;
  font-family: 'Plus Jakarta Sans', sans-serif;
  svg {
    fill: #79747e;
  }
  &:hover {
    background: #f0ece3;
  }
`;

const SidebarItem = ({ visible, icon, title, children, height, onChange, className }) => {
  return (
    <SidebarItemDiv
      $visible={visible}
      $height={height}
      className={cx('flex flex-col', className)}
    >
      <HeaderDiv
        onClick={() => {
          if (onChange) onChange(!visible);
        }}
        className={cx({ 'shadow-sm': visible })}
      >
        <div className="flex-1 flex items-center">
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px', color: '#79747e' }}>{icon}</span>
          <h2 className="text-xs uppercase" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{title}</h2>
        </div>
        <span className="material-symbols-outlined" style={{
          fontSize: '16px',
          color: '#79747e',
          transform: visible ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s ease',
        }}>expand_more</span>
      </HeaderDiv>
      {visible ? (
        <div className="w-full flex-1 overflow-auto">{children}</div>
      ) : null}
    </SidebarItemDiv>
  );
};

export const SidebarDiv = styled.div`
  width: 280px;
  opacity: ${(props) => (props.$enabled ? 1 : 0)};
  background: #f7f4ec;
  border-left: 1px solid #e8e0eb;
  margin-right: ${(props) => (props.$enabled ? 0 : -280)}px;
`;

export const Sidebar = () => {
  const [layersVisible, setLayerVisible] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <SidebarDiv $enabled={enabled} className="sidebar transition bg-white w-2">
      <div className="flex flex-col h-full">
        <SidebarItem
          icon="tune"
          title="Customize"
          height={!layersVisible ? 'full' : '55%'}
          visible={toolbarVisible}
          onChange={(val) => setToolbarVisible(val)}
          className="overflow-auto"
        >
          <Toolbar />
        </SidebarItem>
        <SidebarItem
          icon="layers"
          title="Layers"
          height={!toolbarVisible ? 'full' : '45%'}
          visible={layersVisible}
          onChange={(val) => setLayerVisible(val)}
        >
          <div className="">
            <Layers expandRootOnLoad={true} />
          </div>
        </SidebarItem>
      </div>
    </SidebarDiv>
  );
};
