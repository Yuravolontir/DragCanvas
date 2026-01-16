import React, {useState} from 'react';
  import {DndContext} from '@dnd-kit/core';

  import Draggable from './Draggable';

  import NavBar from './NavBar';

  export default function CreateNewProject() {

    // Elements that have been dropped in the canvas (center)
    const [elements, setElements] = useState([
      // Initially empty - elements appear here after dropping
    ]);

    // Palette items (left column) - these are always visible
    const paletteItems = [
      { id: 'palette-h1', type: 'h1', label: 'Heading' },
      { id: 'palette-button', type: 'button', label: 'Button' },
      { id: 'palette-paragraph', type: 'paragraph', label: 'Paragraph' }
    ];


    return (
      <>
      <NavBar />

  <div style={{
    display: 'grid',
    gridTemplateColumns: '200px 1fr 200px',
    height: 'calc(100vh - 60px)',
    minHeight: 'calc(100vh - 60px)'
  }}>

    {/* LEFT - Palette with draggable items */}
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      height: '100%',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <h3>Elements</h3>

      {/* Palette items - draggable from here */}
      <DndContext onDragEnd={handlePaletteDragEnd}>
        {paletteItems.map(item => (
          <Draggable
            key={item.id}
            id={item.id}
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
      </DndContext>
    </div>

    {/* CENTER - Canvas (drop zone) */}
    <div style={{
      border: '2px dashed #ccc',
      position: 'relative',
      height: '100%',
      minHeight: '100%',
      overflow: 'hidden'
    }}>
      <DndContext onDragEnd={handleCanvasDragEnd}>
        {elements.map(el => (
          <Draggable key={el.id} id={el.id} position={el.position}>
            {el.type === 'h1' && <h1>{el.content}</h1>}
            {el.type === 'button' && <button>{el.content}</button>}
            {el.type === 'paragraph' && <p>{el.content}</p>}
          </Draggable>
        ))}

        {elements.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999'
          }}>
            Drag elements from the left
          </div>
        )}
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

    // Handle drag from palette to canvas
    function handlePaletteDragEnd(event) {
      const { active, over } = event;

      // Check if dropped in canvas
      if (over && over.id === 'canvas') {
        const paletteItem = paletteItems.find(item => item.id === active.id);
        if (paletteItem) {
          const newElement = {
            id: Date.now().toString(),
            type: paletteItem.type,
            content: paletteItem.label,
            position: { x: 50, y: 50 }  // Default position
          };
          setElements([...elements, newElement]);
        }
      }
    }

    // Handle drag within canvas (repositioning)
    function handleCanvasDragEnd(event) {
      const { active, delta } = event;
      const id = active.id;

      setElements(prev => prev.map(el =>
        el.id === id
          ? { ...el, position: { x: el.position.x + delta.x, y: el.position.y + delta.y } }
          : el
      ));
    }
  }