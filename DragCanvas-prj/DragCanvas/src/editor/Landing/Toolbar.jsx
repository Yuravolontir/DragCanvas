import { useEditor } from '@craftjs/core';
import { ROOT_NODE } from '@craftjs/utils';
import React from 'react';

import { AnimationSettings } from './AnimationSettings';

export const Toolbar = () => {
  const { active, related, nodeProps, typeName } = useEditor((state, query) => {
    // TODO: handle multiple selected elements
    const currentlySelectedNodeId = query.getEvent('selected').first();
    const node = currentlySelectedNodeId && state.nodes[currentlySelectedNodeId];
    return {
      active: currentlySelectedNodeId,
      related: node && node.related,
      nodeProps: node?.data?.props,
      typeName: node?.data?.name || node?.data?.displayName,
    };
  });

  return (
    <div className="py-1 h-full">
      {active && related?.toolbar && React.createElement(related.toolbar)}
      {/*
        * Every element animates, so the entrance is edited in one panel for
        * whatever is selected rather than in forty element panels that would
        * drift apart. The page itself is the exception: the canvas as a whole
        * has nothing to arrive from.
        */}
      {active && active !== ROOT_NODE ? (
        <AnimationSettings nodeId={active} nodeProps={nodeProps} typeName={typeName} />
      ) : null}
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
