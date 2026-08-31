import { Editor, Element, Frame, useEditor } from '@craftjs/core';
import { useEffect, useRef, useState } from 'react';

import { useReveal } from './useReveal.js';
import { useMediaQuery } from '../../useMediaQuery.js';
import { installTouchDrag } from '../../utils/touchDragBridge.js';

import { Container } from '../../editor/Landing/Container';
import { Text } from '../../editor/Landing/Text';
import { Button as EditorButton } from '../../editor/Landing/Button';
import './EditorDemo.css';

/**
 * The editor, running on the landing page.
 *
 * Every builder's site has a screenshot of its editor. This is the editor: the
 * same Craft.js components the real canvas uses, imported from
 * `editor/Landing`. A visitor can add a block before deciding whether to
 * sign up - by dragging it with a mouse, or by pressing it, which is the only
 * one of the two that works on a phone. See `Toolbox` below for why.
 *
 * Reusing the real components rather than writing lookalikes costs nothing
 * here. Routes are not code-split, so Craft.js, MUI and the element library are
 * already in the bundle this page downloads - a fact worth fixing (route-level
 * splitting would take the editor off the landing entirely) but a separate
 * change. Given they ship either way, the honest version is free.
 *
 * They are imported by file, never through `editor/Landing/index.jsx`: that
 * barrel re-exports everything, including the map and carousel elements, and
 * would drag the lot in behind three imports.
 *
 * The editor is only mounted once the section is actually reached. Booting a
 * whole editing engine for somebody who never scrolls this far is work nobody
 * asked for, and unlike bundle size it is a cost paid on every visit.
 */

const TOOLBOX = [
  { label: 'Heading', icon: 'title', build: () => <Element is={Text} text="Your heading" fontSize="26" fontWeight="700" /> },
  { label: 'Paragraph', icon: 'notes', build: () => <Element is={Text} text="A line of copy to set the tone." fontSize="15" /> },
  { label: 'Button', icon: 'smart_button', build: () => <Element is={EditorButton} text="Get in touch" /> },
];

export default function EditorDemo() {
  const sectionRef = useRef(null);
  const introRef = useReveal();
  // The wording follows what the pointer can actually do. Before the touch-drag
  // bridge, a phone could only tap, and naming a gesture it could not perform
  // was what made the demo read as broken. Now both work, and the difference is
  // only which one to put first: a thumb should hear about the tap, since a
  // drag there costs a deliberate press-and-hold.
  const coarse = useMediaQuery('(pointer: coarse)');
  // Without an observer there is no way to know when the section is reached, so
  // it starts mounted rather than never mounting. Decided at initialisation
  // rather than in the effect: writing it there would only schedule a second
  // render to correct the first.
  const [reached, setReached] = useState(() => typeof IntersectionObserver === 'undefined');

  // Craft cannot drag by finger on its own; the bridge translates a held press
  // into the drag events it listens for. Only once the section is mounted -
  // there is nothing draggable on the page before that.
  useEffect(() => (reached ? installTouchDrag() : undefined), [reached]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || reached) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setReached(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [reached]);

  return (
    <section className="editor-demo" ref={sectionRef}>
      <div className="editor-demo__intro reveal" ref={introRef}>
        <h2 className="editor-demo__title">And then you edit it</h2>
        <p className="editor-demo__subtitle">
          This is the real editor, not a picture of one.{' '}
          {coarse
            ? 'Tap a block to add it, or hold and drag it in.'
            : 'Drag a block into the canvas, or tap it to add.'}
        </p>
      </div>

      {reached ? (
        <Editor resolver={{ Container, Text, Button: EditorButton }}>
          <div className="editor-demo__shell">
            <div className="editor-demo__toolbar">
              <Toolbox />
              <Controls />
            </div>
            <div className="editor-demo__workspace">
              <div className="editor-demo__canvas paper">
                <Frame>
                  <Element
                    is={Container}
                    canvas
                    width="100%"
                    height="100%"
                    padding={['30', '30', '30', '30']}
                    background={{ r: 255, g: 255, b: 255, a: 1 }}
                  >
                    {/*
                      Seeded with a heading and a line of copy rather than left
                      empty. An empty white rectangle reads as a thing that
                      failed to load; a page with two blocks on it reads as a
                      page someone has started, which is the invitation.
                    */}
                    <Text text="Your heading" fontSize="30" fontWeight="700" />
                    <Text text="A line of copy to set the tone. Add a block to build on it." fontSize="15" />
                  </Element>
                </Frame>
              </div>
            </div>
          </div>
        </Editor>
      ) : (
        <div className="editor-demo__shell editor-demo__shell--placeholder" aria-hidden="true" />
      )}
    </section>
  );
}

/**
 * What to do with the block you just dropped.
 *
 * Without this the demo was one-way: you could add things and never take them
 * back, so the first mistake left a visitor stuck looking at it. An editor you
 * cannot undo anything in is a worse advertisement than no editor at all.
 *
 * `isDeletable` is asked rather than assumed - the root container is a top-level
 * node and craft refuses to remove it, so offering the button there would
 * produce a control that does nothing.
 */
function Controls() {
  const { actions, selected } = useEditor((state, query) => {
    const [id] = state.events.selected;
    return {
      selected: id
        ? { id, name: state.nodes[id]?.data?.displayName, deletable: query.node(id).isDeletable() }
        : null,
    };
  });

  if (!selected) {
    return <span className="editor-demo__status">Select a block to edit it</span>;
  }

  return (
    <div className="editor-demo__selection">
      <span className="editor-demo__selected-name">{selected.name}</span>
      {selected.deletable && (
        <button
          type="button"
          className="editor-demo__remove"
          onClick={() => actions.delete(selected.id)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">delete</span>
          Remove
        </button>
      )}
    </div>
  );
}

/**
 * Drag sources that are also press targets.
 *
 * `connectors.create` makes a plain button draggable, and craft's drag is HTML5
 * drag-and-drop - `draggable="true"` plus a `dragstart` listener, with no touch
 * or pointer events anywhere in the library. iOS Safari does not implement that
 * for page elements, so on a phone the finger arrives, `touchstart` and
 * `touchmove` fire, and `dragstart` never does. The block cannot be dragged in
 * at all.
 *
 * So the button also inserts on click, exactly as the real toolbox does
 * (`editor/Landing/Toolbox.jsx`, where it was added for the keyboard). A
 * completed drag does not fire `click`, so a mouse gets one behaviour and a
 * thumb gets the other and they never collide.
 */
function Toolbox() {
  const { connectors, actions, query } = useEditor();

  const add = (item) => {
    const tree = query.parseReactElement(item.build()).toNodeTree();
    actions.addNodeTree(tree, 'ROOT');
    // Selecting is what makes a press feel like a drop: the Controls strip
    // names the new block and offers Remove. Without it the block is appended
    // out of sight and the tap reads as nothing having happened.
    actions.selectNode(tree.rootNodeId);
  };

  return (
    <div className="editor-demo__toolbox">
      <span className="editor-demo__toolbox-label">Add</span>
      {TOOLBOX.map(item => (
        <button
          key={item.label}
          type="button"
          className="editor-demo__block"
          onClick={() => add(item)}
          ref={ref => ref && connectors.create(ref, item.build())}
        >
          <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
