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
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
    } : undefined)
  };

  
  return (
    <h1 ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </h1>
    
  );
}