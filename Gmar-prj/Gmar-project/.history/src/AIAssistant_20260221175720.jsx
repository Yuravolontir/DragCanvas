import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { actions } = useEditor();

  const extractJSON = (rawText) => {
    let cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON found");
    }

    return cleaned.substring(firstBrace, lastBrace + 1);
  };

  const buildCraftTree = (sections) => {
    const nodes = {};

    // Root node
    nodes["ROOT"] = {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: { width: "100%", flexDirection: "column" },
      displayName: "Container",
      custom: {},
      hidden: false,
      nodes: []
    };

    let idCounter = 1;

    sections.forEach((section, sIndex) => {
      const sectionId = `section-${idCounter++}`;

      nodes[sectionId] = {
        type: { resolvedName: "Container" },
        isCanvas: true,
        props: section.props || {},
        displayName: "Container",
        custom: {},
        hidden: false,
        nodes: []
      };

      nodes["ROOT"].nodes.push(sectionId);

      if (Array.isArray(section.children)) {
        section.children.forEach((child) => {
          const childId = `node-${idCounter++}`;

          const resolvedName =
            child.type.charAt(0).toUpperCase() + child.type.slice(1);

          nodes[childId] = {
            type: { resolvedName },
            isCanvas: false,
            props: child.props || {},
            displayName: resolvedName,
            custom: {},
            hidden: false,
            nodes: []
          };

          nodes[sectionId].nodes.push(childId);
        });
      }
    });

    return nodes;
  };

  const generateWebsite = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Backend request failed');
      }

      const data = await response.json();

      if (!data?.content) {
        throw new Error('Empty AI response');
      }

      console.log("RAW AI RESPONSE:", data.content);

      const jsonString = extractJSON(data.content);
      const parsed = JSON.parse(jsonString);

      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error("AI did not return sections format");
      }

      const craftTree = buildCraftTree(parsed.sections);

      actions.deserialize(craftTree);

      setPrompt('');
      alert('Website generated successfully!');

    } catch (err) {
      console.error('AI Generate Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 10, marginBottom: 10, borderBottom: '1px solid #ddd' }}>
      <h4>🤖 AI Generator</h4>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your website..."
        rows={2}
        style={{ width: '100%', marginBottom: 5, padding: 5 }}
      />

      <button
        onClick={generateWebsite}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {error && (
        <p style={{ color: 'red', marginTop: 5, fontSize: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
}