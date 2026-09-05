import React, { useEffect, useRef, useState } from 'react';
import { useEditor, useNode } from '@craftjs/core';
import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowCard, RowField, RowList, RowPanel, RowToggle } from './Toolbar/ToolbarRows';
import { useRowProp } from './Toolbar/useRowProp.js';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import {
  readStatRows,
  emptyStatRow,
  statDisplay,
  statDisplayAtProgress,
  statsCountUp,
} from '../../utils/elementRows.js';
import { REPLAY_EVENT } from '../../useRevealAnimation.js';

/** How long the figures take to reach themselves. */
const COUNT_MS = 1000;

const prefersStillness = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A row of numbers worth saying out loud.
 *
 * The value is set large and the label small, which is the whole trick — a
 * number without a label is decoration, and a label without a number is a
 * sentence. Prefix and suffix are separate fields rather than something to type
 * into the number, so "$" and "+" can be styled with the figure and nobody has
 * to guess whether "99.9%" counts as a number.
 *
 * How the block arrives is not this element's business: every element fades or
 * slides in through the shared animation panel. What is this element's business
 * is the figures counting up to themselves, which is what `countUp` is.
 */
export const Stats = ({ items, accent, color, align, animation, countUp, animationRepeat }) => {
  const { id, connectors: { connect } } = useNode();
  const counting = statsCountUp({ countUp, animation });
  const { editorEnabled } = useEditor((state) => ({
    editorEnabled: state.options.enabled,
  }));
  const records = readStatRows({ items });
  const rootRef = useRef(null);
  const frameRef = useRef(0);

  // What one run of the count is keyed to. Craft hands back a fresh `items`
  // array on every edit, so the key is the text itself rather than the array:
  // retyping a number starts the count again, a re-render on its own does not.
  const run = [counting, editorEnabled, JSON.stringify(records.map(statDisplay))].join('|');

  // The reset happens while rendering rather than inside the effect. Zero has to
  // reach the screen before the total does, and an effect that zeroes plus an
  // observer that counts can land in the same React batch — the figures then
  // jump straight to their totals with nothing to watch.
  const [still] = useState(prefersStillness);
  const settled = !counting || still;
  const start = () => ({ run, progress: settled ? 1 : 0 });

  const [state, setState] = useState(start);
  if (state.run !== run) setState(start());
  const progress = state.run === run ? state.progress : start().progress;

  useEffect(() => {
    if (settled) return undefined;

    let cancelled = false;
    const settle = (progressed) => {
      setState((current) => (current.run === run ? { run, progress: progressed } : current));
    };

    const count = () => {
      if (cancelled) return;
      cancelAnimationFrame(frameRef.current);
      const started = performance.now();
      const tick = (now) => {
        if (cancelled) return;
        const linear = Math.min(1, (now - started) / COUNT_MS);
        settle(1 - Math.pow(1 - linear, 3));
        if (linear < 1) frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    };

    const rewind = () => {
      if (cancelled) return;
      cancelAnimationFrame(frameRef.current);
      settle(0);
    };

    // Counting again on the way back is the same choice the block's entrance
    // made, so it is the same switch rather than a second one that could
    // disagree with it.
    const repeat = animationRepeat === true;

    const replay = (event) => {
      if (event.detail?.id !== id) return;
      rewind();
      count();
    };
    window.addEventListener(REPLAY_EVENT, replay);

    let arrive = null;
    let leave = null;
    if ('IntersectionObserver' in window && rootRef.current) {
      arrive = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (!repeat) arrive.disconnect();
        count();
      }, { threshold: 0.12 });
      arrive.observe(rootRef.current);

      if (repeat) {
        leave = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) return;
          rewind();
        }, { threshold: 0 });
        leave.observe(rootRef.current);
      }
    } else {
      count();
    }

    return () => {
      cancelled = true;
      window.removeEventListener(REPLAY_EVENT, replay);
      arrive?.disconnect();
      leave?.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [run, settled, animationRepeat, id]);

  return (
    <div
      ref={(element) => {
        rootRef.current = element;
        if (element) connect(element);
      }}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(records.length, 1)}, minmax(0, 1fr))`,
        gap: 24,
        width: '100%',
        textAlign: align || 'center',
      }}
    >
      {records.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add your first number in the panel on the right</p>
      ) : records.map((row, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: accent ? `rgba(${Object.values(accent)})` : undefined,
          }}>
            {counting ? statDisplayAtProgress(row, progress) : statDisplay(row)}
          </span>
          {/*
            * Muted by its colour, not by opacity.
            *
            * This label used to be printed at 0.7, which reads as a tasteful
            * grey and measures as something else: across the fifteen templates
            * in the gallery the faded label landed between 2.82:1 and 4.27:1,
            * every one of them under the 4.5:1 a 14px label needs, and no tool
            * could see it because opacity is not a colour. An author who wants
            * a quieter label picks a quieter colour, which both the contrast
            * check and the generator's repair can actually read.
            */}
          <span style={{
            fontSize: 14,
            color: color ? `rgba(${Object.values(color)})` : undefined,
          }}>
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const StatsSettings = () => {
  const { props, setProp, rows, update, add, remove, move } = useRowProp('items', readStatRows, emptyStatRow);

  return (
    <React.Fragment>
      <ToolbarHelp title="Numbers" icon="bar_chart" examples={['$ · 1,200 · + · customers served']}>
        One card per figure. The number is shown large and what it counts is
        shown under it. Anything that goes before or after the figure — a
        currency sign, a plus, a percent — belongs in its own box so it lines up
        with the number rather than fighting it.
      </ToolbarHelp>

      <ToolbarSection title="Numbers">
        <RowList empty="No numbers yet." addLabel="Add number" onAdd={add}>
          {rows.map((row, index) => (
            <RowCard
              key={index}
              title={row.label || `Number ${index + 1}`}
              index={index}
              count={rows.length}
              onMove={move}
              onRemove={remove}
              removeLabel="Remove this number"
            >
              <RowField
                label="Before the number (optional)"
                placeholder="$"
                value={row.prefix}
                onChange={(e) => update(index, 'prefix', e.target.value)}
              />
              <RowField
                label="The number"
                placeholder="1,200"
                value={row.value}
                onChange={(e) => update(index, 'value', e.target.value)}
              />
              <RowField
                label="After the number (optional)"
                placeholder="+"
                value={row.suffix}
                onChange={(e) => update(index, 'suffix', e.target.value)}
              />
              <RowField
                label="What it counts"
                placeholder="sites published"
                value={row.label}
                onChange={(e) => update(index, 'label', e.target.value)}
              />
            </RowCard>
          ))}
        </RowList>
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <RowPanel>
          <RowToggle
            label="Count the figures up to themselves"
            checked={statsCountUp(props)}
            onChange={(event) => {
              const on = event.target.checked;
              setProp((draft) => {
                draft.countUp = on;
              });
            }}
          />
        </RowPanel>
        <ToolbarItem full={true} propKey="accent" type="color" label="Number colour" />
        <ToolbarItem full={true} propKey="color" type="color" label="Label colour" />
      </ToolbarSection>
    </React.Fragment>
  );
};

Stats.craft = {
  displayName: 'Stats',
  props: {
    items: [
      { prefix: '', value: '1,200', suffix: '+', label: 'sites published' },
      { prefix: '', value: '4', suffix: ' min', label: 'from prompt to live' },
      { prefix: '', value: '99.9', suffix: '%', label: 'uptime last year' },
    ],
    align: 'center',
    countUp: true,
    accent: { r: 0, g: 64, b: 224, a: 1 },
    color: { r: 67, g: 70, b: 86, a: 1 },
  },
  related: { toolbar: StatsSettings },
};
