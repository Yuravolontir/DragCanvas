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

<div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* LEFT - Palette (200px) */}
        <div style={{ width: '200px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Elements</h3>
   
    <DndContext onDragEnd={handleDragEnd}>

      {elements.map(el => (
    <Draggable key={el.id} id={el.id} position={el.position}>
      {el.type === 'h1' && <h1>{el.content}</h1>}
      {el.type === 'button' && <button>{el.content}</button>}
      {el.type === 'paragraph' && <p>{el.content}</p>}
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
