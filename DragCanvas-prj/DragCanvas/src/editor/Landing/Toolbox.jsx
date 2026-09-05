import { useEditor } from '@craftjs/core';
import { Tooltip } from '@mui/material';
import { useMemo, useState } from 'react';

import { ELEMENTS, ELEMENT_GROUPS, labelOf, matchesQuery } from './elements.catalogue';
import {
  Empty,
  GroupHeader,
  Item,
  PanelHint,
  PanelTitle,
  SearchBox,
  ToolboxDiv,
} from './Toolbox.styles.js';
import { useMediaQuery } from '../../useMediaQuery.js';

/** Widths of the panel, shared with responsive.css where the formula is explained. */
const COLUMN_WIDTH = '104px';
const DRAWER_WIDTH = 'var(--dc-drawer-width, 280px)';

/**
 * Where a keyboard insert lands.
 *
 * A mouse drop tells the editor where it went; a keypress has to be told. The
 * selected node wins if it can hold children, then its parent, then the page.
 *
 * @returns {{parentId: string, index: number|undefined}} undefined index = "at the end"
 */
function insertionTarget(query, selectedId) {
  const endOfPage = { parentId: 'ROOT', index: undefined };
  if (!selectedId) return endOfPage;

  try {
    const node = query.node(selectedId);
    if (node.isCanvas()) return { parentId: selectedId, index: undefined };

    const parentId = node.get().data.parent;
    if (parentId && query.node(parentId).isCanvas()) {
      const siblings = query.node(parentId).get().data.nodes || [];
      const positionOfSelection = siblings.indexOf(selectedId);
      return {
        parentId,
        // Right after whatever is selected, so inserts read top to bottom.
        index: positionOfSelection >= 0 ? positionOfSelection + 1 : undefined,
      };
    }
  } catch {
    // the selection went stale between render and keypress
  }

  return endOfPage;
}

/**
 * One element of the catalogue: click to insert it, or drag it onto the canvas.
 *
 * @param {object} entry            a row of elements.catalogue
 * @param {Function} createConnector Craft's `connectors.create`
 * @param {Function} onInsert       called when the button is pressed
 */
function ToolboxItem({ entry, createConnector, onInsert }) {
  return (
    <div
      className="dc-toolbox-item"
      ref={(element) => {
        // Guarded for the same reason as the canvas in Viewport: React hands a
        // ref callback null on the way out, and a Craft connector given null
        // asks for a node that has already gone.
        if (!element) return;
        createConnector(element, entry.element());
      }}
    >
      {/*
        describeChild matters: without it MUI puts the tooltip in aria-label,
        which replaces the button's name, so a screen reader announces "A
        location, with a pin" instead of "Map". With it the tooltip becomes
        aria-describedby and the visible label stays the name.
      */}
      <Tooltip title={entry.tip} placement="right" describeChild>
        <Item type="button" className="m-2 pb-2" onClick={() => onInsert(entry)}>
          {/* the ligature text is the icon; announcing it would read "map Map" */}
          <span className="material-symbols-outlined" aria-hidden="true">{entry.icon}</span>
          <span className="icon-label">{labelOf(entry)}</span>
        </Item>
      </Tooltip>
    </div>
  );
}

/** One named group of elements, with a header that folds it away. */
function ElementGroup({ group, items, collapsed, onToggle, renderItem }) {
  return (
    <>
      <GroupHeader
        className="dc-toolbox-span"
        type="button"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        {group}
        <span
          aria-hidden="true"
          className={`material-symbols-outlined chevron${collapsed ? ' collapsed' : ''}`}
        >
          expand_more
        </span>
      </GroupHeader>

      {/* Collapsed groups are not rendered, so they leave the tab order */}
      {!collapsed && items.map(renderItem)}
    </>
  );
}

/**
 * The panel of elements a page can be built from.
 *
 * `offCanvas` is true below 1024 while this panel is a closed drawer. It becomes
 * `inert`, which takes the whole subtree out of the tab order and the
 * accessibility tree - an off-screen panel whose buttons you can still Tab into
 * is worse than one that is simply not there.
 */
export const Toolbox = ({ offCanvas = false, drawer = false }) => {
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

  const coarsePointer = useMediaQuery('(pointer: coarse)');
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const searching = search.trim().length > 0;
  const matches = useMemo(
    () => ELEMENTS.filter((entry) => matchesQuery(entry, search)),
    [search],
  );

  const insert = (entry) => {
    const { parentId, index } = insertionTarget(query, selectedId);
    const tree = query.parseReactElement(entry.element()).toNodeTree();
    actions.addNodeTree(tree, parentId, index);

    // Puts the settings panel on the new element and shows where it landed, the
    // same as a mouse drop. selectNode is in ignoreHistoryForActions, so this
    // costs no undo step of its own.
    actions.selectNode(tree.rootNodeId);
  };

  const toggleGroup = (group) => setCollapsedGroups(
    (previous) => ({ ...previous, [group]: !previous[group] }),
  );

  const renderItem = (entry) => (
    <ToolboxItem
      key={entry.name}
      entry={entry}
      createConnector={create}
      onInsert={insert}
    />
  );

  // A query that matches two groups should not be split across two headers, so
  // results are one flat list.
  const searchResults = matches.length > 0
    ? matches.map(renderItem)
    : <Empty className="dc-toolbox-span">Nothing matches “{search.trim()}”</Empty>;

  const groupedElements = ELEMENT_GROUPS.map((group) => {
    const items = ELEMENTS.filter((entry) => entry.group === group);
    if (items.length === 0) return null;

    return (
      <ElementGroup
        key={group}
        group={group}
        items={items}
        collapsed={Boolean(collapsedGroups[group])}
        onToggle={() => toggleGroup(group)}
        renderItem={renderItem}
      />
    );
  });

  const panelWidth = drawer ? DRAWER_WIDTH : COLUMN_WIDTH;

  return (
    <ToolboxDiv
      $enabled={enabled}
      className="toolbox transition h-full flex flex-col"
      // A column down the left, not a full-width sheet. The width is shared
      // with the Sidebar column opposite and defined in responsive.css, which
      // is also where the reason for the formula is written down.
      style={{ width: enabled ? panelWidth : 0 }}
      inert={offCanvas || undefined}
      aria-hidden={offCanvas || undefined}
    >
      <PanelTitle>Elements</PanelTitle>

      {/*
        Shown only on a coarse pointer. The panel says nothing about dragging,
        so there is no false instruction to correct - what is missing is the
        true one. Craft drags with HTML5 drag-and-drop, which a finger cannot
        start, so on a touch device the only way in is a press.
      */}
      {coarsePointer && <PanelHint>Tap one to add it to the page.</PanelHint>}

      <SearchBox
        type="search"
        value={search}
        placeholder="Search"
        aria-label="Search elements"
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Escape') setSearch(''); }}
      />

      <div className="dc-toolbox-items flex flex-1 flex-col items-center gap-1 overflow-y-auto pb-4">
        {searching ? searchResults : groupedElements}
      </div>
    </ToolboxDiv>
  );
};
