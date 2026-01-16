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

  <div style={{
    display: 'grid',
    gridTemplateColumns: '200px 1fr 200px',
    height: 'calc(100vh - 60px)',  // Full height
    minHeight: 'calc(100vh - 60px)'  // Ensure minimum height
  }}>

    {/* LEFT - Palette */}
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      height: '100%',  // Full height of grid cell
      minHeight: '100%'
    }}>
      <h3>Elements</h3>
      {/* Draggable items to drag from */}
    </div>

    {/* CENTER - Canvas with position: relative */}
    <div style={{
      border: '2px dashed #ccc',
      position: 'relative',  // ✅ This contains absolute children
      height: '100%',  // Full height even when empty
      minHeight: '100%',
      overflow: 'hidden'  // Prevent overflow
    }}>
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

    {/* RIGHT - Edit Panel */}
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      height: '100%',
      minHeight: '100%'
    }}>
      <h3>Edit Element</h3>
    </div>

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
