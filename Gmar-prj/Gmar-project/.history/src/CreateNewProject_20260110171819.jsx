import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';

import {Droppable} from './Droppable';
import {Draggable} from './Draggable';

import NavBar from './NavBar';

export default function CreateNewProject() {

    const [isDropped, setIsDropped] = useState(false);
  const draggableMarkup = (
    <Draggable>Drag me</Draggable>
  );
  
  return (
    <div>
        <NavBar />
    <div>CreateNewProject</div>
        <DndContext>
      <Draggable />
      <Droppable />
    </DndContext>
    </div>
  )
}
