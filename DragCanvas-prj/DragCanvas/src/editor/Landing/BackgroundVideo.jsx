import { useNode } from '@craftjs/core';
import React, { useEffect, useRef } from 'react';

import { BackgroundVideoSettings } from './BackgroundVideoSettings';

/**
 * A video behind whatever you drop on it.
 *
 * This is a canvas, so the content over the video is real nodes — a Heading, a
 * Button, a Form — rather than one string prop. `Video` has a `text` prop that
 * renders exactly one <h1>, which is why a hero built on it can never have a
 * subheading and a button.
 *
 * Three layers in one stacking context:
 *
 *     video    z 0   absolute, object-fit: cover, pointer-events: none
 *     overlay  z 1   absolute, rgba dim,          pointer-events: none
 *     children z 2   relative, normal flow, clickable
 *
 * The pointer-events lines are what keep the call to action clickable. Without
 * them the dim overlay sits over the button and eats the click.
 */

/** Where the frame is anchored when object-fit: cover crops it. */
const OBJECT_POSITION = {
  top: 'center top',
  center: 'center center',
  bottom: 'center bottom',
};

/** Matches the breakpoint the exporter already uses for its mobile rules. */
const WIDE = '(min-width: 768px)';
const CALM = '(prefers-reduced-motion: reduce)';

export const BackgroundVideoView = ({ connect, ...props }) => {
  const {
    src = '',
    poster = '',
    overlay = 40,
    position = 'center',
    minHeight = '420px',
    loop = true,
    children,
  } = props;

  const videoRef = useRef(null);

  /*
   * The <video> ships with no src. It gets one only on a wide viewport, and only
   * when the visitor has not asked the system for less motion. On a phone, under
   * reduced motion, or with the script never running, the poster is the hero and
   * not one byte of video is fetched.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    const wide = window.matchMedia?.(WIDE).matches ?? true;
    const calm = !(window.matchMedia?.(CALM).matches ?? false);
    if (!wide || !calm) return undefined;

    const onError = () => {
      // The poster stays: it is on the wrapper's background as well as the
      // video's own attribute, so a dead file degrades to a still image.
      video.style.display = 'none';
    };
    video.addEventListener('error', onError);
    video.src = src;
    // Safari refuses muted autoplay often enough that an unhandled rejection
    // would be permanent console noise on a published page.
    video.play?.().catch(() => {});

    return () => {
      video.removeEventListener('error', onError);
      video.removeAttribute('src');
    };
  }, [src]);

  const dim = Math.min(100, Math.max(0, Number(overlay) || 0)) / 100;

  if (!src && !poster) {
    return (
      <div
        ref={connect}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight,
          border: '1px dashed var(--outline-light, #c4c5d9)',
          borderRadius: 12,
          color: 'var(--muted, #8f99b2)',
          fontSize: 13,
        }}
      >
        Add a video or a poster image in the settings panel
      </div>
    );
  }

  return (
    <div
      ref={connect}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        minHeight,
        overflow: 'hidden',
        // Belt to the poster attribute's braces: if the video element is hidden
        // after a load error, this is what remains behind the content.
        backgroundImage: poster ? `url(${poster})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: OBJECT_POSITION[position] || OBJECT_POSITION.center,
      }}
    >
      {src && (
        <video
          ref={videoRef}
          muted
          loop={loop !== false}
          playsInline
          preload="none"
          poster={poster || undefined}
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: OBJECT_POSITION[position] || OBJECT_POSITION.center,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0, 0, 0, ${dim})`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>{children}</div>
    </div>
  );
};

/** Legacy resolver kept so previously saved projects continue to open. */
export const BackgroundVideo = (props) => {
  const {
    connectors: { connect },
  } = useNode();

  return <BackgroundVideoView connect={connect} {...props} />;
};

BackgroundVideo.craft = {
  displayName: 'Background Video',
  props: {
    src: '',
    poster: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600',
    overlay: 40,
    position: 'center',
    minHeight: '420px',
    loop: true,
  },
  related: {
    toolbar: BackgroundVideoSettings,
  },
};
