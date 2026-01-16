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
      {paletteItems.map((item) => (
        <div
          key={`palette-${item.type}`}
          style={{
            padding: '10px',
            background: '#f0f0f0',
            border: '1px solid #ddd',
            cursor: 'grab',
            userSelect: 'none'
          }}
          draggable="true"
          onDragStart={(e) => {
            e.dataTransfer.setData('type', item.type);
            e.dataTransfer.setData('content', item.defaultContent);
          }}
        >
          {item.label}
        </div>
      ))}
    </div>

    {/* CENTER - Canvas with DndContext */}
    <div
      id="canvas"
      style={{
        border: '2px dashed #ccc',
        position: 'relative',
        height: '100%'
      }}
      onDrop={(e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        const content = e.dataTransfer.getData('content');
        if (type) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const newElement = {
            id: `element-${Date.now()}`,
            type: type,
            content: content,
            position: { x, y }
          };
          setElements([...elements, newElement]);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
    >
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

      // Only handle repositioning existing elements (not palette items)
      if (!activeId.startsWith('palette-')) {
        setElements(prev => prev.map(el =>
          el.id === activeId
            ? { ...el, position: { x: el.position.x + delta.x, y: el.position.y + delta.y } }
            : el
        ));
      }
    }
  }