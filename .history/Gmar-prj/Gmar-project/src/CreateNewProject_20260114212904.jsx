  import React, { useState, useEffect } from 'react';
  import { DndContext } from '@dnd-kit/core';
  import Draggable from './Draggable';
  import NavBar from './NavBar';

  export default function CreateNewProject() {
    // This stores all your canvas elements
    const [elements, setElements] = useState([]);

    // Load saved elements when page opens
    useEffect(() => {
      const saved = localStorage.getItem('myWebsite');
      if (saved) {
        setElements(JSON.parse(saved));
      }
    }, []);

    // This handles dropping items on canvas
    function handleDragEnd(event) {
      const { over, active } = event;

      // Only add if dropped on canvas
      if (over && over.id === 'canvas') {
        const newElement = {
          id: Date.now(), // unique id
          type: active.data.current?.type || 'div',
          content: active.data.current?.content || 'New Element',
          x: event.delta.x + 100, // position where dropped
          y: event.delta.y + 100
        };

        setElements([...elements, newElement]);
      }
    }

    // Save to localStorage
    function saveLayout() {
      localStorage.setItem('myWebsite', JSON.stringify(elements));
      alert('Saved!');
    }

    // Clear everything
    function clearLayout() {
      setElements([]);
      localStorage.removeItem('myWebsite');
    }

    // Palette items (left sidebar)
    const paletteItems = [
      { type: 'h1', label: 'Heading', content: 'Heading' },
      { type: 'button', label: 'Button', content: 'Click me' },
      { type: 'p', label: 'Paragraph', content: 'Some text' }
    ];

    return (
      <>
        <NavBar />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 200px',
          height: 'calc(100vh - 60px)'
        }}>
          <DndContext onDragEnd={handleDragEnd}>

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
              {paletteItems.map(item => (
                <PaletteItem key={item.type} item={item} />
              ))}
            </div>

            {/* CENTER - Canvas */}
            <div
              id="canvas"
              data-over="canvas"
              style={{
                border: '2px dashed #ccc',
                position: 'relative',
                height: '100%',
                backgroundColor: '#f5f5f5'
              }}
            >
              {elements.map(el => (
                <Draggable
                  key={el.id}
                  id={el.id}
                  position={{ x: el.x, y: el.y }}
                >
                  {renderElement(el)}
                </Draggable>
              ))}
            </div>

          </DndContext>

          {/* RIGHT - Controls */}
          <div style={{
            border: '1px solid #ccc',
            padding: '10px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <h3>Actions</h3>
            <button onClick={saveLayout} style={{ padding: '10px' }}>
              💾 Save
            </button>
            <button onClick={clearLayout} style={{ padding: '10px' }}>
              🗑️ Clear
            </button>
          </div>
        </div>
      </>
    );
  }

  // Helper: renders different element types
  function renderElement(element) {
    switch (element.type) {
      case 'h1':
        return <h1>{element.content}</h1>;
      case 'button':
        return <button>{element.content}</button>;
      case 'p':
        return <p>{element.content}</p>;
      default:
        return <div>{element.content}</div>;
    }
  }

  // Helper: palette item (draggable from sidebar)
  function PaletteItem({ item }) {
    const { attributes, listeners, setNodeRef } = useDraggable({
      id: `palette-${item.type}`,
      data: { current: item }
    });

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          padding: '10px',
          background: '#ddd',
          cursor: 'grab',
          textAlign: 'center'
        }}
      >
        {item.label}
      </div>
    );
  }