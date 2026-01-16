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

    return (
      <>
      <NavBar />

  <div style={{
    display: 'grid',
    gridTemplateColumns: '200px 1fr 200px',
    height: 'calc(100vh - 60px)'
  }}>

    {/* LEFT - Palette */}
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <h3>Elements</h3>
      {paletteItems.map((item) => (
        <Draggable
          key={`palette-${item.type}`}
          id={`palette-${item.type}`}
          position={{ x: 0, y: 0 }}
        >
          <div style={{
            padding: '10px',
            background: '#f0f0f0',
            border: '1px solid #ddd',
            cursor: 'grab'
          }}>
            {item.label}
          </div>
        </Draggable>
      ))}
    </div>

    {/* CENTER - Canvas */}
    <div style={{
      border: '2px dashed #ccc',
      position: 'relative',
      height: '100%'
    }}>
      <DndContext onDragEnd={handleDragEnd}>
        {elements.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            pointerEvents: 'none'
          }}>
            Drag elements from the left
          </div>
        )}
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
      height: '100%'
    }}>
      <h3>Edit Element</h3>
    </div>

  </div>

    </>
    )

    function handleDragEnd(event) {
      const { active, delta } = event;
      const activeId = active.id.toString();

      // Check if dragging from palette (id starts with 'palette-')
      if (activeId.startsWith('palette-')) {
        const type = activeId.replace('palette-', '');
        const paletteItem = paletteItems.find(item => item.type === type);

        if (paletteItem) {
          const newElement = {
            id: `element-${Date.now()}`,
            type: paletteItem.type,
            content: paletteItem.defaultContent,
            position: { x: 50, y: 50 }
          };
          setElements([...elements, newElement]);
        }
      } else {
        // Repositioning existing element in canvas
        setElements(prev => prev.map(el =>
          el.id === activeId
            ? { ...el, position: { x: el.position.x + delta.x, y: el.position.y + delta.y } }
            : el
        ));
      }
    }
  }