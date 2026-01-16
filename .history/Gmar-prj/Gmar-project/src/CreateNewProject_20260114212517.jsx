 import React, {useState} from 'react';
  import {DndContext} from '@dnd-kit/core';

  import Draggable from './Draggable';

  import NavBar from './NavBar';

  export default function CreateNewProject() {

    const [elements, setElements] = useState([]);

    // Palette items configuration
    const paletteItems = [
      { type: 'h1', label: 'Heading', defaultContent: 'Heading' },
      { type: 'button', label: 'Button', defaultContent: 'Click me' },
      { type: 'paragraph', label: 'Paragraph', defaultContent: 'Some text' }
    ];
  const draggableMarkup = (
    <Draggable id="draggable">Drag me</Draggable>
  );
    return (
      <>
      <NavBar />

  <div style={{
    display: 'grid',
    gridTemplateColumns: '200px 1fr 200px',
    height: 'calc(100vh - 60px)'
  }}>
        <DndContext onDragEnd={handleDragEnd}>
      {parent === null ? draggableMarkup : null}
    {/* LEFT - Palette - OUTSIDE DndContext */}
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <h3>Elements</h3>


    </div>

    {/* CENTER - Canvas with DndContext */}
    <div
      id="canvas"
      style={{
        border: '2px dashed #ccc',
        position: 'relative',
        height: '100%'
      }}
    >
    
    </div>

    {/* RIGHT - Edit Panel */}
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      height: '100%'
    }}>
      <h3>Edit Element</h3>
    </div>
 </DndContext>
  </div>

    </>
    )
  function handleDragEnd(event) {
    if (event.over && event.over.id === 'droppable') {
      setIsDropped(true);
    }
  }

  }