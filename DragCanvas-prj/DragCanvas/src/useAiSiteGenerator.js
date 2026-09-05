import { useEffect, useState } from 'react';
import { useEditor } from '@craftjs/core';

import { apiFetch } from './api.js';
import { buildCraftTree } from './utils/craftTree.js';
import { craftProjectToAiLayout } from './utils/craftToAiLayout.js';
import { isImageRefinement } from './utils/imagePrompts.js';
import { replacePlaceholderImages } from './utils/aiImages.js';

/** How often the progress bar re-reads the clock while we wait. */
const ELAPSED_TICK_MS = 250;

/** The pages of a layout, with a single-page answer turned into a one-page list. */
function pagesOf(layout) {
  const hasPages = Array.isArray(layout.pages) && layout.pages.length > 0;
  if (hasPages) return layout.pages;
  return [{ name: 'Home', slug: 'home', sections: layout.sections || [] }];
}

/** True when the server answered with something we can actually put on a canvas. */
function looksLikeALayout(layout) {
  return Boolean(layout?.sections?.length) || Boolean(layout?.pages?.length);
}

/**
 * The whole "AI writes a site" flow: generating, refining, and the progress the
 * user sees while it happens.
 *
 * The component that calls this hook only has to draw buttons; every request,
 * every stage name and every error message is decided here.
 */
export function useAiSiteGenerator() {
  const { actions, query } = useEditor();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Which part of the wait we are in.
   *
   * A spinner turning for fifty seconds says the same thing as a frozen one.
   * These stages are already distinct events in the code - the completion
   * returns, the pictures are requested, the tree is deserialised - so the wait
   * can say which one it is in, and how many pictures are left.
   */
  const [stage, setStage] = useState(null);

  // The layout phase reports nothing until it answers, so the bar's estimate
  // needs its own heartbeat or it would sit still for half a minute.
  const [elapsed, setElapsed] = useState(0);

  // Everything the user has asked for so far, shown under the refine box.
  const [history, setHistory] = useState([]);

  // Refining only makes sense once there is a page to refine.
  const [canRefine, setCanRefine] = useState(Boolean(window.__dragcanvasPageState));

  useEffect(() => {
    const markRefinable = () => setCanRefine(true);
    window.addEventListener('dragcanvas:project-loaded', markRefinable);
    return () => window.removeEventListener('dragcanvas:project-loaded', markRefinable);
  }, []);

  useEffect(() => {
    if (!loading) {
      setElapsed(0);
      return undefined;
    }

    const startedAt = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), ELAPSED_TICK_MS);
    return () => clearInterval(timer);
  }, [loading]);

  /**
   * Keep the visitor's canvas before we ask them to sign up.
   *
   * The sign-up prompt promises their design will be waiting afterwards, and
   * LoadProjectOnMount is what keeps that promise. Saving here is what makes
   * the promise true - the same thing the header does for Save and Publish.
   */
  const saveDraftLocally = () => {
    try {
      localStorage.setItem('dragcanvas_draft', query.serialize());
    } catch {
      // A canvas that will not serialise is still a visitor worth asking.
    }
  };

  /**
   * Put a layout on the canvas and remember it for the next refinement.
   *
   * Images are drawn before Craft serialises the pages, so saving, switching
   * pages and publishing can never capture a temporary blob URL.
   */
  const applyLayout = async (
    layout,
    { replaceImages = false, imageInstruction = '', siteBrief = '' } = {},
  ) => {
    const sourcePages = pagesOf(layout);

    await replacePlaceholderImages(
      { pages: sourcePages },
      { replaceExisting: replaceImages, instruction: imageInstruction, siteBrief },
      ({ remaining, total }) => setStage({ name: 'images', remaining, total }),
    );

    const builtPages = sourcePages.map((page, index) => {
      // The first page is always the site root, whatever the AI called it.
      const slug = index === 0 ? 'home' : page.slug;
      const built = buildCraftTree(page.sections, `${slug}-`);
      return { ...page, slug, data: built.nodes, nodeIdOf: built.nodeIdOf };
    });
    const firstPage = builtPages[0];

    setStage({ name: 'placing' });
    actions.deserialize(firstPage.data);

    // The editor keeps the page collection on `window` so the header, the page
    // switcher and the publisher all read the same list.
    const pageState = {
      pages: builtPages.map(({ name, slug, data }) => ({ name, slug, data })),
      currentSlug: firstPage.slug,
      siteSettings: {},
    };
    window.__dragcanvasPageState = pageState;
    window.dispatchEvent(new CustomEvent('dragcanvas:pages-loaded', { detail: pageState }));
    setCanRefine(true);
  };

  /**
   * Write a brand new site from one sentence.
   *
   * @returns {Promise<boolean>} true when a site was placed on the canvas
   */
  const generateSite = async ({ prompt, creativity, multiPage }) => {
    setLoading(true);
    setError(null);
    setStage({ name: 'layout' });

    try {
      // Generation runs on our server: the provider key stays there, and the
      // answer goes through parse -> repair -> normalise before we see it.
      const layout = await apiFetch('/api/ai/generate', {
        method: 'POST',
        body: { prompt, creativity, multiPage },
      });

      if (!Array.isArray(layout?.sections) && !Array.isArray(layout?.pages)) {
        throw new Error('AI did not return valid pages or sections');
      }

      await applyLayout(layout, { imageInstruction: prompt, siteBrief: prompt });
      setHistory([`Generated: ${prompt}`]);
      return true;
    } catch (err) {
      console.error('AI Generate Error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
      setStage(null);
    }
  };

  /**
   * Keep talking to the page that is already on the canvas: "same but darker",
   * "add a pricing section". The server edits the layout we send it.
   *
   * @returns {Promise<boolean>} true when the canvas changed
   */
  const refineSite = async (instruction) => {
    const currentLayout = craftProjectToAiLayout(
      window.__dragcanvasPageState,
      JSON.parse(query.serialize()),
    );

    const nothingToRefine = !currentLayout.sections?.length
      && !currentLayout.pages?.some((page) => page.sections.length);
    if (nothingToRefine) {
      setError('Add or load some content before asking AI to refine it.');
      return false;
    }

    setLoading(true);
    setError(null);
    setStage({ name: 'refining' });

    try {
      if (isImageRefinement(instruction)) {
        // "Change the photos" needs no new text, so it skips the layout call
        // and only redraws the pictures of the layout we already hold.
        await applyLayout(currentLayout, {
          replaceImages: true,
          imageInstruction: instruction,
          siteBrief: history.join('. '),
        });
      } else {
        const refined = await apiFetch('/api/ai/refine', {
          method: 'POST',
          body: { layout: currentLayout, instruction },
        });

        if (!looksLikeALayout(refined)) {
          throw new Error('AI did not return a valid layout');
        }

        await applyLayout(refined, {
          imageInstruction: instruction,
          siteBrief: history.join('. '),
        });
      }

      setHistory((previous) => [...previous, instruction]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
      setStage(null);
    }
  };

  return {
    loading,
    stage,
    elapsed,
    error,
    history,
    canRefine,
    generateSite,
    refineSite,
    saveDraftLocally,
  };
}
