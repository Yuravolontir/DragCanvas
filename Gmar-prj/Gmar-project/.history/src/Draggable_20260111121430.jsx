import React from 'react';
import {useDraggable} from '@dnd-kit/core';

export default function Draggable({ id, position, onDragEnd, children }) {

  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: id,
  });

      const style = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      width: '200px',
      ...(transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      } : undefined)
    };

  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>

  );
}