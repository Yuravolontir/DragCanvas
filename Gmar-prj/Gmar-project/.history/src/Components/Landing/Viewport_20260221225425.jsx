import { useEditor } from '@craftjs/core';
import React, { useEffect } from 'react';
import styled from 'styled-components';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toolbox } from './Toolbox';

import  AIAssistant  from
  '../../AIAssistant';

  const ViewportDiv = styled.div`
    .viewport {
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
    }
  `;

export const Viewport = ({ children }) => {
  const {
    enabled,
    connectors,
    actions: { setOptions },
  } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  useEffect(() => {
    if (!window) {
      return;
    }

    window.requestAnimationFrame(() => {
      setTimeout(() => {
        setOptions((options) => {
          options.enabled = true;
        });
      }, 200);
    });
  }, [setOptions]);

  return (
    <ViewportDiv>
      <div className="viewport">
        <div className="flex h-full overflow-hidden flex-row w-full">
          <Toolbox />
          <div className="page-container flex flex-1 h-full flex-col">
            <Header />
            <div
              className={`craftjs-renderer flex-1 h-full w-full transition pb-8 overflow-auto ${enabled ? 'bg-gray-100' : ''}`}
              ref={(ref) => {
                connectors.select(connectors.hover(ref, null), null);
              }}
            >
              <div className="relative flex-col flex items-center pt-8">
                {children}
              </div>
            </div>
          </div>
          <AIAssistant/>
          <Sidebar />
           
        </div>
      </div>
    </ViewportDiv>
  );
};
