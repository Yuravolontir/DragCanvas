/**
 * How far along we are, and whether that number means anything.
 *
 * Only one phase can answer honestly. Drawing the images knows how many there
 * are and counts them down, so it reports a real fraction. Writing the layout is
 * a single call that says nothing until it returns, so it reports nothing and
 * the bar sweeps instead - a percentage invented for a phase that cannot
 * measure itself teaches people to ignore the one that can.
 *
 * The phases are weighted by how long they actually take: the layout call is by
 * far the longest, the images come next, placing is instant.
 */
const LAYOUT_SHARE = 0.45;
const IMAGE_SHARE = 0.5;

export function stageProgress(stage) {
    if (!stage) return { mode: 'sweep' };
    if (stage.name === 'layout' || stage.name === 'refining') return { mode: 'sweep' };
    if (stage.name === 'images') {
        const total = Number(stage.total) || 0;
        if (total <= 0) return { mode: 'sweep' };
        const done = Math.max(0, total - Math.max(0, Number(stage.remaining) || 0));
        return {
            mode: 'value',
            value: LAYOUT_SHARE + IMAGE_SHARE * (done / total),
            step: `${done} of ${total}`,
        };
    }
    if (stage.name === 'placing') return { mode: 'value', value: 1 };
    return { mode: 'sweep' };
}
