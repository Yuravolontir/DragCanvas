import { useState } from 'react';

/**
 * Can this machine render the hero scene at a sensible frame rate?
 *
 * Not simply "does WebGL exist". A lecture-hall PC or a projector-driven laptop
 * often answers yes and then renders through SwiftShader or llvmpipe on the CPU,
 * which is far worse than showing nothing: the page appears to work and then
 * crawls at a handful of frames per second in front of an audience. A software
 * renderer is therefore treated the same as no WebGL at all - the poster is the
 * better answer in both cases.
 *
 * The probe costs a real GL context, so it runs once per page load and the
 * answer is remembered at module level.
 */

const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;

let cachedAnswer = null;

function probe() {
  if (cachedAnswer !== null) return cachedAnswer;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      cachedAnswer = false;
      return cachedAnswer;
    }

    // Firefox with resistFingerprinting, and some locked-down browsers, refuse
    // this extension. A refusal tells us nothing bad - only that we cannot
    // check - so the benefit of the doubt goes to the hardware.
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';

    cachedAnswer = !SOFTWARE_RENDERERS.test(renderer);

    // Hand the context back rather than waiting for garbage collection; browsers
    // cap how many live contexts a page may hold.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    // A throwing probe is not a working GPU
    cachedAnswer = false;
  }

  return cachedAnswer;
}

/** True when the hero scene should actually be rendered. */
export function useWebGLSupported() {
  // The answer cannot change while the page is open, so it is read once and
  // never subscribed to.
  const [supported] = useState(probe);
  return supported;
}
