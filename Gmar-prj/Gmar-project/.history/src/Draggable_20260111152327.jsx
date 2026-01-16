  import React from 'react';
  import { useDraggable } from '@dnd-kit/core';
  import { CSS } from '@dnd-kit/utilities';

  export default function Draggable({ id, position, children }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: id,
    });

    const style = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      width: '200px',
      transform: CSS.Translate.toString(transform),
    };

    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        {children}
      </div>
    );
  }
