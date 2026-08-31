import { Link } from 'react-router-dom';

import { useUserContext } from '../../userContext.js';
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
  const { currentUser } = useUserContext();

  /*
   * Where the last button goes depends on who is reading.
   *
   * This one was hardcoded to the sign-up form, so somebody already signed in
   * who read to the bottom and pressed the one call to action was asked to
   * create the account they were already using. The hero learned this and this
   * did not: the fix lived in one handler rather than in something both could
   * reach.
   */
  const destination = currentUser ? '/create-new-project' : '/register';

  return (
    <>
      <section className="closing reveal" ref={ref}>
        <h2 className="closing__title">Describe your first site</h2>
        <p className="closing__subtitle">
          It takes a sentence to start. You can change everything afterwards.
        </p>
        <Link className="closing__cta" to={destination}>
          {currentUser ? 'Start a new site' : 'Start building free'} <span aria-hidden="true">&#8594;</span>
        </Link>
        <div className="closing__notes" aria-label="Getting started details">
          {currentUser
            ? (<><span>Starts from a blank canvas</span><i /><span>Editable from the first draft</span><i /><span>Publish when ready</span></>)
            : (<><span>No credit card</span><i /><span>Editable from the first draft</span><i /><span>Publish when ready</span></>)}
        </div>
      </section>

      <footer className="site-footer">
        <p className="site-footer__brand"><span className="material-symbols-outlined" aria-hidden="true">grid_view</span> DragCanvas</p>
        <p className="site-footer__copy">&copy; 2026 All rights reserved.</p>
      </footer>
    </>
  );
}
