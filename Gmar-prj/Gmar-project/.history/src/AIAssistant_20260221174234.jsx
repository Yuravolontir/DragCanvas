 import React, { useState } from
  'react';
  import { useEditor } from
  '@craftjs/core';

  export default function AIAssistant() {
    const [prompt, setPrompt] =
  useState('');
    const [loading, setLoading] =
  useState(false);
    const [error, setError] =
  useState(null);

    const { actions, query } =
  useEditor();

    const generateWebsite = async () => {
      if (!prompt.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:3001/api/ai-generate', {
          method: 'POST',
          headers: {
            'Content-Type':
  'application/json'
          },
          body: JSON.stringify({ prompt
  })
        });

        if (!response.ok) {
          throw new Error('Backend request failed');
        }

        const data = await
  response.json();
        const aiResponse = data.content
  || '';

        console.log('AI Response:',
  aiResponse);

        // Parse JSON - remove newlines

        const cleanResponse =
  aiResponse.replace(/\n/g, '');
        const jsonMatch =
  cleanResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          setError('No JSON found. AI said: ' + aiResponse.substring(0,
  150));
          return;
        }

        const layout =
  JSON.parse(jsonMatch[0]);
        console.log('Parsed layout:',
  layout);

 const rootNode =
  query.node('root').get();

  if (rootNode && rootNode.data &&
  rootNode.data.nodes) {
    const childIds = rootNode.data.nodes
  || [];

    // Remove all children from root
    childIds.forEach(childId => {
      actions.removeNode(childId);
    });
  } else {
    // Fallback: get all nodes and remove non-root nodes
    const allNodes = query.getNodes();
    Object.keys(allNodes).forEach(nodeId => {
      if (nodeId !== 'root') {
        try {
          actions.removeNode(nodeId);
        } catch (e) {
          // Skip if removal fails
        }
      }
    });
  }
        // Create nodes
        let nodeId = 0;

const createElement = (element,
  parentId) => {
    const currentNodeId =
  `node-${nodeId++}`;

    if (element.type === 'container') {
      actions.add(
        React.createElement('Container',
  element.props || { width: '100%' }),
        parentId
      );
      return currentNodeId;
    }

    if (element.type === 'text') {
      actions.add(
        React.createElement('Text',
  element.props || {}),
        parentId
      );
      return currentNodeId;
    }

    if (element.type === 'button') {
      actions.add(
        React.createElement('Button',
  element.props || {}),
        parentId
      );
      return currentNodeId;
    }

    if (element.type === 'image') {
      actions.add(
        React.createElement('Image',
  element.props || {}),
        parentId
      );
      return currentNodeId;
    }

    if (element.type === 'video') {
      actions.add(
        React.createElement('Video',
  element.props || {}),
        parentId
      );
      return currentNodeId;
    }

    if (element.type === 'link') {
      actions.add(
        React.createElement('Link',
  element.props || {}),
        parentId
      );
      return currentNodeId;
    }

    return null;
  };

        // Build all sections
        for (const section of
  layout.sections) {
          const containerId =
  createElement({
            type: 'container',
            props: section.props || {}
          }, 'root');

          if (section.children &&
  Array.isArray(section.children)) {
            for (const child of
  section.children) {
              createElement(child,
  containerId);
            }
          }
        }

        setPrompt('');
        alert('Website generated successfully!');

      } catch (err) {
        console.error('Error:', err);
        setError('Failed: ' +
  err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ padding: '10px',
  marginBottom: '10px', borderBottom:
  '1px solid #ddd' }}>
        <h4>🤖 AI Generator</h4>
        <textarea
          value={prompt}
          onChange={(e) =>
  setPrompt(e.target.value)}
          placeholder="Describe your
  website..."
          rows={2}
          style={{ width: '100%',
  marginBottom: '5px', padding: '5px' }}
        />
        <button
          onClick={generateWebsite}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ?
  '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ?
  'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' :
  'Generate'}
        </button>
        {error && <p style={{ color:
  'red', marginTop: '5px', fontSize:
  '12px' }}>{error}</p>}
      </div>
    );
  }