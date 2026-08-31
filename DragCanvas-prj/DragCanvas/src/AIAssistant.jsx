import React, { useEffect, useState } from 'react';
import API_URL, { apiFetch, getToken } from './api.js';
import { stageProgress } from './utils/generationProgress.js';
import { consumePendingPrompt } from './Components/Home/promptHandoff.js';
import { craftProjectToAiLayout } from './utils/craftToAiLayout.js';
import { collectImageTasks, isImageRefinement } from './utils/imagePrompts.js';

/**
 * What to call the current stage on the button.
 *
 * Named for what is happening rather than for how long it will take, because
 * nobody can promise the second one and a wrong promise is worse than none.
 */
function stageLabel(stage) {
  if (!stage) return 'Working…';
  if (stage.name === 'layout') return 'Writing the layout…';
  if (stage.name === 'refining') return 'Rewriting the page…';
  if (stage.name === 'placing') return 'Placing the page…';
  if (stage.name === 'images') {
    return stage.remaining > 0
      ? `Drawing ${stage.remaining} image${stage.remaining === 1 ? '' : 's'}…`
      : 'Finishing…';
  }
  return 'Working…';
}
  import { useEditor } from '@craftjs/core';

  export default function AIAssistant() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    /**
     * Which part of the wait we are in.
     *
     * A spinner turning for fifty seconds says the same thing as a frozen one.
     * These three are already distinct events in the code - the completion
     * returns, the pictures are requested, the tree is deserialised - so the
     * wait can say which it is in, and how many pictures are left.
     */
    const [stage, setStage] = useState(null);
    const [error, setError] = useState(null);
    // low / balanced / bold -> temperature on the server
    const [creativity, setCreativity] = useState('balanced');
    const [multiPage, setMultiPage] = useState(false);
    const [canRefine, setCanRefine] = useState(Boolean(window.__dragcanvasPageState));
    const [refinement, setRefinement] = useState('');
    const [history, setHistory] = useState([]);

    const { actions, query } = useEditor();

    /**
     * Pick up a prompt typed on the landing page.
     *
     * Someone who described their site in the hero was sent here through
     * registration; arriving at an empty box would make that invitation a bait.
     * Read in an effect rather than in a useState initialiser because the
     * read consumes the value, and StrictMode invokes initialisers twice - the
     * second call would find it already gone.
     */
    useEffect(() => {
      const pending = consumePendingPrompt();
      if (pending) setPrompt(pending);
    }, []);

    useEffect(() => {
      const projectLoaded = () => setCanRefine(true);
      window.addEventListener('dragcanvas:project-loaded', projectLoaded);
      return () => window.removeEventListener('dragcanvas:project-loaded', projectLoaded);
    }, []);

    /**
     * Turn the generated layout into a Craft node map.
     *
     * Also hands back which node each source element became. The images are
     * swapped in after the page is already on the canvas, and by then the
     * layout JSON is no longer what the editor is showing - the nodes are. Without
     * this mapping the only way back would be to deserialise a second time, which
     * would throw away anything the person had touched in the meantime.
     */
    const buildCraftTree = (sections, idPrefix = '') => {
      const nodes = {};
      const nodeIdOf = new Map();

      nodes.ROOT = {
        type: { resolvedName: 'Container' },
        isCanvas: true,
        props: { width: '800px', height: 'auto', flexDirection: 'column' },
        displayName: 'Container',
        custom: {},
        hidden: false,
        nodes: []
      };

      let idCounter = 1;

      const buildNode = (element, parentId) => {
        if (!element || typeof element !== 'object') return;
        const nodeId = `${idPrefix}node-${idCounter++}`;
        const resolvedName = element.type
          ? element.type.charAt(0).toUpperCase() + element.type.slice(1)
          : 'Container';

        nodes[nodeId] = {
          type: { resolvedName },
          isCanvas: resolvedName === 'Container' || (resolvedName === 'Video' && element.props?.sourceType === 'background'),
          props: element.props || {},
          displayName: resolvedName,
          custom: {},
          hidden: false,
          nodes: []
        };

        nodeIdOf.set(element, nodeId);
        nodes[parentId].nodes.push(nodeId);

        // Recursively build children
        if (Array.isArray(element.children) && element.children.length > 0) {
          for (const child of element.children) {
            buildNode(child, nodeId);
          }
        }
      };

      for (const section of sections) {
        if (!section || typeof section !== 'object') continue;
        const sectionId = `${idPrefix}section-${idCounter++}`;

        /**
         * A top-level section is usually a Container, but not always.
         *
         * The model sometimes puts a NavbarElement straight at the top rather
         * than wrapping it, and this loop used to build every section as a
         * Container regardless - so that navbar became an empty Container with a
         * navbar's props, and the page came out with no navigation at all. Two
         * generations out of three lost their navbar that way.
         *
         * Only a Container can hold children, so isCanvas follows the type
         * rather than being assumed.
         */
        const sectionType = section.type && section.type.toLowerCase() !== 'container'
          ? section.type.charAt(0).toUpperCase() + section.type.slice(1)
          : 'Container';

        nodes[sectionId] = {
          type: { resolvedName: sectionType },
          isCanvas: sectionType === 'Container' || (sectionType === 'Video' && section.props?.sourceType === 'background'),
          props: section.props || {},
          displayName: sectionType,
          custom: {},
          hidden: false,
          nodes: []
        };

        nodeIdOf.set(section, sectionId);
        nodes.ROOT.nodes.push(sectionId);

        // Build all children recursively
        if (Array.isArray(section.children)) {
          for (const child of section.children) {
            buildNode(child, sectionId);
          }
        }
      }

      return { nodes, nodeIdOf };
    };

    /**
     * Ask our own server for one generated image.
     *
     * This used to call Stability straight from the browser with the key in an
     * import.meta.env variable, which Vite compiles into the bundle every
     * visitor downloads - the key was readable by anyone who opened the site.
     * The server holds it now, stores the result in Cloudinary and returns a
     * permanent HTTPS URL. A null means "leave the placeholder", so one failed
     * image never costs the whole page.
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
        const payload = await res.json();
        return payload?.data?.url || null;
      } catch (e) {
        console.error('Image generation error:', e);
        return null;
      }
    };

    /**
     * Replace every Picsum placeholder before Craft serialises the pages. This
     * includes ordinary images, section backgrounds, legacy carousels and the
     * current slides-array carousel format.
     */
    const fillInImages = async (layout, options = {}) => {
      const images = collectImageTasks(layout, options);
      if (images.length === 0) return;

      const prompts = [...new Set(images.map(i => i.prompt))];
      const total = prompts.length;
      let remaining = total;
      setStage({ name: 'images', remaining, total });

      // Keep provider pressure modest while still replacing every placeholder.
      for (let index = 0; index < prompts.length; index += 3) {
        await Promise.all(prompts.slice(index, index + 3).map(async (imagePrompt) => {
          const url = await generateImage(imagePrompt);
          remaining -= 1;
          setStage({ name: 'images', remaining, total });
          if (!url) return;
          for (const img of images) if (img.prompt === imagePrompt) img.target[img.key] = url;
        }));
      }
    };

    /**
     * Put a layout on the canvas and remember it for the next refinement.
     *
     * Images are persisted before Craft serialises the pages, so saving,
     * switching pages and publishing can never capture temporary blob URLs.
     */
    const applyLayout = async (nextLayout, { replaceImages = false, imageInstruction = '', siteBrief = '' } = {}) => {
      const sourcePages = Array.isArray(nextLayout.pages) && nextLayout.pages.length
        ? nextLayout.pages
        : [{ name: 'Home', slug: 'home', sections: nextLayout.sections || [] }];
      await fillInImages({ pages: sourcePages }, {
        replaceExisting: replaceImages,
        instruction: imageInstruction,
        siteBrief,
      });
      const builtPages = sourcePages.map((page, index) => {
        const slug = index === 0 ? 'home' : page.slug;
        const built = buildCraftTree(page.sections, `${slug}-`);
        return { ...page, slug, data: built.nodes, nodeIdOf: built.nodeIdOf };
      });
      const first = builtPages[0];

      setStage({ name: 'placing' });
      actions.deserialize(first.data);
      const pageState = {
          pages: builtPages.map(({ name, slug, data }) => ({ name, slug, data })),
          currentSlug: first.slug,
          siteSettings: {},
      };
      window.__dragcanvasPageState = pageState;
      window.dispatchEvent(new CustomEvent('dragcanvas:pages-loaded', { detail: pageState }));
      setCanRefine(true);

    };

    /**
     * Keep talking to the page that was just generated: "same but darker",
     * "add a pricing section". The server edits the layout we hold in state.
     */
    const refineWebsite = async () => {
      if (!refinement.trim()) return;

      const currentLayout = craftProjectToAiLayout(
        window.__dragcanvasPageState,
        JSON.parse(query.serialize()),
      );
      if (!currentLayout.sections?.length && !currentLayout.pages?.some(page => page.sections.length)) {
        setError('Add or load some content before asking AI to refine it.');
        return;
      }

      setLoading(true);
      setError(null);
      setStage({ name: 'refining' });

      try {
        const imageOnly = isImageRefinement(refinement);
        if (imageOnly) {
          await applyLayout(currentLayout, {
            replaceImages: true,
            imageInstruction: refinement,
            siteBrief: history.join('. '),
          });
          setHistory(prev => [...prev, refinement]);
          setRefinement('');
          return;
        }
        const refined = await apiFetch('/api/ai/refine', {
          method: 'POST',
          body: { layout: currentLayout, instruction: refinement }
        });

        if (!refined?.sections?.length && !refined?.pages?.length) {
          throw new Error('AI did not return a valid layout');
        }

        await applyLayout(refined, { imageInstruction: refinement, siteBrief: history.join('. ') });
        setHistory(prev => [...prev, refinement]);
        setRefinement('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setStage(null);
      }
    };

    const generateWebsite = async () => {
      if (!prompt.trim()) return;

      setLoading(true);
      setError(null);
      setStage({ name: 'layout' });

      try {
        // Generation runs on our server: the provider key stays there, and the
        // response goes through parse -> repair -> normalise before we get it
        const parsed = await apiFetch('/api/ai/generate', {
          method: 'POST',
          body: { prompt, creativity, multiPage }
        });

        if (!Array.isArray(parsed?.sections) && !Array.isArray(parsed?.pages)) {
          throw new Error('AI did not return valid pages or sections');
        }

        await applyLayout(parsed, { imageInstruction: prompt, siteBrief: prompt });
        setHistory([`Generated: ${prompt}`]);
        setPrompt('');
      } catch (err) {
        console.error('AI Generate Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setStage(null);
      }
    };

    return (
      <>
      {loading && (
        <div className="ai-generation-backdrop" role="status" aria-live="polite" aria-label={stageLabel(stage)}>
          <div className="ai-generation-modal">
            <div className="ai-generation-spinner" aria-hidden="true" />
            <strong>{stageLabel(stage)}</strong>
            {(() => {
              const progress = stageProgress(stage);
              return (
                <>
                  <div
                    className="ai-generation-progress"
                    data-mode={progress.mode}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    {...(progress.mode === 'value'
                      ? { 'aria-valuenow': Math.round(progress.value * 100) }
                      : {})}
                  >
                    <div
                      className="ai-generation-progress-fill"
                      style={progress.mode === 'value'
                        ? { width: `${Math.round(progress.value * 100)}%` }
                        : undefined}
                    />
                  </div>
                  {progress.step && <span className="ai-generation-step">{progress.step}</span>}
                </>
              );
            })()}
            <span>AI is building your site. This can take a little while.</span>
          </div>
        </div>
      )}
      <div style={{
        padding: '12px 16px',
        margin: '0 auto 10px',
        background: 'var(--surface)',
        borderRadius: '12px',
        border: '1px solid var(--outline-light)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        maxWidth: '800px',
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--haze)' }}>auto_awesome</span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>AI Generator</span>
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
              border: '1px solid var(--outline-light)',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
              resize: 'none',
              background: 'var(--surface-dim)',
              color: 'var(--on-surface)',
            }}
          />
          <button
            onClick={generateWebsite}
            disabled={loading}
            style={{
              padding: '8px 18px',
              backgroundColor: loading ? 'var(--outline-variant)' : 'var(--haze)',
              color: 'var(--on-primary)',
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
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--on-primary)' }}>auto_awesome</span>
            {loading ? stageLabel(stage) : 'Generate'}
          </button>
        </div>

        {/* How far the model may stray from the safe, conventional answer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Style:</span>
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
                color: creativity === option.key ? '#fff' : 'var(--muted)',
                background: creativity === option.key ? 'var(--haze)' : 'transparent',
                border: `1px solid ${creativity === option.key ? 'var(--haze)' : 'var(--outline-light)'}`,
                borderRadius: '9999px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
          <label style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', cursor: loading ? 'not-allowed' : 'pointer' }}>
            <input type="checkbox" checked={multiPage} disabled={loading} onChange={(event) => setMultiPage(event.target.checked)} />
            Multi-page site
          </label>
        </div>

        {/* Once a page exists, the user can keep asking for changes to it */}
        {canRefine && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--surface-container)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--haze)' }}>tune</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                Refine this site
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
                  border: '1px solid var(--outline-light)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none',
                  background: 'var(--surface-dim)',
                  color: 'var(--on-surface)',
                }}
              />
              <button
                onClick={refineWebsite}
                disabled={loading || !refinement.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (loading || !refinement.trim()) ? 'var(--outline-variant)' : 'var(--on-surface-variant)',
                  color: 'var(--on-primary)',
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
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {history.slice(1).map((item, i) => (
                  <div key={i} style={{ padding: '2px 0' }}>· {item}</div>
                ))}
              </div>
            )}

            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 11, color: '#a09aa8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Refines the current saved or generated site, including changes you made by hand in the editor.
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', marginTop: 5, fontSize: 12 }}>
            {error}
          </p>
        )}
      </div>
      </>
    );
  }
