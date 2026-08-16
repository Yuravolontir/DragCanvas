import { useEffect, useRef, useState } from 'react';

import { useWebGLSupported } from './useWebGLSupported.js';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';
import './Aurora.css';

/**
 * Light drifting behind the page.
 *
 * This is the only place WebGL is used, and it is used for the one thing DOM
 * genuinely cannot do: a continuous field of coloured light that moves. The
 * previous attempt spent 242 KB of three.js drawing rectangles that a browser
 * renders natively; this spends a few kilobytes on something a browser cannot
 * render at all.
 *
 * Written against raw WebGL rather than a library. The whole scene is one
 * triangle and one fragment shader - a library here would be several hundred
 * times the weight of the thing it was helping with.
 *
 * The colours are read from the theme's custom properties rather than repeated
 * as literals, so the shader cannot drift away from the palette.
 */

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_pointer;
uniform float u_scroll;
uniform vec3  u_ink;
uniform vec3  u_beam;
uniform vec3  u_haze;
uniform vec3  u_ember;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.0, 289.0))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  float t = u_time * 0.05;
  vec2 drift = (u_pointer - 0.5) * 0.12;
  float rise = u_scroll * 0.35;

  vec2 c1 = vec2(0.30 * aspect + sin(t * 1.10) * 0.10, 0.72 - rise)        + drift;
  vec2 c2 = vec2(0.78 * aspect + cos(t * 0.80) * 0.12, 0.30 + rise * 0.60) - drift * 0.7;
  vec2 c3 = vec2(0.55 * aspect + sin(t * 0.60 + 2.0) * 0.16, 1.02 - rise)  + drift * 0.4;

  float g1 = smoothstep(0.62, 0.0, length(p - c1));
  float g2 = smoothstep(0.55, 0.0, length(p - c2));
  float g3 = smoothstep(0.78, 0.0, length(p - c3));

  vec3 col = u_ink;
  col = mix(col, u_beam,  g1 * 0.55);
  col = mix(col, u_haze,  g2 * 0.45);
  col = mix(col, u_ember, g3 * 0.10);

  // The copy sits in the middle, so the light is pushed away from it
  col *= 1.0 - smoothstep(0.35, 1.15, length(uv - vec2(0.5, 0.62))) * 0.55;

  // Ordered noise below one 8-bit step. Without it a wide dark gradient bands
  // into visible stripes on ordinary displays, which is far uglier than grain.
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

/** '#4c8dff' -> [0.298, 0.553, 1.0] */
function toRgb(hex, fallback) {
  const value = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!value) return fallback;
  const n = parseInt(value[1], 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[aurora]', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function Aurora() {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  // Anything that goes wrong below drops the page to the CSS gradient. An
  // opaque canvas that failed to draw is worse than no canvas: it covers the
  // whole design in whatever its buffer happens to contain.
  const [failed, setFailed] = useState(false);
  const webglSupported = useWebGLSupported();
  const prefersReducedMotion = usePrefersReducedMotion();

  const animated = webglSupported && !prefersReducedMotion && !failed;

  useEffect(() => {
    if (!animated) return undefined;

    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return undefined;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
    if (!gl || gl.isContextLost()) {
      setFailed(true);
      return undefined;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) {
      setFailed(true);
      return undefined;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[aurora] link failed:', gl.getProgramInfoLog(program));
      setFailed(true);
      return undefined;
    }
    gl.useProgram(program);

    // One triangle covering the viewport - cheaper than two, and no seam
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = name => gl.getUniformLocation(program, name);
    const uRes = uniform('u_res');
    const uTime = uniform('u_time');
    const uPointer = uniform('u_pointer');
    const uScroll = uniform('u_scroll');

    const style = getComputedStyle(host);
    gl.uniform3fv(uniform('u_ink'), toRgb(style.getPropertyValue('--ink'), [0.03, 0.04, 0.08]));
    gl.uniform3fv(uniform('u_beam'), toRgb(style.getPropertyValue('--beam'), [0.30, 0.55, 1.0]));
    gl.uniform3fv(uniform('u_haze'), toRgb(style.getPropertyValue('--haze'), [0.48, 0.36, 1.0]));
    gl.uniform3fv(uniform('u_ember'), toRgb(style.getPropertyValue('--ember'), [1.0, 0.42, 0.29]));

    let pointer = [0.5, 0.5];
    let target = [0.5, 0.5];
    let scroll = 0;
    let running = true;
    let frame;

    const resize = () => {
      // Half resolution: this is an out-of-focus gradient, and nobody has ever
      // noticed a soft glow being soft.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      const width = Math.max(1, Math.round(host.clientWidth * dpr));
      const height = Math.max(1, Math.round(host.clientHeight * dpr));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uRes, width, height);
    };

    const onPointer = event => {
      target = [event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight];
    };

    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scroll = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };

    const start = performance.now();
    const render = now => {
      if (!running) return;
      // Chase the cursor rather than snap to it: the light has mass
      pointer[0] += (target[0] - pointer[0]) * 0.045;
      pointer[1] += (target[1] - pointer[1]) * 0.045;

      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uPointer, pointer[0], pointer[1]);
      gl.uniform1f(uScroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };

    const setRunning = next => {
      if (next === running) return;
      running = next;
      if (running) frame = requestAnimationFrame(render);
      else cancelAnimationFrame(frame);
    };

    // A gradient nobody is looking at is a gradient not worth drawing
    const onVisibility = () => setRunning(!document.hidden);

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    onScroll();

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      // Deliberately NOT losing the context here.
      //
      // Losing it is permanent for the canvas element, and React reuses that
      // element when the effect re-runs - which StrictMode does on every mount
      // in development. The second run then picks up the dead context, every
      // shader fails to compile with an empty info log, nothing is drawn, and
      // the blank canvas sits over the page looking like a grey background.
      // The context is released with the element when React removes it.
    };
  }, [animated]);

  return (
    <div
      ref={hostRef}
      className={`aurora${animated ? '' : ' aurora--still'}`}
      aria-hidden="true"
    >
      {animated && <canvas ref={canvasRef} />}
    </div>
  );
}
