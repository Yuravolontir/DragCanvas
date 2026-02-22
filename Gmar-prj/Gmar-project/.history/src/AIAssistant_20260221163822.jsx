 import React, { useState } from 'react';
  import { useEditor } from '@craftjs/core';

  export default function AIAssistant() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] =
  useState(false);

    // Get the selected component and ability  to update it
    const { query, actions } =
  useEditor((state, query) => ({
      // Get currently selected node IDs
      selected: state.events.selected,
    }));

    const generateAndUpdate = async () => {
      if (!prompt.trim()) return;

      setLoading(true);

      try {
        // Call Perplexity API
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': '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',
            'Content-Type':'application/json'
          },
          body: JSON.stringify({
            model:
  'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'Generate short web content. No explanations, just the content.'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        const data = await response.json();
        const generatedText =
  data.choices[0].message.content;

        // Update the selected component withgenerated text
        const selectedNodeId =
  Object.keys(query.getEvent('selected'))[0];

        if (selectedNodeId) {
          // Update the 'text' prop of theselected component
          actions.setProp(selectedNodeId,
  (props) => {
            props.text = generatedText;
          });
        }

        setPrompt('');
      } catch (err) {
        alert('Generation failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ padding: '10px',
  marginBottom: '10px' }}>
        <h4>AI Assistant</h4>
        <input
          type="text"
          value={prompt}
          onChange={(e) =>
  setPrompt(e.target.value)}
          placeholder="Describe what you
  want..."
          style={{ width: '100%',
  marginBottom: '5px' }}
        />
        <button
          onClick={generateAndUpdate}
          disabled={loading}
        >
          {loading ? 'Generating...' :
  'Generate'}
        </button>
        <small style={{ display: 'block',
  marginTop: '5px', color: '#666' }}>
          Select a Text element, then click
  Generate
        </small>
      </div>
    );
  }