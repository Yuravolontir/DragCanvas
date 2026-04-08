import cx from 'classnames';
import { useEditor } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import React, { useState } from 'react';
import styled from 'styled-components';

import { Customize, Layers as LayersIcon } from '../Icons';
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
  color: #545454;
  border-bottom: 1px solid transparent;
  border-color: ${(props) => (props.$visible ? '#eee' : 'transparent')};
`;

const Chevron = styled.a`
  transform: rotate(${(props) => (props.$visible ? 180 : 0)}deg);
  svg {
    width: 10px;
    height: 10px;
    fill: #707070;
  }
`;

const HeaderDiv = styled.div`
  color: #615c5c;
  height: 45px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: white;
  border-bottom: 1px solid #eee;
  svg {
    fill: #707070;
  }
  &:hover {
    background: #f5f5f5;
  }
`;

const SidebarItem = ({ visible, icon: Icon, title, children, height, onChange, className }) => {
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
          <Icon className="w-4 h-4 mr-2" style={{ width: '16px', height: '16px' }} />
          <h2 className="text-xs uppercase">{title}</h2>
        </div>
        <Chevron $visible={visible}>
          <svg viewBox="-2 -1 12 12">
            <path d="M7.41 8.59L12 13.17l1.41-1.41L9 7l4.41-4.41L12 1.17 7.41 5.75 2.99 1.17 1.59 2.59 7 8v.59z" transform="scale(0.6) translate(2, 2)" />
          </svg>
        </Chevron>
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
  background: #fff;
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
          icon={Customize}
          title="Customize"
          height={!layersVisible ? 'full' : '55%'}
          visible={toolbarVisible}
          onChange={(val) => setToolbarVisible(val)}
          className="overflow-auto"
        >
          <Toolbar />
        </SidebarItem>
        <SidebarItem
          icon={LayersIcon}
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
