import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { actions } = useEditor();

  const generateWebsite = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Backend request failed');
      }

      const data = await response.json();

      if (!data || !data.content) {
        throw new Error('Empty AI response');
      }

      // Expect STRICT valid JSON from backend
      let layout;

      try {
        layout = JSON.parse(data.content);
      } catch (e) {
        throw new Error('AI did not return valid JSON');
      }

      if (!layout || typeof layout !== 'object') {
        throw new Error('Invalid layout format');
      }

      // 🔥 THE IMPORTANT PART
      actions.deserialize(layout);

      setPrompt('');
      alert('Website generated successfully!');

    } catch (err) {
      console.error('Error:', err);
      setError('Failed: ' + err.message);
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