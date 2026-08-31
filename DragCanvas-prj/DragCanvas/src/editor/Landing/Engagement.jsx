import React from 'react';
import { readableInkCss } from '../../utils/readableInk.js';
import { useNode } from '@craftjs/core';

import { ToolbarSection } from './Toolbar/ToolbarSection';
import { ToolbarItem } from './Toolbar/ToolbarItem';
import { ToolbarHelp } from './Toolbar/ToolbarHelp';
import { RowField, RowInlineField, RowList, RowPanel } from './Toolbar/ToolbarRows';
import { engagementMode, readEngagementOptions } from '../../utils/elementRows.js';

/**
 * What visitors think, collected on the page.
 *
 * Three shapes of the same thing: a moderated review board, a row of reactions,
 * or a poll. All three post to the same endpoint; only the wording and the
 * controls differ.
 *
 * Two faults are fixed here and both took the whole editor down rather than
 * just this element:
 *
 *   - the settings panel read `node.actions.setProp` inside its collector. The
 *     collector is handed the stored Node, which has no `actions` at all, so
 *     selecting the element threw before it could render anything. Actions come
 *     from the hook's return value, not from the node.
 *   - the element called `.map` on `props.options` directly. Saved data has
 *     held a string and a null there, and both threw during render, which in
 *     React 19 unmounts the tree above it — the blank page people saw.
 */
const HELP = {
  review: 'Visitors write a review and it waits for your approval before anyone else sees it.',
  reaction: 'One tap per visitor on a row of reactions. Each browser can respond once.',
  poll: 'One question, a set of answers, one response per browser.',
};

export const Engagement = ({ mode, heading, options, accent }) => {
  const { connectors: { connect } } = useNode();
  const kind = engagementMode({ mode });
  const choices = readEngagementOptions({ options });
  const bg = accent ? `rgba(${Object.values(accent)})` : '#0060ac';
  const control = {
    display: 'block', width: '100%', padding: 10, margin: '8px 0',
    border: '1px solid #ccc', borderRadius: 8, font: 'inherit', boxSizing: 'border-box',
  };
  const button = {
    padding: '10px 14px', border: 0, borderRadius: 8, background: bg,
    color: readableInkCss(accent), font: 'inherit', cursor: 'default',
  };

  return (
    <section ref={connect} style={{ width: '100%', padding: 20, border: '1px solid #ddd', borderRadius: 12 }}>
      <h3 style={{ marginTop: 0 }}>{heading || 'Your opinion'}</h3>
      {kind === 'review' ? (
        <React.Fragment>
          <input style={control} placeholder="Your name" disabled readOnly />
          <textarea style={{ ...control, minHeight: 72 }} placeholder="Your review" disabled readOnly />
          <button type="button" style={button} disabled>Submit for approval</button>
        </React.Fragment>
      ) : choices.length === 0 ? (
        <p style={{ opacity: 0.5, margin: 0 }}>Add the answers visitors can choose in the panel on the right</p>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {choices.map((choice, i) => (
            <button key={i} type="button" style={button} disabled>{choice}</button>
          ))}
        </div>
      )}
    </section>
  );
};

const EngagementSettings = () => {
  /*
   * The collector reads the stored node; the actions come from the hook. Doing
   * it the other way round is what used to blank the editor the moment this
   * element was selected.
   */
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props }));

  const kind = engagementMode(props || {});
  const choices = readEngagementOptions(props || {});

  const writeOptions = (next) =>
    setProp((draft) => {
      draft.options = next;
    });

  return (
    <React.Fragment>
      <ToolbarHelp title="Visitor feedback" icon="thumb_up">
        {HELP[kind]}
      </ToolbarHelp>

      <ToolbarSection title="What this collects">
        <RowPanel>
          <RowField
            label="Kind"
            kind="select"
            value={kind}
            onChange={(e) => {
              const value = e.target.value;
              setProp((draft) => {
                draft.mode = value;
                // Moving to a poll with nothing to vote on shows an empty box,
                // so a first pair of answers is provided to edit rather than
                // to invent.
                if (value !== 'review' && !readEngagementOptions(draft).length) {
                  draft.options = value === 'poll' ? ['Yes', 'No'] : ['👍', '❤️', '👏'];
                }
              });
            }}
            options={[
              { value: 'review', label: 'Visitor reviews' },
              { value: 'reaction', label: 'Reactions' },
              { value: 'poll', label: 'Poll' },
            ]}
          />
          <RowField
            label="Heading"
            placeholder={kind === 'review' ? 'What visitors say' : 'Which do you prefer?'}
            value={props?.heading || ''}
            onChange={(e) => {
              const value = e.target.value;
              setProp((draft) => {
                draft.heading = value;
              });
            }}
          />
        </RowPanel>
      </ToolbarSection>

      {kind !== 'review' ? (
        <ToolbarSection title={kind === 'poll' ? 'Answers' : 'Reactions'}>
          <RowList
            empty={kind === 'poll' ? 'No answers yet.' : 'No reactions yet.'}
            addLabel={kind === 'poll' ? 'Add answer' : 'Add reaction'}
            onAdd={() => writeOptions([...choices, ''])}
          >
            {choices.map((choice, index) => (
              <RowInlineField
                key={index}
                label={kind === 'poll' ? `Answer ${index + 1}` : `Reaction ${index + 1}`}
                placeholder={kind === 'poll' ? 'Yes' : '👍'}
                value={choice}
                removeLabel="Remove this option"
                onChange={(e) =>
                  writeOptions(choices.map((existing, i) => (i === index ? e.target.value : existing)))
                }
                onRemove={() => writeOptions(choices.filter((_, i) => i !== index))}
              />
            ))}
          </RowList>
        </ToolbarSection>
      ) : null}

      <ToolbarSection title="Appearance">
        <ToolbarItem full={true} propKey="accent" type="bg" label="Button colour" />
      </ToolbarSection>
    </React.Fragment>
  );
};

Engagement.craft = {
  displayName: 'Engagement',
  props: {
    mode: 'review',
    heading: 'What visitors say',
    options: ['👍', '❤️', '👏'],
    accent: { r: 0, g: 96, b: 172, a: 1 },
  },
  related: { toolbar: EngagementSettings },
};
