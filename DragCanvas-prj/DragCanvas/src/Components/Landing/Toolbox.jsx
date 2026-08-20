import { useEditor } from '@craftjs/core';
import { Tooltip } from '@mui/material';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { ELEMENTS, ELEMENT_GROUPS, labelOf, matchesQuery } from './elements.catalogue';

const ToolboxDiv = styled.div`
  transition: 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  ${(props) => (!props.$enabled ? `width: 0;` : '')}
  ${(props) => (!props.$enabled ? `opacity: 0;` : '')}
  background: var(--surface-container-low, var(--surface-dim));
  border-right: 1px solid var(--outline-light, var(--outline-light));
  box-shadow: 2px 0 14px color-mix(in oklab, var(--paper) 6%, transparent);
`;

/*
 * A real <button>, not a <div>. That is what makes the panel reachable: tab
 * order, Enter/Space and an accessible name all come with the element, so no
 * role or tabIndex is needed. The browser's default button styling has to be
 * reset first, or it fights the panel's own.
 */
const Item = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 78px;
  min-height: 58px;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 8px 6px;
  background: none;
  font: inherit;
  color: inherit;
  text-align: center;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 24px;
    color: var(--muted, var(--muted));
    transition: color 0.15s ease;
  }
  .icon-label {
    font-size: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    color: var(--muted, var(--muted));
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  &:hover {
    background: var(--primary-light, var(--primary-light));
    border-color: var(--primary-container, #dde1ff);
    transform: translateY(-1px);
    .material-symbols-outlined {
      color: var(--primary, var(--primary));
    }
    .icon-label {
      color: var(--primary, var(--primary));
    }
  }
  /* focus-visible, not focus: a mouse drag must not leave a ring behind */
  &:focus-visible {
    outline: 2px solid var(--primary, #4e5ba6);
    outline-offset: 2px;
    background: var(--primary-light, var(--primary-light));
  }
  ${(props) =>
    props.$move &&
    `
    cursor: move;
  `}
`;

const PanelTitle = styled.div`
  width: 100%;
  padding: 16px 12px 10px;
  font: 700 11px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--on-surface-variant);
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

/* Same type as PanelTitle, plus a disclosure arrow and a hit area. */
const GroupHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  padding: 12px 10px 6px;
  border: 0;
  background: none;
  font: 700 11px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--on-surface-variant);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  &:hover {
    color: var(--primary, var(--primary));
  }
  &:focus-visible {
    outline: 2px solid var(--primary, #4e5ba6);
    outline-offset: -2px;
    border-radius: 6px;
  }
  .chevron {
    font-size: 16px;
    transition: transform 0.15s ease;
  }
  .chevron.collapsed {
    transform: rotate(-90deg);
  }
`;

const SearchBox = styled.input`
  width: calc(100% - 16px);
  margin: 10px 8px 4px;
  padding: 6px 8px;
  border: 1px solid var(--outline-light, #d6d9e4);
  border-radius: 8px;
  background: var(--surface, var(--surface-dim));
  color: var(--on-surface, inherit);
  font: 500 11px/1.2 'Plus Jakarta Sans', sans-serif;
  &::placeholder {
    color: var(--muted, #8f99b2);
  }
  &:focus-visible {
    outline: 2px solid var(--primary, #4e5ba6);
    outline-offset: 1px;
  }
`;

const Empty = styled.div`
  padding: 12px 10px;
  font: 500 10px/1.4 'Plus Jakarta Sans', sans-serif;
  color: var(--muted, #8f99b2);
  text-align: center;
`;

export const Toolbox = () => {
  const {
    enabled,
    selectedId,
    connectors: { create },
    actions,
    query,
  } = useEditor((state) => ({
    enabled: state.options.enabled,
    // state.events.selected is a Set in craft 0.2.x
    selectedId: state.events.selected ? Array.from(state.events.selected)[0] : null,
  }));

  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const searching = search.trim().length > 0;
  const matches = useMemo(() => ELEMENTS.filter((e) => matchesQuery(e, search)), [search]);

  /*
   * Where a keyboard insert lands. A mouse drop tells the editor where it went;
   * a keypress has to be told. The selected node wins if it can hold children,
   * then its parent, then the page.
   */
  const insertionTarget = () => {
    if (!selectedId) return { parentId: 'ROOT', index: undefined };
    try {
      const node = query.node(selectedId);
      if (node.isCanvas()) return { parentId: selectedId, index: undefined };
      const parentId = node.get().data.parent;
      if (parentId && query.node(parentId).isCanvas()) {
        const siblings = query.node(parentId).get().data.nodes || [];
        const at = siblings.indexOf(selectedId);
        return { parentId, index: at >= 0 ? at + 1 : undefined };
      }
    } catch {
      // the selection went stale between render and keypress
    }
    return { parentId: 'ROOT', index: undefined };
  };

  const insert = (entry) => {
    const { parentId, index } = insertionTarget();
    const tree = query.parseReactElement(entry.element()).toNodeTree();
    actions.addNodeTree(tree, parentId, index);
    // Puts the settings panel on the new element and shows where it landed,
    // the same as a mouse drop. selectNode is in ignoreHistoryForActions, so
    // this costs no undo step of its own.
    actions.selectNode(tree.rootNodeId);
  };

  const renderItem = (entry) => (
    <div
      key={entry.name}
      ref={(ref) => {
        create(ref, entry.element());
      }}
    >
      {/*
        describeChild matters: without it MUI puts the tooltip in aria-label,
        which replaces the button's name, so a screen reader announces "A
        location, with a pin" instead of "Map". With it the tooltip becomes
        aria-describedby and the visible label stays the name.
      */}
      <Tooltip title={entry.tip} placement="right" describeChild>
        <Item
          type="button"
          $move
          className="m-2 pb-2"
          onClick={() => insert(entry)}
        >
          {/* the ligature text is the icon; announcing it would read "map Map" */}
          <span className="material-symbols-outlined" aria-hidden="true">
            {entry.icon}
          </span>
          <span className="icon-label">{labelOf(entry)}</span>
        </Item>
      </Tooltip>
    </div>
  );

  return (
    <ToolboxDiv
      $enabled={enabled && enabled}
      className="toolbox transition h-full flex flex-col"
      style={{ width: enabled ? '104px' : 0 }}
    >
      <PanelTitle>Elements</PanelTitle>
      <SearchBox
        type="search"
        value={search}
        placeholder="Search"
        aria-label="Search elements"
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setSearch('');
        }}
      />
      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto pb-4">
        {searching ? (
          // A query that matches two groups should not be split across two
          // headers, so results are one flat list.
          matches.length ? (
            matches.map(renderItem)
          ) : (
            <Empty>Nothing matches “{search.trim()}”</Empty>
          )
        ) : (
          ELEMENT_GROUPS.map((group) => {
            const items = ELEMENTS.filter((e) => e.group === group);
            if (!items.length) return null;
            const isCollapsed = !!collapsed[group];
            return (
              <React.Fragment key={group}>
                <GroupHeader
                  type="button"
                  aria-expanded={!isCollapsed}
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))
                  }
                >
                  {group}
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined chevron${
                      isCollapsed ? ' collapsed' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </GroupHeader>
                {/* Collapsed groups are not rendered, so they leave the tab order */}
                {!isCollapsed && items.map(renderItem)}
              </React.Fragment>
            );
          })
        )}
      </div>
    </ToolboxDiv>
  );
};
