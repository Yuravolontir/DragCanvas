  import React, { useState } from 'react';
  import { DndContext } from '@dnd-kit/core';
  import Draggable from './Draggable';
  import NavBar from './NavBar';

  export default function CreateNewProject() {
    const [elements, setElements] = useState([]);

    function handleDragEnd(event) {
      const { active, delta } = event;

      setElements(elements.map(el => {
        if (el.id === active.id) {
          return { ...el, x: el.x + delta.x, y: el.y + delta.y };
        }
        return el;
      }));
    }

    function addElement(text) {
      setElements([...elements, {
        id: Date.now(),
        text: text,
        x: 50,
        y: 50
      }]);
    }

    return (
      <>
        <NavBar />

        <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>

          {/* LEFT - Buttons */}
          <div style={{ width: '150px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>Add</h3>
            <button onClick={() => addElement('Heading')}>Heading</button>
            <br /><br />
            <button onClick={() => addElement('Button')}>Button</button>
            <br /><br />
            <button onClick={() => addElement('Text')}>Text</button>
          </div>

          {/* CENTER - Canvas */}
          <DndContext onDragEnd={handleDragEnd}>
            <div style={{ flex: 1, border: '2px dashed #ccc', position: 'relative', background: '#f5f5f5' }}>
              {elements.map(el => (
                <Draggable key={el.id} id={el.id} position={{ x: el.x, y: el.y }}>
                  <div>{el.text}</div>
                </Draggable>
              ))}
            </div>
          </DndContext>

        </div>
      </>
    );
  }
