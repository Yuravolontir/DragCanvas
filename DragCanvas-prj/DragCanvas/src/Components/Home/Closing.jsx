import { Link } from 'react-router-dom';

import { useReveal } from './useReveal.js';
import './Closing.css';

/**
 * The last thing on the page.
 *
 * Deliberately short. Everything above has already shown the product working -
 * a page assembling itself, an editor that takes a real drag, a QR to a live
 * site, the actual template gallery - so there is nothing left to argue and no
 * reason to repeat it in a list of adjectives.
 *
 * The claim about thousands of creators that used to sit here is gone. It was
 * not true, and a landing page that opens by showing you the real thing should
 * not close by making something up.
 */
export default function Closing() {
  const ref = useReveal();

  return (
    <>
      <section className="closing reveal" ref={ref}>
        <h2 className="closing__title">Describe your first site</h2>
        <p className="closing__subtitle">
          It takes a sentence to start. You can change everything afterwards.
        </p>
        <Link className="closing__cta" to="/register">
          Get started — free
        </Link>
      </section>

      <footer className="site-footer">
        <p className="site-footer__brand">DragCanvas</p>
        <p className="site-footer__copy">&copy; 2026 All rights reserved.</p>
      </footer>
    </>
  );
}
