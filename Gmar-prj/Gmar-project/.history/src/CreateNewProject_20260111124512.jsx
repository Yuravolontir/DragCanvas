<div className="builder">
  {/* LEFT */}
  <div className="palette">
    <h3>Elements</h3>
    <div className="palette-item">Heading</div>
    <div className="palette-item">Button</div>
    <div className="palette-item">Paragraph</div>
  </div>

  {/* CENTER */}
  <div className="canvas">
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

  {/* RIGHT */}
  <div className="sidebar">
    <h3>Edit Element</h3>
  </div>
</div>
