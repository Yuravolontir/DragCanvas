import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useUserContext } from '../../userContext.js';

import Examples from './Examples.jsx';
import SiteFrame from './SiteFrame.jsx';
import { SITES } from './sites.js';
import { storePendingPrompt } from './promptHandoff.js';
import { useHeroTimeline } from './useHeroTimeline.js';
import { useTypedPlaceholder } from './useTypedPlaceholder.js';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';
import './Hero.css';

/**
 * The first screen.
 *
 * It leads with the thing this product actually does that others do not: you
 * describe a site in a sentence and it gets built and published. The previous
 * hero sold "drag and drop, no coding required", which has been unremarkable
 * for fifteen years and said nothing about the AI generator sitting behind
 * /api/ai/generate.
 *
 * The prompt box is the primary call to action. Submitting it keeps the
 * sentence and sends the visitor to registration, because generating really
 * does need an account - the endpoint is authenticated, each call costs money,
 * and publishing spends our own Netlify token.
 */

// The placeholder cycles the same sentences the chips offer and the scene
// builds, so the three never drift apart.
const EXAMPLES = SITES.map(site => site.prompt);

export default function Hero() {
  const navigate = useNavigate();
  const { currentUser } = useUserContext();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [prompt, setPrompt] = useState('');
  const [touched, setTouched] = useState(false);

  // The beat and the layout live here rather than inside the scene: the example
  // chips need to reach them, and they sit outside the lazily-loaded 3D chunk.
  // Nothing here imports three.js, so keeping it in the main bundle is free.
  const stageRef = useRef(null);
  const [onScreen, setOnScreen] = useState(true);

  const { phase, index, run, goToLayout } = useHeroTimeline(SITES.length, {
    enabled: onScreen && !prefersReducedMotion,
  });

  // Once the hero has scrolled away there is nothing to animate for. The scene
  // stops its render loop entirely rather than drawing to a battery nobody is
  // watching.
  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The examples stop the moment the field is someone's to fill in
  const typed = useTypedPlaceholder(EXAMPLES, {
    enabled: !prefersReducedMotion && !touched && prompt === '',
  });

  const handlePick = (nextIndex, examplePrompt) => {
    goToLayout(nextIndex);
    // The chip is the sentence that produced what is on screen, so putting it in
    // the box leaves the visitor one click from building their own version.
    setPrompt(examplePrompt);
    setTouched(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text) return;

    storePendingPrompt(text);
    // Somebody already signed in has no reason to be shown a sign-up form. The
    // prompt still travels through storage rather than through the URL, so the
    // editor picks it up the same way on both paths and there is only one place
    // that knows how the hand-off works.
    navigate(currentUser ? '/create-new-project' : '/register');
  };

  return (
    <section className="home-hero">
      <div className="home-hero__copy">
        <div className="home-hero__eyebrow">
          <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
          AI-native website builder
        </div>
        <h1 className="home-hero__title">
          From one sentence
          <br />
          to a <span className="home-hero__accent">live website</span>
        </h1>

        <p className="home-hero__subtitle lede">
          Describe what you want. The layout gets generated, you refine it by
          talking to it, and one click puts it online with its own address.
        </p>

        <form className="home-hero__form" onSubmit={handleSubmit}>
          <label className="home-hero__label eyebrow" htmlFor="home-hero-prompt">
            Describe your website
          </label>

          <div className="home-hero__field">
            <input
              id="home-hero-prompt"
              className="home-hero__input"
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onFocus={() => setTouched(true)}
              // The animated examples are decoration. The real placeholder stays
              // put for anyone who is not watching it type.
              placeholder={typed || 'a bakery in tel aviv, warm tones'}
              maxLength={500}
              autoComplete="off"
            />
            <button
              className="home-hero__submit"
              type="submit"
              disabled={prompt.trim() === ''}
            >
              Build it
            </button>
          </div>

          <p className="home-hero__hint">
            {currentUser
              ? 'Opens in the editor with your prompt ready to run.'
              : 'Free to start. You will be asked to create an account before it builds.'}
          </p>
        </form>

        <Examples
          layouts={SITES}
          activeIndex={index}
          onPick={handlePick}
        />

        <div className="home-hero__links">
          <Link className="home-hero__secondary" to="/inspire-me">
            Browse templates instead
          </Link>
        </div>

        <ul className="home-hero__proof" aria-label="Product highlights">
          <li><strong>AI layouts</strong><span>Built from your brief</span></li>
          <li><strong>Visual editing</strong><span>No code required</span></li>
          <li><strong>One-click launch</strong><span>Live link and QR</span></li>
        </ul>
      </div>

      <div className="home-hero__stage" ref={stageRef}>
        <SiteFrame
          site={SITES[index]}
          run={run}
          live={onScreen && (phase === 'publish' || phase === 'hold')}
        />
      </div>
    </section>
  );
}
