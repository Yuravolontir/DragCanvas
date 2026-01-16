import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';

import Draggable from './Draggable';

import NavBar from './NavBar';

export default function CreateNewProject() {

       const [elements, setElements] = useState([
    { id: '1', type: 'h1', content: 'Heading', position: { x: 50, y: 50 } },
    { id: '2', type: 'button', content: 'Click me', position: { x: 200, y: 100 } },
    { id: '3', type: 'paragraph', content: 'Some text', position: { x: 50, y: 200 } }
  ]);


  return (
    <>
    <NavBar />

    
  <div style={{ position: 'relative', minHeight: '600px', border: '2px dashed #ccc' }}>
    <DndContext onDragEnd={handleDragEnd}>
      {elements.map(el => (
        <Draggable
          key={el.id}
          id={el.id}
          position={el.position}
        >
          <button>This is a button - {el.id}</button>
        </Draggable>
      ))}
    </DndContext>
  </div>
  </>
  )
  function handleDragEnd(event) {
    const { active, delta } = event;
    const id = active.id;

    setElements(prev => prev.map(el =>
      el.id === id
        ? { ...el, position: { x: el.position.x + delta.x, y: el.position.y + delta.y } }
        : el
    ));
  }
}
