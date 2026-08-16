/**
 * A visual brief drawn at random for each generation.
 *
 * Section composition is handled elsewhere (site.kinds.js). This is about how a
 * page *looks*: two requests with the same wording should not come back in the
 * same colours with the same spacing. Left to itself the model gravitates to the
 * same handful of palettes, so we hand it one.
 *
 * Palettes are curated rather than random rgb: generated colours clash, and a
 * page that reads badly is worse than a page that looks familiar.
 */

const PALETTES = [
    { name: 'midnight',   dark: '18,18,28',   light: '245,245,250', accent: '99,102,241',  note: 'deep indigo night, cool and technical' },
    { name: 'espresso',   dark: '32,24,20',   light: '247,242,235', accent: '193,124,72',  note: 'warm browns and cream, cosy' },
    { name: 'forest',     dark: '20,34,28',   light: '240,246,242', accent: '52,142,102',  note: 'deep green and off-white, calm and natural' },
    { name: 'ink',        dark: '15,15,15',   light: '250,250,250', accent: '230,60,60',   note: 'near-black and white with one red accent, editorial' },
    { name: 'ocean',      dark: '12,32,48',   light: '238,246,250', accent: '38,150,190',  note: 'navy and pale blue, clean and trustworthy' },
    { name: 'sand',       dark: '48,40,32',   light: '250,246,238', accent: '214,158,86',  note: 'warm sand and clay, soft' },
    { name: 'plum',       dark: '30,18,36',   light: '248,244,250', accent: '158,86,190',  note: 'aubergine and lilac, creative' },
    { name: 'slate',      dark: '28,32,38',   light: '243,245,248', accent: '110,130,150', note: 'muted greys, understated and serious' },
    { name: 'sunrise',    dark: '38,22,26',   light: '253,246,240', accent: '236,110,76',  note: 'terracotta and peach, energetic' },
    { name: 'mono-green', dark: '16,26,20',   light: '242,248,243', accent: '132,190,88',  note: 'dark moss with a bright lime accent, fresh' },
];

const TYPE_SCALES = [
    { name: 'dramatic', heading: 52, sub: 22, body: 16, note: 'huge headlines against small body text' },
    { name: 'balanced', heading: 40, sub: 20, body: 16, note: 'classic hierarchy, nothing shouts' },
    { name: 'compact',  heading: 32, sub: 18, body: 15, note: 'restrained sizes, information-dense' },
    { name: 'editorial', heading: 46, sub: 19, body: 17, note: 'magazine feel, generous body text' },
];

const DENSITIES = [
    { name: 'airy',    section: 80, inner: 32, note: 'a lot of breathing room, few things per screen' },
    { name: 'regular', section: 48, inner: 24, note: 'comfortable, conventional spacing' },
    { name: 'tight',   section: 32, inner: 16, note: 'compact, more content visible at once' },
];

/**
 * How the page is put together, as opposed to how it is coloured.
 *
 * Palette, type and spacing already vary per generation, and two pages still came
 * back looking like the same page: colour changes, shape does not. The opening is
 * the strongest part of that - a visitor decides what kind of site this is from
 * the first screen - so the hero form is drawn separately, and the rhythm below it
 * with it.
 */
const COMPOSITIONS = [
    {
        name: 'full-bleed opening',
        hero: 'a full-width image or video filling the first screen, headline laid over it, one button',
        rhythm: 'wide bands of alternating dark and light, one idea per band',
    },
    {
        name: 'split opening',
        hero: 'a two-column first screen: words on one side, a single strong image on the other',
        rhythm: 'alternating split rows, the image swapping sides each time',
    },
    {
        name: 'typographic opening',
        hero: 'no image at all at the top - a very large headline, a short line under it, and space',
        rhythm: 'content led by headings, images arriving later and used sparingly',
    },
    {
        name: 'editorial opening',
        hero: 'a narrow column of text over a muted background, like the first page of an article',
        rhythm: 'a centred column throughout, wide images breaking out of it occasionally',
    },
    {
        name: 'showcase opening',
        hero: 'a grid of three or four images immediately, with the headline sitting above them',
        rhythm: 'grids of cards, varying between two and three across',
    },
];

const pick = list => list[Math.floor(Math.random() * list.length)];

/** One palette + one type scale + one density, as prompt text. */
export function buildVisualBrief() {
    const palette = pick(PALETTES);
    const type = pick(TYPE_SCALES);
    const density = pick(DENSITIES);
    const composition = pick(COMPOSITIONS);

    return {
        chosen: { palette: palette.name, type: type.name, density: density.name, composition: composition.name },
        text: `VISUAL BRIEF FOR THIS PAGE

Palette "${palette.name}" — ${palette.note}
  dark surfaces:  rgb(${palette.dark})
  light surfaces: rgb(${palette.light})
  accent:         rgb(${palette.accent})
Use the accent for buttons, links and small highlights only. Alternate dark and
light sections; never put dark text on a dark background.

Type scale "${type.name}" — ${type.note}
  headings ${type.heading}px · subheadings ${type.sub}px · body ${type.body}px

Spacing "${density.name}" — ${density.note}
  section padding ~${density.section}px · padding inside cards ~${density.inner}px

Composition "${composition.name}"
  opening: ${composition.hero}
  below:   ${composition.rhythm}
This one decides the shape of the page. Two sites in different colours with the
same shape still look like the same site, so do not default to a centred headline
over a background image unless that is what is asked for above.

Follow this brief. It is what makes this page look different from the last one.`,
    };
}

export { PALETTES, TYPE_SCALES, DENSITIES, COMPOSITIONS };
