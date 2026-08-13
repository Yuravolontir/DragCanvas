import React, { useState } from 'react';
import API_URL, { apiFetch, getToken } from './api.js';
  import { useEditor } from '@craftjs/core';

  export default function AIAssistant() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // low / balanced / bold -> temperature on the server
    const [creativity, setCreativity] = useState('balanced');
    // The layout the generator produced, kept so it can be refined afterwards
    const [layout, setLayout] = useState(null);
    const [refinement, setRefinement] = useState('');
    const [history, setHistory] = useState([]);

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

    /**
     * Ask our own server for one generated image.
     *
     * This used to call Stability straight from the browser with the key in an
     * import.meta.env variable, which Vite compiles into the bundle every
     * visitor downloads - the key was readable by anyone who opened the site.
     * The server holds it now and returns the PNG, exactly as the admin charts
     * do. A null means "leave the placeholder", so one failed image never
     * costs the whole page.
     */
    const generateImage = async (imagePrompt) => {
      try {
        const res = await fetch(`${API_URL}/api/ai/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: imagePrompt }),
        });

        if (!res.ok) return null;
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error('Image generation error:', e);
        return null;
      }
    };

    const collectImageInfo = (sections) => {
      const images = [];
      const walk = (elements) => {
        if (!Array.isArray(elements)) return;
        for (const el of elements) {
          if (el.type === 'Image' && el.props?.src?.includes('picsum.photos/seed/')) {
            const seed = el.props.src.split('/seed/')[1]?.split('/')[0] || 'image';
            const desc = seed.replace(/[-_]/g, ' ');
            images.push({ path: el, seed, prompt: `${desc}, professional website photo, high quality` });
          }
          if (el.type === 'Carousel') {
            ['src1', 'src2', 'src3'].forEach((key, i) => {
              if (el.props?.[key]?.includes('picsum.photos/seed/')) {
                const seed = el.props[key].split('/seed/')[1]?.split('/')[0] || `slide${i + 1}`;
                const heading = el.props?.[`heading${i + 1}`] || '';
                const desc = seed.replace(/[-_]/g, ' ');
                images.push({ path: el, key, seed, prompt: `${desc}${heading ? ', ' + heading : ''}, professional website photo, high quality` });
              }
            });
          }
          if (el.children) walk(el.children);
        }
      };
      walk(sections);
      return images;
    };

    const replaceImages = async (sections) => {
      const images = collectImageInfo(sections);
      if (images.length === 0) return;

      const prompts = [...new Set(images.map(i => i.prompt))].slice(0, 6);
      const results = await Promise.all(
        prompts.map(p => generateImage(p))
      );
      const urlMap = {};
      prompts.forEach((p, i) => { urlMap[p] = results[i]; });

      images.forEach(img => {
        const url = urlMap[img.prompt];
        if (url) {
          if (img.key) {
            img.path.props[img.key] = url;
          } else {
            img.path.props.src = url;
          }
        }
      });
    };

    /** Put a layout on the canvas and remember it for the next refinement. */
    const applyLayout = async (nextLayout) => {
      await replaceImages(nextLayout.sections);
      actions.deserialize(buildCraftTree(nextLayout.sections));
      setLayout(nextLayout);
    };

    /**
     * Keep talking to the page that was just generated: "same but darker",
     * "add a pricing section". The server edits the layout we hold in state.
     */
    const refineWebsite = async () => {
      if (!refinement.trim() || !layout) return;

      setLoading(true);
      setError(null);

      try {
        const refined = await apiFetch('/api/ai/refine', {
          method: 'POST',
          body: { layout, instruction: refinement }
        });

        if (!refined?.sections?.length) {
          throw new Error('AI did not return a valid layout');
        }

        await applyLayout(refined);
        setHistory(prev => [...prev, refinement]);
        setRefinement('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const generateWebsite = async () => {
      if (!prompt.trim()) return;

      setLoading(true);
      setError(null);

      try {
        // Generation runs on our server: the provider key stays there, and the
        // response goes through parse -> repair -> normalise before we get it
        const parsed = await apiFetch('/api/ai/generate', {
          method: 'POST',
          body: { prompt, creativity }
        });

        if (!parsed?.sections || !Array.isArray(parsed.sections)) {
          throw new Error('AI did not return valid sections');
        }

        await applyLayout(parsed);
        setHistory([`Generated: ${prompt}`]);
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

        {/* How far the model may stray from the safe, conventional answer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <span style={{ fontSize: 11, color: '#79747e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Style:</span>
          {[
            { key: 'low', label: 'Safe' },
            { key: 'balanced', label: 'Balanced' },
            { key: 'bold', label: 'Bold' },
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setCreativity(option.key)}
              disabled={loading}
              style={{
                padding: '3px 10px',
                fontSize: 11,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: creativity === option.key ? 700 : 500,
                color: creativity === option.key ? '#fff' : '#79747e',
                background: creativity === option.key ? '#7e57c2' : 'transparent',
                border: `1px solid ${creativity === option.key ? '#7e57c2' : '#e8e0eb'}`,
                borderRadius: '9999px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Once a page exists, the user can keep asking for changes to it */}
        {layout && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ecf2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#7e57c2' }}>tune</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#49454f' }}>
                Refine this page
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <input
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !loading) refineWebsite(); }}
                placeholder="Make it darker · Add a pricing section · Remove the map"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #e8e0eb',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none',
                  background: '#f7f4ec',
                  color: '#1c1b1f',
                }}
              />
              <button
                onClick={refineWebsite}
                disabled={loading || !refinement.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (loading || !refinement.trim()) ? '#cac4d0' : '#49454f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: (loading || !refinement.trim()) ? 'not-allowed' : 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {loading ? 'Wait...' : 'Apply'}
              </button>
            </div>

            {history.length > 1 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#79747e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {history.slice(1).map((item, i) => (
                  <div key={i} style={{ padding: '2px 0' }}>· {item}</div>
                ))}
              </div>
            )}

            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 11, color: '#a09aa8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Refines the generated page. Changes you make by hand in the editor are not included.
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', marginTop: 5, fontSize: 12 }}>
            {error}
          </p>
        )}
      </div>
    );
  }
