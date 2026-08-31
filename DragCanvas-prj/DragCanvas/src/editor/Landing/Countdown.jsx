import React, { useEffect, useState } from 'react';
import { useNode } from '@craftjs/core';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowField, RowPanel } from './Toolbar/ToolbarRows';
import {
  countdownParts,
  countdownTarget,
  fromLocalInput,
  toLocalInput,
} from '../../utils/elementRows.js';

/**
 * A live deadline.
 *
 * The panel used to ask for a "Target (ISO date)" and did nothing with anything
 * else, so an empty box or anything typed in ordinary words produced a row of
 * NaNs on the canvas and on the published page. The field is a real date and
 * time picker now, and an unreadable value reads as "no deadline set" and shows
 * zeros rather than breaking.
 *
 * The canvas counts down for real, because a countdown that does not move gives
 * no way to tell a working deadline from a broken one.
 */
const pad = (n) => String(n).padStart(2, '0');

export const Countdown = ({ target, label, expiredText, accent }) => {
  const { connectors: { connect } } = useNode();
  const at = countdownTarget(target);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (at === null) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [at]);

  const left = countdownParts(at, now);

  return (
    <div ref={connect} style={{ width: '100%', textAlign: 'center' }}>
      <strong style={{ display: 'block', color: accent ? `rgba(${Object.values(accent)})` : undefined, fontSize: 32 }}>
        {[left.days, left.hours, left.minutes, left.seconds].map(pad).join(' : ')}
      </strong>
      <span>{left.expired ? (expiredText || 'This offer has ended.') : (label || 'Time remaining')}</span>
    </div>
  );
};

const CountdownSettings = () => {
  const {
    target,
    actions: { setProp },
  } = useNode((node) => ({ target: node.data.props.target }));

  const local = toLocalInput(target);
  const parsed = countdownTarget(target);
  const typed = String(target || '').trim();

  return (
    <React.Fragment>
      <ToolbarHelp title="Countdown" icon="timer">
        Counts down to a moment you choose, in days, hours, minutes and seconds.
        Pick the date and time in your own clock — every visitor sees the same
        instant, converted to theirs. When it reaches zero the counter stops at
        all zeros and the line underneath changes to the ended message.
      </ToolbarHelp>

      <ToolbarSection title="When it ends">
        <RowPanel>
          <RowField
            label="Date and time"
            kind="datetime-local"
            value={local}
            hint={
              typed && parsed === null
                ? 'The saved value could not be read as a date. Pick one here to replace it.'
                : 'Set in your own time zone. Leave empty for no deadline.'
            }
            onChange={(e) =>
              setProp((draft) => {
                draft.target = fromLocalInput(e.target.value);
              })
            }
          />
        </RowPanel>
      </ToolbarSection>

      <ToolbarSection title="Wording">
        <ToolbarItem full={true} propKey="label" type="text" label="Line under the numbers" placeholder="Offer ends in" />
        <ToolbarItem full={true} propKey="expiredText" type="text" label="After it reaches zero" placeholder="This offer has ended." />
      </ToolbarSection>

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="accent" type="color" label="Number colour" />
      </ToolbarSection>
    </React.Fragment>
  );
};

Countdown.craft = {
  displayName: 'Countdown',
  props: {
    target: '2030-01-01T00:00:00Z',
    label: 'Offer ends in',
    expiredText: 'This offer has ended.',
    accent: { r: 0, g: 96, b: 172, a: 1 },
  },
  related: { toolbar: CountdownSettings },
};
