import { useEditor } from '@craftjs/core';
import React from 'react';

import { RowField, RowPanel, RowToggle } from './Toolbar/ToolbarRows';
import { REPLAY_EVENT } from '../../useRevealAnimation.js';
import {
  ANIMATIONS,
  DEFAULT_ANIMATION,
  DEFAULT_DELAY,
  DEFAULT_DURATION,
  readAnimation,
} from '../../utils/animation.js';

const options = ANIMATIONS.map((entry) => ({ value: entry.value, label: entry.label }));

const replayButton = {
  width: '100%',
  marginTop: 2,
  border: '1px solid var(--outline-light)',
  borderRadius: 8,
  padding: '8px 12px',
  background: 'var(--surface-container)',
  color: 'var(--on-surface)',
  cursor: 'pointer',
  font: "700 12px/1.2 'Plus Jakarta Sans', sans-serif",
};

/**
 * How one element arrives on the page.
 *
 * Rendered for whatever is selected rather than added to each element's own
 * panel: every element animates, so forty copies of this would be forty places
 * to forget an option. It reads and writes through the editor's actions instead
 * of useNode, because the panel is a sibling of the element's own settings and
 * not one of its related components.
 */
export function AnimationSettings({ nodeId, nodeProps, typeName }) {
  const { actions } = useEditor();
  if (!nodeId) return null;

  const fallback = DEFAULT_ANIMATION[typeName] || 'none';
  const spec = readAnimation(nodeProps, fallback);
  const set = (key, value) => actions.setProp(nodeId, (props) => {
    props[key] = value;
  });

  const number = (key, value, fallbackMs) => {
    const parsed = Math.round(Number(value));
    set(key, Number.isFinite(parsed) ? Math.max(0, Math.min(4000, parsed)) : fallbackMs);
  };

  return (
    <section style={{ padding: '12px 10px', borderTop: '1px solid var(--outline-light)' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 8 }}>
        Animation
      </div>

      <RowPanel>
        <RowField
          label="How it arrives"
          kind="select"
          options={options}
          value={spec.name}
          hint={
            fallback !== 'none' && nodeProps?.animation === undefined
              ? 'Sections fade up unless you choose otherwise.'
              : 'Plays when the element scrolls into view.'
          }
          onChange={(event) => set('animation', event.target.value)}
        />

        {spec.name === 'none' ? null : (
          <React.Fragment>
            <RowField
              label="How long it takes (ms)"
              kind="number"
              min={0}
              max={4000}
              step={50}
              value={spec.duration}
              onChange={(event) => number('animationDuration', event.target.value, DEFAULT_DURATION)}
            />
            <RowField
              label="How long it waits first (ms)"
              kind="number"
              min={0}
              max={4000}
              step={50}
              value={spec.delay}
              hint="Give the blocks in a row 0, 100 and 200 and they arrive one after another."
              onChange={(event) => number('animationDelay', event.target.value, DEFAULT_DELAY)}
            />
            <RowToggle
              label="Play it again every time it scrolls back into view"
              checked={spec.repeat}
              onChange={(event) => set('animationRepeat', event.target.checked)}
            />
            <button
              type="button"
              style={replayButton}
              onClick={() => window.dispatchEvent(new CustomEvent(REPLAY_EVENT, { detail: { id: nodeId } }))}
            >
              Play it now
            </button>
          </React.Fragment>
        )}
      </RowPanel>
    </section>
  );
}
