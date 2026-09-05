/**
 * How far along the generation is, as a number a person can act on.
 *
 * The phases are weighted by how long they actually take, measured rather than
 * guessed: writing the layout is one provider call averaging around thirty-five
 * seconds, drawing the images is several calls that finish one by one, placing
 * the page is instant.
 *
 * Only the image phase can measure itself - the client holds the list of prompts
 * and counts them down - so that part of the bar is a real fraction. The layout
 * call reports nothing until it answers, so its share is estimated from elapsed
 * time on a curve that approaches the end of the phase without ever reaching it.
 * That keeps two promises at once: the number always moves, so the page never
 * looks hung, and it never claims a phase finished before it did.
 */

/** Share of the whole each phase is worth. */
const LAYOUT_SHARE = 0.45;
const IMAGE_SHARE = 0.5;

/** How long the layout call usually takes. From the generator's own baseline. */
const TYPICAL_LAYOUT_MS = 18000;

/**
 * The estimate for a phase that cannot report progress.
 *
 * Exponential rather than linear: fast while it is plausibly still early, then
 * slower and slower, so a call that runs long crawls toward its share instead
 * of hitting it and sitting there. A bar parked at 100% for fifteen seconds is
 * what teaches people to stop believing the number.
 *
 * Rounded down, not to nearest, so the estimate cannot land on the share it is
 * approaching: after five minutes the curve is within a millionth of 45%, and
 * rounding would print 45 - the number that means "the layout is done".
 */
const estimate = (elapsedMs, share) =>
    Math.floor(share * (1 - Math.exp(-Math.max(0, elapsedMs) / TYPICAL_LAYOUT_MS)) * 100);

/**
 * @param {object|null} stage      the current stage, as AIAssistant sets it
 * @param {number} elapsedMs       milliseconds since the run started
 * @returns {{percent: number, step?: string}} percent is 0-100, already rounded
 */
export function stageProgress(stage, elapsedMs = 0) {
    if (!stage) return { percent: estimate(elapsedMs, LAYOUT_SHARE) };

    if (stage.name === 'layout' || stage.name === 'refining') {
        return { percent: estimate(elapsedMs, LAYOUT_SHARE) };
    }

    if (stage.name === 'images') {
        const total = Number(stage.total) || 0;
        // The layout is finished by the time any image is drawn, so its share is
        // banked whole rather than left at whatever the estimate had reached.
        if (total <= 0) return { percent: Math.round(LAYOUT_SHARE * 100) };
        const done = Math.max(0, total - Math.max(0, Number(stage.remaining) || 0));
        return {
            percent: Math.round((LAYOUT_SHARE + IMAGE_SHARE * (done / total)) * 100),
            step: `${done} of ${total} images`,
        };
    }

    if (stage.name === 'placing') return { percent: 100 };

    return { percent: estimate(elapsedMs, LAYOUT_SHARE) };
}

/**
 * What to call the current stage on screen.
 *
 * Named for what is happening rather than for how long it will take, because
 * nobody can promise the second one and a wrong promise is worse than none.
 */
export function stageLabel(stage) {
    if (stage?.name === 'layout') return 'Writing the layout…';
    if (stage?.name === 'refining') return 'Rewriting the page…';
    if (stage?.name === 'placing') return 'Placing the page…';

    if (stage?.name === 'images') {
        if (stage.remaining === 0) return 'Finishing…';
        const plural = stage.remaining === 1 ? '' : 's';
        return `Drawing ${stage.remaining} image${plural}…`;
    }

    return 'Working…';
}
