import React, { useState } from 'react';
  import { useEditor } from '@craftjs/core';

  export default function AIAssistant() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] =
  useState(false);
    const [error, setError] = useState(null);

    const { query, actions } =
  useEditor((state, query) => ({
      selected: state.events.selected,
    }));

    const generateWebsite = async () => {
      if (!prompt.trim()) return;

      setLoading(true);
      setError(null);

      // Tell the AI what elements are
  available
      const systemPrompt = `You are a website
   builder. Available elements:
  - Container: layout wrapper with props
  (width, height, padding, margin,
  flexDirection, background)
  - Text: text content with props (text,
  fontSize, fontWeight, color)
  - Button: button with props (text,
  background, size)
  - Image: image with props (src, radius)
  - Video: video with props (videoId for
  YouTube, videoUrl for mp4, text for
  overlay)
  - Link: link with props (text, href,
  fontSize)

  Generate a JSON response with this
  structure:
  {
    "sections": [
      {
        "type": "container",
        "props": {"width": "100%", "padding":
   ["40", "40", "40", "40"], "flexDirection":
   "column"},
        "children": [
          {"type": "text", "props": {"text":
  "headline here", "fontSize": "48"}},
          {"type": "button", "props":
  {"text": "Click me", "background":
  "#007bff"}}
        ]
      }
    ]
  }

  Return ONLY the JSON, no other text.`;

      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearerpplx-VRS1XHpyx7h8qElu8Vli8fu074RTui4gdCmQ8tyFzk7VftfX',
            'Content-Type':
  'application/json'
          },
          body: JSON.stringify({
            model:
  'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: `Generate a website
  layout for: ${prompt}`
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error('API requestfailed');
        }

        const data = await response.json();
        const aiResponse =
  data.choices[0].message.content;

        // Parse JSON from AI response
        const jsonMatch =
  aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const layout =
  JSON.parse(jsonMatch[0]);

        // Clear existing content first
        const rootNodes = query.getNodes();
        Object.keys(rootNodes).forEach(nodeId => {
          if (nodeId !== 'root') {
            actions.delete(nodeId);
          }
        });

        // Build the website from AI layout
        let parentNode = 'root';
        let nodeId = 0;

        const createElement = (element,
  parentId) => {
          const currentNodeId =
  `node-${nodeId++}`;

          if (element.type === 'container') {
            actions.addNode(
              {
                type: 'Container',
                props: {
                  ...element.props,
                  padding:
  element.props.padding || ['20', '20', '20',
   '20'],
                  margin:
  element.props.margin || [0, 0, 0, 0],
                  background:
  element.props.background || { r: 255, g:
  255, b: 255, a: 1 }
                },
                custom: { displayName:
  `Section ${nodeId}` }
              },
              parentId
            );
            return currentNodeId;
          }

          if (element.type === 'text') {
            actions.addNode(
              {
                type: 'Text',
                props: {
                  text: element.props.text ||
   'New Text',
                  fontSize:
  element.props.fontSize || '14',
                  fontWeight:
  element.props.fontWeight || '400',
                  color: element.props.color
  || { r: 0, g: 0, b: 0, a: 1 }
                }
              },
              parentId
            );
            return currentNodeId;
          }

          if (element.type === 'button') {
            actions.addNode(
              {
                type: 'Button',
                props: {
                  text: element.props.text ||
   'Button',
                  background:
  element.props.background || '#007bff',
                  size: element.props.size ||
   'md'
                }
              },
              parentId
            );
            return currentNodeId;
          }

          if (element.type === 'image') {
            actions.addNode(
              {
                type: 'Image',
                props: {
                  src: element.props.src ||
  'https://via.placeholder.com/150',
                  radius:
  element.props.radius || 0
                }
              },
              parentId
            );
            return currentNodeId;
          }

          if (element.type === 'video') {
            actions.addNode(
              {
                type: 'Video',
                props: {
                  videoId:
  element.props.videoId || '',
                  videoUrl:
  element.props.videoUrl || '',
                  text: element.props.text ||
   ''
                }
              },
              parentId
            );
            return currentNodeId;
          }

          if (element.type === 'link') {
            actions.addNode(
              {
                type: 'Link',
                props: {
                  text: element.props.text ||
   'Link',
                  href: element.props.href ||
   '#',
                  fontSize:
  element.props.fontSize || '14'
                }
              },
              parentId
            );
            return currentNodeId;
          }

          return null;
        };

        const buildSection = async (section)=> {
          const containerId = createElement({
            type: 'container',
            props: section.props || { width:
  '100%', flexDirection: 'column' }
          }, parentNode);

          if (section.children &&
  Array.isArray(section.children)) {
            for (const child of
  section.children) {
              createElement(child,
  containerId);
            }
          }

          return containerId;
        };

        // Build all sections
        for (const section of
  layout.sections) {
          await buildSection(section);
        }

        setPrompt('');
        alert('Website generatedsuccessfully!');

      } catch (err) {
        console.error('Generation error:',
  err);
        setError('Failed to generate. Tryagain.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ padding: '10px',marginBottom: '10px', borderBottom: '1pxsolid #ddd' }}>
        <h4>🤖 AI Website Generator</h4>
        <textarea
          value={prompt}
          onChange={(e) =>
  setPrompt(e.target.value)}
          placeholder="Describe what website
  you want... (e.g., 'Landing page for a
  coffee shop with hero section and menu')"
          rows={3}
          style={{ width: '100%',
  marginBottom: '5px', padding: '5px' }}
        />
        <button
          onClick={generateWebsite}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc'
   : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' :
   'pointer'
          }}
        >
          {loading ? '🔄 Generating...' : '🚀Generate Website'}
        </button>
        {error && <p style={{ color: 'red',
  marginTop: '5px', fontSize: '12px'
  }}>{error}</p>}
        <small style={{ display: 'block',
  marginTop: '5px', color: '#666', fontSize:
  '11px' }}>
          This will REPLACE your current
  page!
        </small>
      </div>
    );
  }