import React, { useState } from 'react';
  import { useEditor } from '@craftjs/core';

  export default function AIAssistant() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { actions } = useEditor();

    const buildCraftTree = (sections) => {
      const nodes = {};

      nodes.ROOT = {
        type: { resolvedName: 'Container' },
        isCanvas: true,
        props: { width: '100%', flexDirection: 'column' },
        displayName: 'Container',
        custom: {},
        hidden: false,
        nodes: []
      };

      let idCounter = 1;

      const buildNode = (element, parentId) => {
        const nodeId = `node-${idCounter++}`;
        const resolvedName = element.type
          ? element.type.charAt(0).toUpperCase() + element.type.slice(1)
          : 'Container';

        nodes[nodeId] = {
          type: { resolvedName },
          isCanvas: element.type === 'container',
          props: element.props || {},
          displayName: resolvedName,
          custom: {},
          hidden: false,
          nodes: []
        };

        nodes[parentId].nodes.push(nodeId);

        // Recursively build children
        if (Array.isArray(element.children) && element.children.length > 0) {
          for (const child of element.children) {
            buildNode(child, nodeId);
          }
        }
      };

      for (const section of sections) {
        const sectionId = `section-${idCounter++}`;

        nodes[sectionId] = {
          type: { resolvedName: 'Container' },
          isCanvas: true,
          props: section.props || {},
          displayName: 'Container',
          custom: {},
          hidden: false,
          nodes: []
        };

        nodes.ROOT.nodes.push(sectionId);

        // Build all children recursively
        if (Array.isArray(section.children)) {
          for (const child of section.children) {
            buildNode(child, sectionId);
          }
        }
      }

      return nodes;
    };

    const generateWebsite = async () => {
      if (!prompt.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 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',
            'HTTP-Referer': window.location.origin,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
              {
                role: 'system',
                content: `You are a website builder AI. Given a user description, generate a website as a JSON array of sections. Each section is an object with "props" (container props like background, padding, flexDirection, width) and "children" array. Children can be: { "type": "Text", "props": { "text": "...", "fontSize": "16", "fontWeight": "400" } }, { "type": "Button", "props": { "text": "...", "background": {"r":0,"g":96,"b":172,"a":1} } }, { "type": "Image", "props": { "src": "https://picsum.photos/800/400" } }, or { "type": "Container", "props": { "flexDirection": "row", "width": "100%", "padding": ["20","20","20","20"] }, "children": [...] }. Return ONLY valid JSON: { "sections": [...] }. Make the design modern and visually appealing. Use varied section backgrounds and proper spacing.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error?.message || 'OpenRouter request failed');
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from AI');

        const parsed = JSON.parse(content);
        if (!parsed?.sections || !Array.isArray(parsed.sections)) {
          throw new Error('AI did not return valid sections');
        }

        console.log('AI Generated Sections:', JSON.stringify(parsed.sections, null, 2));

        const craftTree = buildCraftTree(parsed.sections);
        actions.deserialize(craftTree);

        setPrompt('');
      } catch (err) {
        console.error('AI Generate Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{
        padding: '12px 16px',
        marginBottom: 10,
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e8e0eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        maxWidth: '800px',
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e57c2' }}>auto_awesome</span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#49454f' }}>AI Generator</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your website..."
            rows={1}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #e8e0eb',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
              resize: 'none',
              background: '#f7f4ec',
              color: '#1c1b1f',
            }}
          />
          <button
            onClick={generateWebsite}
            disabled={loading}
            style={{
              padding: '8px 18px',
              backgroundColor: loading ? '#cac4d0' : '#7e57c2',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#fff' }}>auto_awesome</span>
            {loading ? 'Wait...' : 'Generate'}
          </button>
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 5, fontSize: 12 }}>
            {error}
          </p>
        )}
      </div>
    );
  }
