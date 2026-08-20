import { useEditor } from '@craftjs/core';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toolbox } from './Toolbox';

import  AIAssistant  from
  '../../AIAssistant';
import { deviceModeForWidth } from '../../utils/deviceModes.js';
import { DeviceModeProvider } from '../../DeviceModeProvider.jsx';

  const ViewportDiv = styled.div`
    .viewport {
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .device-canvas {
      container-type: inline-size;
      container-name: editor-canvas;
    }

    @container editor-canvas (max-width: 767px) {
      .dc-columns:not(.dc-columns--hold) {
        grid-template-columns: 1fr !important;
      }
    }
  `;

export const Viewport = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState(() => deviceModeForWidth(window.innerWidth));
  const pageRef = useRef(null);
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

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;
    const update = () => setDeviceMode(deviceModeForWidth(page.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  return (
    <DeviceModeProvider value={deviceMode}>
    <ViewportDiv>
      <div className="viewport">
        <div className="flex h-full overflow-hidden flex-row w-full">
          <Toolbox />
          <div ref={pageRef} className="page-container flex flex-1 h-full flex-col">
            <Header />
            <div
              // `paper` is not decoration: what is rendered below is the user's own
              // website, drawn by the components that will draw it once published.
              // Letting the editor's dark palette reach it would mean designing
              // against one set of colours and shipping another.
              className={`craftjs-renderer paper flex-1 h-full w-full transition pb-8 overflow-auto ${enabled ? '' : ''}`}
              style={{ background: enabled ? 'var(--surface-dim, #f7f4ec)' : 'transparent' }}
              ref={(ref) => {
                connectors.select(connectors.hover(ref, null), null);
              }}
            >
              <div
                className="relative flex-col flex items-center pt-8"
                style={{ minWidth: 'min-content' }}
              >
                <div
                  className="device-canvas"
                  data-device={deviceMode}
                  aria-label={`${deviceMode} responsive preview`}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minHeight: '100%',
                  }}
                >
                  <AIAssistant/>
                  {children}
                </div>
              </div>
            </div>
          </div>

          <Sidebar />

        </div>
      </div>
    </ViewportDiv>
    </DeviceModeProvider>
  );
};
