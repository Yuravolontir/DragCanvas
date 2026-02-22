import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { actions, query } = useEditor();

  const allowedComponents = [
    "Container",
    "Text",
    "Button",
    "Video",
    "Link",
    "Image",
    "Custom1",
    "Custom2",
    "Custom2VideoDrop",
    "Custom3",
    "Custom3BtnDrop",
    "OnlyButtons"
  ];

  const extractJSON = (rawText) => {
    let cleaned = rawText.trim();

    // Remove markdown code blocks
    cleaned = cleaned
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found in AI response");
    }

    return cleaned.substring(firstBrace, lastBrace + 1);
  };

  const validateNodes = (nodes) => {
    Object.entries(nodes).forEach(([nodeId, node]) => {
      if (!node.type || !node.type.resolvedName) {
        throw new Error(`Node ${nodeId} missing resolvedName`);
      }

      if (!allowedComponents.includes(node.type.resolvedName)) {
        throw new Error(
          `Component "${node.type.resolvedName}" not found in resolver`
        );
      }

      if (!Array.isArray(node.nodes)) {
        throw new Error(`Node ${nodeId} has invalid children format`);
      }
    });
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

      let layout;

      try {
        layout = JSON.parse(jsonString);
      } catch (e) {
        console.error("Malformed JSON:", jsonString);
        throw new Error("AI returned malformed JSON");
      }

      // Normalize root ID
      const editorState = query.getSerializedNodes();
      const actualRootId = Object.keys(editorState)[0];

      if (!layout[actualRootId]) {
        const firstKey = Object.keys(layout)[0];
        layout[actualRootId] = layout[firstKey];
        delete layout[firstKey];
      }

      validateNodes(layout);

      actions.deserialize(layout);

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
    <div
      style={{
        padding: '10px',
        marginBottom: '10px',
        borderBottom: '1px solid #ddd'
      }}
    >
      <h4>🤖 AI Generator</h4>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your website..."
        rows={2}
        style={{
          width: '100%',
          marginBottom: '5px',
          padding: '5px'
        }}
      />

      <button
        onClick={generateWebsite}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {error && (
        <p
          style={{
            color: 'red',
            marginTop: '5px',
            fontSize: '12px'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}