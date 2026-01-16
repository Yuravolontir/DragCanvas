import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';

import Droppable from './Droppable';
import Draggable from './Draggable';

import NavBar from './NavBar';

export default function CreateNewProject() {

     const [elements, setElements] = useState([
    { id: 'draggable-1', position: { x: 50, y: 50 } },
    { id: 'draggable-2', position: { x: 200, y: 100 } }
  ]);
  const draggableMarkup = (
    <Draggable>Drag me</Draggable>
  );

  return (
    <div>
        <NavBar />
    <div>CreateNewProject</div>
    <DndContext onDragEnd={handleDragEnd}>
      {!isDropped ? draggableMarkup : null}
      <Droppable>
        {isDropped ? draggableMarkup : 'Drop here'}
      </Droppable>
    </DndContext>
    </div>
  )
   function handleDragEnd(event) {
    if (event.over && event.over.id === 'droppable') {
      setIsDropped(true);
    }
  }
}
