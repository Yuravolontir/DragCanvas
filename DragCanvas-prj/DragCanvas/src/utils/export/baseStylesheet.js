/**
 * The rules every published page starts with, before a single element is
 * converted: the reset, the body type, and the three small widgets the shell
 * always ships - the scroll bar at the top, the back-to-top button, and the
 * lightbox a picture opens into.
 */
export function baseStylesheet(pageBackground) {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  /* Navigation links land on their section instead of teleporting to it */
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: ${pageBackground};
}

img {
  max-width: 100%;
  height: auto;
}

a {
  text-decoration: none;
}

button {
  font-family: inherit;
}

.dc-scroll-progress { position: fixed; inset: 0 0 auto; height: 3px; z-index: 10000; transform-origin: left; transform: scaleX(0); background: #0060ac; }
.dc-back-top { position: fixed; right: 18px; bottom: 18px; z-index: 9999; width: 44px; height: 44px; border: 0; border-radius: 50%; background: #0060ac; color: #fff; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .2s; }
.dc-back-top.visible { opacity: 1; pointer-events: auto; }
dialog.dc-lightbox { border: 0; padding: 0; max-width: min(92vw, 1200px); max-height: 92vh; background: transparent; }
dialog.dc-lightbox::backdrop { background: rgba(0,0,0,.82); }
dialog.dc-lightbox img { display: block; max-width: 92vw; max-height: 88vh; object-fit: contain; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}`;
}
