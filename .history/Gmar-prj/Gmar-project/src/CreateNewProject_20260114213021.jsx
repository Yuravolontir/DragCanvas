  import React, { useState, useEffect } from 'react';
  import { DndContext } from '@dnd-kit/core';
  import Draggable from './Draggable';
  import NavBar from './NavBar';

  export default function CreateNewProject() {
    const [elements, setElements] = useState([]);

    // Load saved layout on start
    useEffect(() => {
      const saved = localStorage.getItem('myWebsite');
      if (saved) {
        setElements(JSON.parse(saved));
      }
    }, []);

    function handleDragEnd(event) {
      const { active, delta } = event;

      // Find the element being dragged
      const elementId = active.id;

      // Update its position by adding the drag distance
      setElements(prev => prev.map(el => {
        if (el.id === elementId) {
          return {
            ...el,
            x: el.x + delta.x,
            y: el.y + delta.y
          };
        }
        return el;
      }));
    }

    function addElement(type, content) {
      const newElement = {
        id: Date.now(),
        type,
        content,
        x: 50,  // default position
        y: 50
      };
      setElements([...elements, newElement]);
    }

    function saveLayout() {
      localStorage.setItem('myWebsite', JSON.stringify(elements));
      alert('Saved!');
    }

    function clearLayout() {
      setElements([]);
      localStorage.removeItem('myWebsite');
    }

    return (
      <>
        <NavBar />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 200px',
          height: 'calc(100vh - 60px)'
        }}>
          <DndContext onDragEnd={handleDragEnd}>

            {/* LEFT - Add buttons */}
            <div style={{
              border: '1px solid #ccc',
              padding: '10px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <h3>Add Elements</h3>
              <button onClick={() => addElement('h1', 'Heading')}>+ Heading</button>
              <button onClick={() => addElement('button', 'Click me')}>+ Button</button>
              <button onClick={() => addElement('p', 'Some text')}>+ Paragraph</button>
            </div>

            {/* CENTER - Canvas (free drag anywhere) */}
            <div
              style={{
                border: '2px dashed #ccc',
                position: 'relative',
                height: '100%',
                backgroundColor: '#f5f5f5',
                overflow: 'hidden'
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

          {/* RIGHT - Save/Clear */}
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

  function renderElement(element) {
    switch (element.type) {
      case 'h1':
        return <h1 contentEditable suppressContentEditableWarning>{element.content}</h1>;
      case 'button':
        return <button contentEditable suppressContentEditableWarning>{element.content}</button>;
      case 'p':
        return <p contentEditable suppressContentEditableWarning>{element.content}</p>;
      default:
        return <div>{element.content}</div>;
    }
  }