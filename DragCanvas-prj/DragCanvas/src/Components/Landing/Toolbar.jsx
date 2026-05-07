import { useEditor } from '@craftjs/core';
import React from 'react';

export * from './Toolbar/ToolbarItem';
export * from './Toolbar/ToolbarSection';
export * from './Toolbar/ToolbarTextInput';
export * from './Toolbar/ToolbarDropdown';

export const Toolbar = () => {
  const { active, related } = useEditor((state, query) => {
    // TODO: handle multiple selected elements
    const currentlySelectedNodeId = query.getEvent('selected').first();
    return {
      active: currentlySelectedNodeId,
      related:
        currentlySelectedNodeId && state.nodes[currentlySelectedNodeId].related,
    };
  });

  return (
    <div className="py-1 h-full">
      {active && related.toolbar && React.createElement(related.toolbar)}
      {!active && (
        <div
          className="px-5 py-2 flex flex-col items-center h-full justify-center text-center"
          style={{
            color: '#9994a0',
            fontSize: '12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#cac4d0', marginBottom: '12px' }}>touch_app</span>
          <h2 className="pb-1" style={{ fontWeight: 500 }}>Click on a component to start editing.</h2>
          <h2 style={{ fontWeight: 400 }}>
            You could also double click on the layers below to edit their names,
            like in Photoshop
          </h2>
        </div>
      )}
    </div>
  );
};
