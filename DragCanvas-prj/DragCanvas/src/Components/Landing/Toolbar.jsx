import { useEditor } from '@craftjs/core';
import React from 'react';

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
          className="px-6 py-5 flex flex-col items-center h-full justify-center text-center"
          style={{
            color: 'var(--hint)',
            fontSize: '12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '38px', color: '#9ec7ea', marginBottom: '14px' }}>ads_click</span>
          <h2 className="pb-2" style={{ fontWeight: 700, color: 'var(--on-surface-variant)', fontSize: '14px' }}>Select an element</h2>
          <p style={{ fontWeight: 400, lineHeight: 1.55, margin: 0 }}>
            Click anything on the canvas to edit its content and appearance here.
          </p>
        </div>
      )}
    </div>
  );
};
