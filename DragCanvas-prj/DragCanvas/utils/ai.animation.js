/**
 * Entrances for a generated page, decided rather than hoped for.
 *
 * The prompt has asked for staggered rows since the animation props existed,
 * and nothing ever checked whether the model obeyed. When it does not - and the
 * ANIMATION block sits at the end of a long prompt, so it often does not - the
 * page still moves, because `DEFAULT_ANIMATION` gives every Container a fadeUp.
 * That is the whole of it: each section fades, identically, 600ms, delay zero,
 * and nothing inside a section moves at all. Measured against the gallery, where
 * 373 of 1358 nodes carry an entrance and 99 of them are staggered, a generated
 * page reads as having no animation whatsoever. It is not wrong; it is uniform.
 *
 * So this fills in what the model left unsaid, the same way the contrast repair
 * and the video hero promotion do. It is deliberately timid:
 *
 *   - a node that declares `animation` is never touched, "none" included. The
 *     model's judgement outranks ours whenever it has expressed one.
 *   - the sections themselves are left alone. They already fade up, pages made
 *     before this existed keep the entrance they had, and the one thing worse
 *     than a page that under-animates is one whose look changed unasked.
 *   - a navbar, a spacer and a divider are never animated, because the prompt
 *     says so and because a sticky bar that transforms detaches from the window.
 *   - two entrances at most: fadeUp, and zoomIn for pictures. "A page where
 *     every block arrives differently reads as a demo of the animation menu."
 */

/**
 * Anything, read as a list of children.
 *
 * `countAuthoredAnimation` is asked about the model's answer before that answer
 * has been normalised, which is the whole point of it - normalisation is what
 * fills the gaps in, so counting afterwards counts our own work. But nothing
 * has straightened the shape out yet either, and a model that writes `children`
 * as an object rather than an array is a model whose page is still perfectly
 * repairable. Reading it as "no children" and moving on is right; throwing
 * failed the attempt, and failing all three answered the visitor with a 502
 * that the error middleware then redacted into "Something went wrong".
 */
const asArray = (value) => (Array.isArray(value) ? value : []);

/** Never given an entrance of its own, whatever it contains. */
const NEVER_ANIMATED = new Set(['NavbarElement', 'Spacer', 'Divider']);

/** Pictures arrive by growing into place; everything else rises. */
const ZOOM_TYPES = new Set(['Image', 'Carousel']);

/** The gap between one arrival and the next, and how far the rhythm runs. */
const STEP_MS = 90;
const MAX_STEPS = 4;

/**
 * The hero's footage is scenery, not an element that arrives.
 *
 * It is also a canvas holding the hero's words, so it is looked through rather
 * than skipped: fading the clip itself in would announce the page instead of
 * opening it, and would leave the heading on top of it perfectly still.
 */
const isBackgroundVideo = (node) => node.type === 'Video' && node.props?.sourceType === 'background';

/** Something that exists to hold other things, rather than to be looked at. */
const isWrapper = (node) => node.type === 'Container' || node.type === 'Columns' || isBackgroundVideo(node);

const eligibleChildren = (node) =>
    asArray(node?.children).filter((child) => child && !NEVER_ANIMATED.has(child.type));

/**
 * What should actually arrive, in the order a reader meets it.
 *
 * Two questions that look like one. Coming down from a section, a wrapper
 * holding a single thing is looked straight through - a column that exists only
 * to centre a heading is not a step in the rhythm. But once a group has been
 * found, each member arrives whole: a card holding one line of text is a card,
 * not a line of text, and animating what is inside it instead would leave the
 * card's own padding and background sitting there while its contents moved.
 *
 * A wrapper holding several things is flattened into the same sequence rather
 * than arriving as a slab, which is what turns "a heading, a sentence and three
 * cards" into five arrivals in reading order instead of three.
 */
function targetsOf(node) {
    const children = eligibleChildren(node);
    if (children.length === 0) return [];
    if (children.length === 1) return isWrapper(children[0]) ? targetsOf(children[0]) : [children[0]];
    return children.flatMap(expand);
}

/** One member of a group: flattened if it is a group itself, whole if not. */
function expand(child) {
    if (isBackgroundVideo(child)) return targetsOf(child);
    if (isWrapper(child) && eligibleChildren(child).length >= 2) return targetsOf(child);
    return [child];
}

/** The entrance a target gets when it has not asked for one. */
const entranceFor = (node) => (ZOOM_TYPES.has(node.type) ? 'zoomIn' : 'fadeUp');

/**
 * Give one section's contents a rhythm.
 *
 * The counter advances for every target, including the ones already spoken for,
 * so a row where the model animated the middle card keeps its shape instead of
 * closing the gap the card left.
 */
function staggerSection(section) {
    const targets = targetsOf(section);
    // One element arriving on its own is not a stagger, and the section it sits
    // in is already fading up around it.
    if (targets.length < 2) return;

    targets.forEach((node, index) => {
        if (node.props?.animation !== undefined) return;
        node.props = {
            ...node.props,
            animation: entranceFor(node),
            animationDelay: Math.min(index, MAX_STEPS) * STEP_MS,
        };
    });
}

const pagesOf = (layout) =>
    (Array.isArray(layout?.pages) ? layout.pages : [{ sections: layout?.sections }]);

/** How many nodes the model itself gave an entrance. Zero is the case above. */
export function countAuthoredAnimation(layout) {
    let count = 0;
    const walk = (node) => {
        if (node?.props?.animation !== undefined) count += 1;
        asArray(node?.children).forEach(walk);
    };
    for (const page of pagesOf(layout)) asArray(page?.sections).forEach(walk);
    return count;
}

/** Stagger what arrives inside every section, on every page. */
export function staggerAnimations(layout) {
    for (const page of pagesOf(layout)) asArray(page?.sections).forEach(staggerSection);
    return layout;
}
