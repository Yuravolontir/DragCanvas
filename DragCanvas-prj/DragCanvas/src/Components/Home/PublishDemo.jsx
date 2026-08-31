import { useState } from 'react';

import { useReveal } from './useReveal.js';
import './PublishDemo.css';

const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:8000';

/**
 * The last step, and the one people do not believe until they see it.
 *
 * "Publish" on a website builder can mean anything from a preview link to a
 * real deployment. Here it means a Netlify site with its own address, so the
 * section hands the visitor a QR code and lets them check on their own phone
 * rather than asking them to take it on trust.
 *
 * The QR comes from the Python reports service (`GET /api/qr`), the same
 * endpoint the publish modal uses after a real deploy - so this is the actual
 * mechanism, not an illustration of it.
 */

/**
 * The site the code points at.
 *
 * Should be a genuinely published DragCanvas site: the whole point is that a
 * stranger can scan it and land on something real. Falls back to this app's own
 * address so the section is never broken, but that fallback proves nothing and
 * wants replacing before anyone demonstrates this.
 */
const EXAMPLE_SITE_URL =
  import.meta.env.VITE_EXAMPLE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const STEPS = [
  { title: 'Describe it', body: 'One sentence is enough to get a full layout.' },
  { title: 'Make it yours', body: 'Move blocks, change the words, swap the pictures.' },
  { title: 'Publish', body: 'One click deploys it and hands you the address.' },
];

export default function PublishDemo() {
  const [qrFailed, setQrFailed] = useState(false);
  const copyRef = useReveal();
  const qrRef = useReveal(120);

  return (
    <section className="publish-demo">
      <div className="publish-demo__copy reveal" ref={copyRef}>
        <span className="publish-demo__eyebrow eyebrow">03 / Go live</span>
        <h2 className="publish-demo__title">From canvas to a real address.</h2>
        <p className="publish-demo__subtitle">
          No export ritual and no hosting setup. Publish a responsive site,
          share the link and keep editing whenever you want.
        </p>

        <ol className="publish-demo__steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="publish-demo__step">
              <span className="publish-demo__number">{index + 1}</span>
              <span>
                <strong className="publish-demo__step-title">{step.title}</strong>
                <span className="publish-demo__step-body">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <figure className="publish-demo__qr paper reveal" ref={qrRef}>
        <div className="publish-demo__qr-head">
          <span><i /> Live</span>
          <span className="material-symbols-outlined" aria-hidden="true">north_east</span>
        </div>
        {qrFailed ? (
          // The reports service sleeps between visits, so a cold start can lose
          // this image. The address is the point; the code is only a shortcut
          // to it, and losing the shortcut must not lose the point.
          <a className="publish-demo__fallback" href={EXAMPLE_SITE_URL} target="_blank" rel="noreferrer">
            {EXAMPLE_SITE_URL.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <img
            className="publish-demo__qr-image"
            src={`${PY_API}/api/qr?url=${encodeURIComponent(EXAMPLE_SITE_URL)}`}
            alt={`QR code opening ${EXAMPLE_SITE_URL}`}
            width="200"
            height="200"
            loading="lazy"
            onError={() => setQrFailed(true)}
          />
        )}
        <figcaption className="publish-demo__caption">
          Scan to open the live site
        </figcaption>
      </figure>
    </section>
  );
}
