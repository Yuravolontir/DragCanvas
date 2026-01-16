import React from 'react';
import {useDraggable} from '@dnd-kit/core';

export default function Draggable({ id, position, onDragEnd, children }) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: 'draggable',
  });
  const style = transform ? {
        position: 'absolute',
      left: position.x,
      top: position.y,
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  
  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}