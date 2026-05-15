import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { ToolbarSection, ToolbarItem } from './Toolbar';
import { ToolbarRadio } from './Toolbar/ToolbarRadio';

export const NavbarSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const { canvasElements } = useEditor((state) => {
    const elements = [];
    const rootNodes = state.nodes['ROOT']?.data?.nodes || [];
    const collectChildren = (nodeIds) => {
      nodeIds.forEach((id) => {
        const node = state.nodes[id];
        if (!node) return;
        const type = node.data?.type;
        const typeName = typeof type === 'string' ? type : (type?.displayName || type?.name || '');
        if (typeName === 'Container') {
          const displayName =
            node.data?.custom?.displayName || node.data?.displayName || id;
          const name = typeof displayName === 'string' ? displayName : id;
          elements.push({ id, name });
        }
        if (node.data?.nodes?.length) {
          collectChildren(node.data.nodes);
        }
      });
    };
    collectChildren(rootNodes);
    return { canvasElements: elements };
  });

  const updateLink = (index, field, value) => {
    const newLinks = [...props.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setProp((p) => (p.links = newLinks));
  };

  const addLink = () => {
    setProp((p) =>
      p.links.push({ text: `Link ${p.links.length + 1}`, href: '#' })
    );
  };

  const removeLink = (index) => {
    if (props.links.length <= 1) return;
    setProp((p) => p.links.splice(index, 1));
  };

  return (
    <React.Fragment>
      <ToolbarSection title="Brand">
        <ToolbarItem full={true} propKey="brand" type="text" label="Brand Name" />
      </ToolbarSection>

      <ToolbarSection title="Variant">
        <ToolbarItem propKey="variant" type="radio" label="Theme">
          <ToolbarRadio value="dark" label="Dark" />
          <ToolbarRadio value="primary" label="Primary" />
          <ToolbarRadio value="light" label="Light" />
        </ToolbarItem>
      </ToolbarSection>

      <ToolbarSection title="Text Color">
        <ToolbarItem full={true} propKey="textColor" type="color" label="Color" />
      </ToolbarSection>

      <ToolbarSection title="Sticky">
        <ToolbarItem propKey="sticky" type="radio" label="Sticky">
          <ToolbarRadio value={true} label="On" />
          <ToolbarRadio value={false} label="Off" />
        </ToolbarItem>
      </ToolbarSection>

      <div style={{ padding: '0 10px', marginTop: 4 }}>
        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 12, color: '#555' }}>
          Links
        </div>
        {props.links.map((link, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                value={link.text}
                onChange={(e) => updateLink(i, 'text', e.target.value)}
                placeholder="Text"
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
              {props.links.length > 1 && (
                <button
                  onClick={() => removeLink(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#d32f2f',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '0 4px',
                  }}
                  title="Remove"
                >
                  x
                </button>
              )}
            </div>
            <select
              value={link.href}
              onChange={(e) => updateLink(i, 'href', e.target.value)}
              style={{
                width: '100%',
                marginTop: 3,
                padding: '4px 6px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="#" disabled>Select section</option>
              {canvasElements.map((el) => (
                <option key={el.id} value={`#${el.id}`}>
                  {el.name}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          onClick={addLink}
          style={{
            width: '100%',
            padding: '4px 0',
            marginTop: 4,
            border: '1px dashed #aaa',
            borderRadius: 4,
            background: 'none',
            cursor: 'pointer',
            fontSize: 11,
            color: '#555',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          + Add Link
        </button>
      </div>
    </React.Fragment>
  );
};
