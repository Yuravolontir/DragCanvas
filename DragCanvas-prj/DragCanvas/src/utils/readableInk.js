/**
 * The label colour that can actually be read on a given fill.
 *
 * Seven elements printed white on whatever the author picked as their accent,
 * with no way to change it: the pricing table's featured button, the timeline's
 * numbered rail, and every submit button in the set. That is fine for a navy or
 * an indigo and unreadable for anything lighter — white on the gold in one
 * template measured 1.62:1, where 4.5:1 is the floor for a label. A gallery of
 * templates with tasteful accents was quietly a gallery of buttons nobody could
 * read, and the only fix available to an author was to stop using their own
 * colour.
 *
 * So the label follows the fill instead of the fill following the label. Same
 * function on the canvas and in the published page, because a button that
 * changes colour on publication is its own bug.
 */

const channel = (value) => {
  const v = Math.max(0, Math.min(255, Number(value) || 0)) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance, 0 for black and 1 for white. */
export function luminance(colour) {
  if (!colour || typeof colour !== 'object') return 0;
  return 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);
}

/** The contrast ratio between two opaque colours, 1:1 to 21:1. */
export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Near-black rather than black, and white.
 *
 * Pure black on a mid-tone is harsher than anything a designer would choose,
 * and the softened one is enough almost everywhere.
 */
export const INK_ON_LIGHT = { r: 24, g: 24, b: 27, a: 1 };
export const INK_ON_DARK = { r: 255, g: 255, b: 255, a: 1 };

/** The one that is only reached for when nothing else is readable. */
const TRUE_BLACK = { r: 0, g: 0, b: 0, a: 1 };

/** The floor for a label, from WCAG AA. */
const AA = 4.5;

/**
 * Which colour reads on `fill`, as an rgba object.
 *
 * Compared by measurement rather than by a luminance threshold, so a fill that
 * sits near the crossover gets whichever one actually wins rather than
 * whichever side of 0.5 it happens to fall.
 *
 * The softened black gives way to a real one on the fills where it has to: a
 * mid-tone — a hot pink, a mid grey — is the one place where neither a gentle
 * black nor white clears the floor, and between a harsher edge and a label
 * nobody can read, the edge wins. Every colour has at least one answer that
 * passes once real black is on the table, so this never returns something
 * unreadable.
 */
export function readableInk(fill) {
  if (!fill || typeof fill !== 'object') return INK_ON_DARK;

  const white = contrastRatio(INK_ON_DARK, fill);
  const softened = contrastRatio(INK_ON_LIGHT, fill);
  const black = contrastRatio(TRUE_BLACK, fill);

  // The softened black whenever it is both the better side and good enough.
  if (softened >= AA && softened >= white) return INK_ON_LIGHT;
  // Otherwise whichever extreme actually reads. One of them always does: the
  // luminance where black falls under the floor is below the luminance where
  // white climbs above it, so the two ranges overlap rather than leaving a gap.
  return black >= white ? TRUE_BLACK : INK_ON_DARK;
}

/** The same answer as a CSS colour, for the places that build a stylesheet. */
export function readableInkCss(fill) {
  const ink = readableInk(fill);
  return `rgb(${ink.r}, ${ink.g}, ${ink.b})`;
}
