/**
 * One reading of a carousel's slides, for the editor and the exporter both.
 *
 * The carousel used to carry twelve flat props — src1..src3, heading1..3,
 * label1..3, p1..3 — so it could hold exactly three slides and no other number.
 * Slides are an array now. Six built templates, every saved project and every
 * live published site still carry the old shape, so the old shape still has to
 * render.
 *
 * Reading never writes: a legacy node keeps its src1..p3 and gains no `slides`
 * prop by being displayed. The settings panel writes a real array on the first
 * edit, and from then on the node is not legacy any more.
 */

/** How many slides the legacy shape could ever hold. */
const LEGACY_SLOTS = [1, 2, 3];

/**
 * @param {object} props a Carousel node's props
 * @returns {Array<{src:string, heading:string, label:string, text:string, alt:string}>}
 */
export const readSlides = (props = {}) => {
  const { slides } = props;

  if (Array.isArray(slides) && slides.length > 0) {
    return slides.filter(Boolean).map(normalise);
  }

  // Legacy: a slot counts only when it has an image. A carousel saved with two
  // slides left src3 empty, and an empty third slide is not a slide.
  return LEGACY_SLOTS.filter((i) => props[`src${i}`]).map((i) =>
    normalise({
      src: props[`src${i}`],
      heading: props[`heading${i}`],
      label: props[`label${i}`],
      text: props[`p${i}`],
    })
  );
};

/** Missing fields become empty strings so nothing downstream prints "undefined". */
const normalise = (slide) => ({
  src: slide.src || '',
  heading: slide.heading || '',
  label: slide.label || '',
  text: slide.text || '',
  // Where the slide sends a visitor who clicks it. Optional, and refused
  // outright unless it is an ordinary web address - see safeHref.
  href: slide.href || '',
  // A background image had no alt at all. Falling back to the heading is a
  // better description than nothing, and beats repeating the filename.
  alt: slide.alt || slide.heading || '',
});

/** A blank slide for the settings panel's "add" button. */
export const emptySlide = () => ({ src: '', heading: '', label: '', text: '', href: '', alt: '' });

/**
 * Does this carousel move on its own?
 *
 * Saved data has held the string "false" here, which is truthy, so a carousel
 * that had been switched off played anyway and the switch appeared to do
 * nothing. Only a real yes counts.
 */
export const slidesAutoplay = (props = {}) => {
  const value = props.autoplay;
  if (typeof value === 'string') return ['true', 'yes', '1', 'on'].includes(value.trim().toLowerCase());
  return !!value;
};

/** How long between slides, in milliseconds, never fast enough to be unreadable. */
export const slideInterval = (props = {}) => {
  const value = Number(props.interval);
  return Number.isFinite(value) && value >= 1000 ? Math.min(value, 60000) : 5000;
};

/** How many slides are shown side by side, and what that means on a phone. */
export const slidesPerView = (props = {}) => {
  const desktop = Math.min(8, Math.max(1, Math.round(Number(props.perView)) || 1));
  const tablet = Math.min(desktop, Math.max(1, Math.round(Number(props.perViewTablet)) || Math.min(desktop, 2)));
  const mobile = Math.min(tablet, Math.max(1, Math.round(Number(props.perViewMobile)) || 1));
  return { desktop, tablet, mobile };
};
