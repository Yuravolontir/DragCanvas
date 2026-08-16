import NavBar from './NavBar';
import Aurora from './Components/Home/Aurora.jsx';
import Hero from './Components/Home/Hero.jsx';
import EditorDemo from './Components/Home/EditorDemo.jsx';
import PublishDemo from './Components/Home/PublishDemo.jsx';
import TemplatesStrip from './Components/Home/TemplatesStrip.jsx';
import Closing from './Components/Home/Closing.jsx';
import './Components/Home/theme.css';

/**
 * The public landing page.
 *
 * It used to be a headline over a scroll-driven sequence of 160 JPGs - 6.5 MB,
 * all eager, the animation blocked until the last one arrived - followed by
 * three cards describing features in adjectives. Nothing on it could be touched
 * and nothing on it was real.
 *
 * Every section below now shows the working product instead of describing it:
 * a page assembling itself from a prompt, the actual Craft.js editor taking a
 * real drag, a QR to a deployed site, and the template gallery straight out of
 * the database.
 */
export default function LandingPage() {
  return (
    // `home` carries the dark token set. It is scoped here rather than on :root
    // so the editor and admin panel keep the palette they were designed in.
    <div className="home">
      <Aurora />
      <NavBar />
      <Hero />
      <EditorDemo />
      <PublishDemo />
      <TemplatesStrip />
      <Closing />
    </div>
  );
}
