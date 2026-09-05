import { cssRules, generateClass, knownAnchors, mobileRules } from './sheet.js';
import {
  escapeAttribute,
  escapeHtmlText,
  rgbaToString,
  slugifyAnchor,
  stylesToCss,
} from './values.js';
import { cloudinaryVariant, resolveImageSrc, responsiveImageAttrs } from './images.js';
import { getChildIds } from './nodes.js';
import { convertNode } from './convertNode.js';
import { imageAltText, videoMode, youTubeId } from '../elementData.js';
import { readSlides, slideInterval, slidesAutoplay, slidesPerView } from '../carouselSlides.js';
import { opensNewTab, safeHref } from '../elementRows.js';

/**
 * Pictures, video and the map - everything that is not text.
 *
 * Each entry turns one saved node into the markup a published page needs.
 * They are gathered up in converters.js next door.
 */
export const mediaConverters = {
  Image: (node) => {
    const props = node.props || {};
    const className = generateClass('image');

    const styles = {
      width: props.width || 'auto',
      height: props.height || 'auto',
      maxWidth: '100%',
      display: 'block',
      borderRadius: `${props.radius || 0}px`,
      objectFit: 'cover',
    };

    cssRules.push(`.${className} {\n${stylesToCss(styles)}\n}`);

    // Fixed-width images leave ragged edges in stacked mobile layouts
    if (/^\d+(\.\d+)?px$/.test(String(props.width || '').trim())) {
      mobileRules.push(`  .${className} {\n  width: 100%;\n  }`);
    }

    return `    <img class="${className}" src="${escapeAttribute(cloudinaryVariant(props.src, 1280))}"${responsiveImageAttrs(props.src)} alt="${escapeAttribute(imageAltText(props))}" loading="lazy" decoding="async" />\n`;
  },

  /*
   * The video player, in the three shapes the element has had.
   *
   * Background heroes go to their own converter. A YouTube id - typed here
   * before the YouTube element existed - still becomes an embed. Everything
   * else is a file the owner hosts, with the optional line of text centred over
   * it. Sizes come from the props the editor resized, capped so a fixed width
   * never makes a phone scroll sideways.
   */
  Video: (node, data, depth = 0) => {
    const props = node.props || {};
    const mode = videoMode(props);

    if (mode === 'background') {
      return mediaConverters.BackgroundVideo(
        { ...node, props: { ...props, src: props.src || props.videoUrl || '' } },
        data,
        depth
      );
    }

    const className = generateClass('video');
    const width = props.width || '100%';
    const height = props.height;

    cssRules.push(`.${className} {
  position: relative;
  width: ${width};
  max-width: 100%;
  ${height ? `height: ${height};` : 'aspect-ratio: 16 / 9;'}
  overflow: hidden;
}

.${className} iframe,
.${className} video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  object-fit: cover;
}`);

    if (/^\d+(\.\d+)?px$/.test(String(width).trim())) {
      mobileRules.push(`  .${className} {\n  width: 100%;\n  }`);
    }

    if (mode === 'youtube') {
      const id = youTubeId(props.videoId || props.videoUrl);
      if (!id) return '';
      return `    <div class="${className}">
      <iframe
        src="https://www.youtube.com/embed/${escapeAttribute(id)}"
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>\n`;
    }

    if (!props.videoUrl) return '';

    const overlayClass = generateClass('video-caption');
    cssRules.push(`.${overlayClass} {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  pointer-events: none;
  z-index: 2;
}

.${overlayClass} span {
  padding: 12px 18px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}`);

    return `    <div class="${className}">
      <video
        autoplay
        muted
        playsinline
        controls${props.loop === false ? '' : '\n        loop'}${props.poster ? `\n        poster="${escapeAttribute(props.poster)}"` : ''}>
        <source src="${escapeAttribute(props.videoUrl)}">
        Your browser does not support the video tag.
      </video>
      ${props.text ? `<div class="${overlayClass}"><span>${escapeHtmlText(props.text)}</span></div>` : ''}
    </div>\n`;
  },

  /** A YouTube clip, from whatever form of link the owner pasted. */
  YouTube: (node) => {
    const props = node.props || {};
    const id = youTubeId(props.video);
    if (!id) return '';

    const className = generateClass('youtube');
    const width = props.width || '560px';
    const height = props.height;

    cssRules.push(`.${className} {
  position: relative;
  width: ${width};
  max-width: 100%;
  ${height ? `height: ${height};` : 'aspect-ratio: 16 / 9;'}
  border-radius: ${Number(props.radius) || 0}px;
  overflow: hidden;
}

.${className} iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}`);

    if (/^\d+(\.\d+)?px$/.test(String(width).trim())) {
      mobileRules.push(`  .${className} {\n  width: 100%;\n  height: auto;\n  aspect-ratio: 16 / 9;\n  }`);
    }

    return `    <div class="${className}">
      <iframe
        src="https://www.youtube.com/embed/${escapeAttribute(id)}"
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>\n`;
  },

  /**
   * A hero with video behind it.
   *
   * Mirrors BackgroundVideo.jsx: three layers, same class names, same gate. The
   * <video> ships without a src on purpose — the inline script attaches one only
   * on a wide viewport and only when the visitor has not asked for less motion.
   * On a phone, under reduced motion, with JavaScript off, or when the file
   * fails, the poster is the hero and no video is fetched.
   */
  BackgroundVideo: (node, data, depth = 0) => {
    const props = node.props || {};
    const className = generateClass('backgroundvideo');

    // A video hero is a section, and a section a navigation link points at
    // needs the anchor as its id. The script finds the element by the same id,
    // so there is only ever one: the anchor when there is one, a generated
    // name when there is not.
    const anchor = slugifyAnchor(props.anchor);
    if (anchor) knownAnchors.add(anchor);
    const rootId = anchor || `${className}-root`;

    const src = props.src || '';
    const poster = props.poster ? resolveImageSrc(props.poster) : '';
    const dim = Math.min(100, Math.max(0, Number(props.overlay ?? 40))) / 100;
    const position = ['top', 'center', 'bottom'].includes(props.position) ? props.position : 'center';
    const objectPosition = position === 'top' ? 'center top' : position === 'bottom' ? 'center bottom' : 'center center';
    const minHeight = props.minHeight || '420px';

    cssRules.push(`.${className} {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  min-height: ${minHeight};
  overflow: hidden;${poster ? `
  background-image: url('${poster}');
  background-size: cover;
  background-position: ${objectPosition};` : ''}
}
.${className} > video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: ${objectPosition};
  pointer-events: none;
  z-index: 0;
}
.${className} > .dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, ${dim});
  pointer-events: none;
  z-index: 1;
}
.${className} > .content {
  position: relative;
  z-index: 2;
  width: 100%;
}`);

    let childrenHtml = '';
    for (const childNodeId of getChildIds(node)) {
      childrenHtml += convertNode(childNodeId, data, depth + 1);
    }

    const videoTag = src
      ? `      <video muted ${props.loop === false ? '' : 'loop '}playsinline preload="none"${poster ? ` poster="${escapeAttribute(poster)}"` : ''} aria-hidden="true" tabindex="-1" data-src="${escapeAttribute(src)}"></video>\n`
      : '';

    // No src, no script: a poster-only hero is static CSS.
    const script = src
      ? `      <script>
      (function () {
        var root = document.getElementById('${rootId}');
        if (!root) return;
        var video = root.querySelector('video');
        if (!video) return;
        var wide = !window.matchMedia || window.matchMedia('(min-width: 768px)').matches;
        var calm = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!wide || !calm) return;
        video.addEventListener('error', function () { video.style.display = 'none'; });
        video.src = video.getAttribute('data-src');
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
      })();
      </script>\n`
      : '';

    return `    <div class="${className}" id="${rootId}">
${videoTag}      <div class="dim"></div>
      <div class="content">
${childrenHtml}      </div>
${script}    </div>\n`;
  },

  /**
   * The carousel, matching what Carousel.jsx renders.
   *
   * The editor used to run react-bootstrap's carousel and this converter used to
   * emit a bare scroll-snap strip, so arrows, dots and autoplay existed on one
   * side and not the other. Both sides are the same scroll-snap strip now, and
   * the controls below are the same behaviour written for a page with no bundle.
   *
   * A carousel with no arrows, no dots and no autoplay still exports as pure
   * CSS, exactly as it did before.
   */
  Carousel: (node) => {
    const props = node.props || {};
    const className = generateClass('carousel');
    const trackId = `${className}-track`;

    const slides = readSlides(props);
    const height = props.height || '400px';
    const { desktop: perView, tablet: perViewTablet, mobile: perViewMobile } = slidesPerView(props);

    const arrows = props.arrows !== false && slides.length > 1;
    const dots = props.dots !== false && slides.length > 1;
    // The same reading the canvas uses, so a carousel that moves in the editor
    // moves on the page. `props.autoplay === true` failed every project that
    // had the string "true" stored here.
    const autoplay = slidesAutoplay(props) && slides.length > 1;
    const loop = props.loop !== false;
    const interval = slideInterval(props);

    cssRules.push(`.${className} {
  position: relative;
  width: 100%;
  height: ${height};
}
.${className} .track {
  --per-view: ${perView};
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  border-radius: 12px;
}
.${className} .track::-webkit-scrollbar { display: none; }
.${className} .slide {
  position: relative;
  flex: 0 0 calc(100% / var(--per-view));
  height: 100%;
  scroll-snap-align: start;
  overflow: hidden;
}
.${className} .slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.${className} .slide > a { display: block; width: 100%; height: 100%; color: inherit; text-decoration: none; }
.${className} .caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px 32px;
  color: #fff;
  background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9));
}
.${className} .caption h3 { margin: 0 0 4px; }
.${className} .caption p { margin: 0; font-size: 14px; }
.${className} .badge {
  display: inline-block;
  padding: 2px 10px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  color: #fff;
  background: ${rgbaToString(props.accent) || '#0d6efd'};
}
.${className} .arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.${className} .arrow:hover { background: rgba(0,0,0,0.65); }
.${className} .arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.${className} .arrow.prev { left: 10px; }
.${className} .arrow.next { right: 10px; }
.${className} .dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.${className} .dots button {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(255,255,255,0.45);
}
.${className} .dots button[aria-current="true"] { background: #fff; }
.${className} .dots button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (max-width: 900px) {
  .${className} .track { --per-view: ${perViewTablet}; }
}
@media (max-width: 600px) {
  .${className} .track { --per-view: ${perViewMobile}; }
}`);

    let slideHtml = '';
    slides.forEach((slide, i) => {
      if (!slide.src) return;
      const caption = slide.label || slide.heading || slide.text
        ? `        <div class="caption">
          ${slide.label ? `<span class="badge">${escapeHtmlText(slide.label)}</span>` : ''}
          ${slide.heading ? `<h3>${escapeHtmlText(slide.heading)}</h3>` : ''}
          ${slide.text ? `<p>${escapeHtmlText(slide.text)}</p>` : ''}
        </div>\n`
        : '';
      const image = `<img src="${escapeAttribute(cloudinaryVariant(slide.src, 1280))}"${responsiveImageAttrs(slide.src)} alt="${escapeAttribute(slide.alt)}" loading="lazy" decoding="async">`;
      const href = safeHref(slide.href);
      const body = href
        ? `<a href="${escapeAttribute(href)}"${opensNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${image}\n${caption}</a>`
        : `${image}\n${caption}`;
      slideHtml += `      <div class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">
        ${body}      </div>\n`;
    });

    const arrowHtml = arrows
      ? `      <button class="arrow prev" type="button" aria-label="Previous slide">&lsaquo;</button>
      <button class="arrow next" type="button" aria-label="Next slide">&rsaquo;</button>\n`
      : '';

    const dotsHtml = dots
      ? `      <div class="dots">${slides
          .map(
            (_, i) =>
              `<button type="button" aria-label="Go to slide ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`
          )
          .join('')}</div>\n`
      : '';

    // Only a carousel that actually has controls pays for a script.
    const script = arrows || dots || autoplay
      ? `      <script>
      (function () {
        var root = document.getElementById('${trackId}');
        if (!root) return;
        var track = root.querySelector('.track');
        var dots = root.querySelectorAll('.dots button');
        var step = function () {
          var first = track.firstElementChild;
          return first ? first.getBoundingClientRect().width : track.clientWidth;
        };
        var go = function (direction) {
          var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
          var atStart = track.scrollLeft <= 1;
          if (direction > 0 && atEnd) { if (${loop}) track.scrollTo({ left: 0, behavior: 'smooth' }); return; }
          if (direction < 0 && atStart) { if (${loop}) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' }); return; }
          track.scrollBy({ left: direction * step(), behavior: 'smooth' });
        };
        var prev = root.querySelector('.arrow.prev');
        var next = root.querySelector('.arrow.next');
        if (prev) prev.addEventListener('click', function () { go(-1); });
        if (next) next.addEventListener('click', function () { go(1); });
        Array.prototype.forEach.call(dots, function (dot, i) {
          dot.addEventListener('click', function () { track.scrollTo({ left: i * step(), behavior: 'smooth' }); });
        });
        track.addEventListener('keydown', function (event) {
          if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
        });
        track.addEventListener('scroll', function () {
          if (!dots.length) return;
          var width = step();
          if (!width) return;
          var active = Math.round(track.scrollLeft / width);
          Array.prototype.forEach.call(dots, function (dot, i) {
            if (i === active) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
          });
        }, { passive: true });
${autoplay ? `        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced) {
          var timer = setInterval(function () { go(1); }, ${interval});
          var stop = function () { clearInterval(timer); timer = null; };
          var start = function () { if (!timer) timer = setInterval(function () { go(1); }, ${interval}); };
          root.addEventListener('mouseenter', stop);
          root.addEventListener('mouseleave', start);
          root.addEventListener('focusin', stop);
          root.addEventListener('focusout', start);
        }\n` : ''}      })();
      </script>\n`
      : '';

    return `    <div class="${className}" id="${trackId}" role="region" aria-roledescription="carousel" aria-label="${escapeAttribute(props.title || 'Gallery')}">
      <div class="track" tabindex="0">
${slideHtml}      </div>
${arrowHtml}${dotsHtml}${script}    </div>\n`;
  },

  /**
   * A map, in a page that has no JavaScript.
   *
   * There was no converter for this at all, so every published site quietly lost
   * its map - the element is in the toolbox and in the resolver, and the export
   * simply skipped it. Found by the coverage test rather than by anyone noticing,
   * which is the point of that test.
   *
   * The editor draws it with Leaflet. Reproducing that in the export would mean a
   * script and a stylesheet from someone else's CDN on every published page, for
   * a static picture of a location. OpenStreetMap's embed is an iframe: no
   * script, nothing to load from a third party at runtime beyond the tiles
   * themselves, and it still pans and zooms.
   */
  Map: (node) => {
    const props = node.props || {};
    const className = generateClass('map');
    const lat = Number(props.lat) || 32.0853;
    const lng = Number(props.lng) || 34.7818;
    // A rough bounding box around the point; the zoom prop decides how tight
    const span = Math.max(0.002, 0.4 / Math.pow(1.6, (Number(props.zoom) || 13) - 8));
    const bbox = [lng - span, lat - span / 2, lng + span, lat + span / 2].join('%2C');

    cssRules.push(`.${className} {
  width: ${props.width || '100%'};
  /* A map inserted at a fixed width still has to fit a phone. */
  max-width: 100%;
  height: ${props.height || '300px'};
  border-radius: 8px;
  overflow: hidden;
}

.${className} iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}`);

    const label = escapeAttribute(props.label || 'Location');
    return `    <div class="${className}">
      <iframe title="${label}" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&amp;layer=mapnik&amp;marker=${lat}%2C${lng}"></iframe>
    </div>\n`;
  },
};
