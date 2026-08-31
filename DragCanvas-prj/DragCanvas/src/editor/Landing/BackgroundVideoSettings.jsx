import { useNode } from '@craftjs/core';
import React, { useEffect, useState } from 'react';

import { ToolbarSection } from './Toolbar/ToolbarSection';

const POSITIONS = [
  ['top', 'Top', 'skylines, faces near the top'],
  ['center', 'Middle', 'the usual choice'],
  ['bottom', 'Bottom', 'ground, water, crowds'],
];

/** Past this a hero video is slower than the poster it replaces. */
const HEAVY_MB = 5;

const looksLikeUrl = (value) => /^https?:\/\/\S+\.\S+/.test((value || '').trim());

/**
 * The card asks for a size limit and a performance warning. A builder cannot
 * enforce a limit on a file it does not host, so this measures instead: a HEAD
 * request for Content-Length. CORS blocks that more often than not, and when it
 * does the panel says so rather than showing nothing and looking broken.
 */
const useVideoWeight = (url) => {
  const ready = looksLikeUrl(url);
  // Keyed by the URL it measured, so a stale answer never shows against a new
  // one — and so nothing has to be set synchronously inside the effect.
  const [result, setResult] = useState({ status: 'idle', of: null });

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;

    // Debounced: typing a URL should not produce a request per keystroke.
    const timer = setTimeout(() => {
      fetch(url, { method: 'HEAD' })
        .then((response) => {
          if (cancelled) return;
          const length = Number(response.headers.get('content-length'));
          if (!length) setResult({ status: 'unknown', of: url });
          else setResult({ status: 'known', mb: length / (1024 * 1024), of: url });
        })
        .catch(() => {
          if (!cancelled) setResult({ status: 'blocked', of: url });
        });
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, ready]);

  if (!ready) return { status: 'idle' };
  return result.of === url ? result : { status: 'checking' };
};

export const BackgroundVideoSettings = () => {
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props }));

  const weight = useVideoWeight(props.src);

  const set = (key, value) =>
    setProp((p) => {
      p[key] = value;
    });

  const input = {
    width: '100%',
    padding: '5px 8px',
    fontSize: 12,
    border: '1px solid var(--outline-light)',
    borderRadius: 6,
    marginBottom: 6,
    boxSizing: 'border-box',
  };

  const note = { fontSize: 11, lineHeight: 1.4, color: 'var(--muted)', marginBottom: 8 };
  const warn = { ...note, color: '#c96a3f' };

  const weightLine = () => {
    if (weight.status === 'checking') return <div style={note}>Checking the file size…</div>;
    if (weight.status === 'known') {
      const mb = weight.mb.toFixed(1);
      return weight.mb > HEAVY_MB ? (
        <div style={warn}>
          {mb} MB — heavier than {HEAVY_MB} MB. On a phone connection most visitors will see the
          poster and not much else. Consider a shorter loop or a smaller encode.
        </div>
      ) : (
        <div style={note}>{mb} MB — fine.</div>
      );
    }
    if (weight.status === 'blocked')
      return (
        <div style={note}>
          Could not read the size — the server did not allow the check. Aim for under {HEAVY_MB} MB.
        </div>
      );
    if (weight.status === 'unknown')
      return (
        <div style={note}>
          The server did not report a size. Aim for under {HEAVY_MB} MB.
        </div>
      );
    return null;
  };

  return (
    <React.Fragment>
      <ToolbarSection title="Video">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          <input
            style={input}
            value={props.src || ''}
            placeholder="Video URL (.mp4)"
            onChange={(e) => set('src', e.target.value)}
          />
          {weightLine()}

          <input
            style={input}
            value={props.poster || ''}
            placeholder="Poster image URL"
            onChange={(e) => set('poster', e.target.value)}
          />
          {props.src && !props.poster && (
            <div style={warn}>
              No poster. The poster is what shows on a phone, under reduced motion, and if the
              video fails — without one this section can end up blank.
            </div>
          )}

          <label style={{ ...note, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={props.loop !== false}
              onChange={(e) => set('loop', e.target.checked)}
            />
            Loop
          </label>

          {/*
            Not a switch: no browser autoplays a video with sound, and iOS plays
            a video without playsinline fullscreen. Offering these as options
            would be offering controls that cannot work.
          */}
          <div style={note}>
            Plays automatically, always muted and in place. Skipped on phones and for visitors who
            asked for less motion — they see the poster.
          </div>
        </div>
      </ToolbarSection>

      <ToolbarSection title="Look">
        <div style={{ width: '100%', padding: '0 8px 8px' }}>
          <label style={{ ...note, display: 'block', marginBottom: 2 }}>
            Darken: {props.overlay ?? 40}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            style={{ width: '100%', marginBottom: 8 }}
            value={props.overlay ?? 40}
            onChange={(e) => set('overlay', Number(e.target.value))}
          />

          <label style={{ ...note, display: 'block', marginBottom: 2 }}>
            Keep this part of the frame
          </label>
          <select
            style={input}
            value={props.position || 'center'}
            onChange={(e) => set('position', e.target.value)}
          >
            {POSITIONS.map(([value, label, hint]) => (
              <option key={value} value={value}>
                {label} — {hint}
              </option>
            ))}
          </select>

          <input
            style={{ ...input, marginBottom: 0 }}
            value={props.minHeight || ''}
            placeholder="Least height, e.g. 420px"
            onChange={(e) => set('minHeight', e.target.value)}
          />
        </div>
      </ToolbarSection>
    </React.Fragment>
  );
};
