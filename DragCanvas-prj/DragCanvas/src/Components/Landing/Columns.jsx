import React from 'react';
import { useNode } from '@craftjs/core';
import { ColumnsSettings } from './ColumnsSettings';

/**
 * Side-by-side columns that know how to stop being side by side.
 *
 * The generator has been building these out of Containers with `width: 33%`,
 * which is fine until a phone: percentage columns stay narrow rather than
 * stacking, and three of them on a 375px screen leave about a hundred pixels
 * each. This holds its children in a flex row where each takes an equal share,
 * and becomes a stack below the breakpoint.
 *
 * Deliberately not wrapped in `Resizer`, which sets its own className and would
 * drop the one the children are sized through. A column layout has to be able to
 * style what it contains, and a class is the only handle for that - the children
 * are arbitrary elements that know nothing about being in a column.
 *
 * `count` sets the share each child gets rather than limiting how many there are,
 * so a fourth element dropped into a three-column row wraps onto a second line
 * instead of silently squeezing the other three.
 */
export const Columns = ({ count, gap, align, stack, children }) => {
  const { connectors: { connect } } = useNode();
  const columns = Number(count) || 2;
  const space = Number(gap) || 24;

  return (
    <div
      ref={connect}
      className={`dc-columns${stack === 'no' ? ' dc-columns--hold' : ''}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${space}px`,
        alignItems: align || 'stretch',
        width: '100%',
        // Read by `.dc-columns > *` so the children do not each have to be told
        ['--dc-share']: `calc((100% - ${(columns - 1) * space}px) / ${columns})`,
      }}
    >
      {children}
    </div>
  );
};

Columns.craft = {
  displayName: 'Columns',
  props: {
    count: '3',
    gap: '24',
    align: 'stretch',
    stack: 'yes',
  },
  rules: { canDrag: () => true },
  related: { toolbar: ColumnsSettings },
};
