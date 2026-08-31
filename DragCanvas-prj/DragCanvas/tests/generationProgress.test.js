/**
 * The percentage over the generation modal.
 *
 * "How much longer" is the question, so the bar always answers with a number.
 * The image phase counts itself exactly; the layout call reports nothing until
 * it answers, so its share is estimated from elapsed time - and the estimate
 * must never reach the end of its phase, or the bar parks at a number and the
 * next honest one is not believed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { stageProgress } from '../src/utils/generationProgress.js';

test('the bar starts at zero and always moves while the layout is written', () => {
    assert.equal(stageProgress({ name: 'layout' }, 0).percent, 0);

    let last = -1;
    for (const ms of [500, 2000, 6000, 12000, 20000, 35000]) {
        const { percent } = stageProgress({ name: 'layout' }, ms);
        assert.ok(percent > last, `stalled at ${ms}ms`);
        last = percent;
    }
});

test('the estimate never claims the layout phase is finished', () => {
    // Even after five minutes it stays under its own share, so the jump to the
    // image phase is always forwards.
    for (const ms of [60000, 180000, 300000]) {
        assert.ok(stageProgress({ name: 'layout' }, ms).percent < 45, `overshot at ${ms}ms`);
    }
});

test('drawing images is measured, not estimated', () => {
    const start = stageProgress({ name: 'images', remaining: 4, total: 4 }, 99999);
    assert.equal(start.percent, 45, 'the layout share is banked whole once images begin');
    assert.equal(start.step, '0 of 4 images');

    assert.equal(stageProgress({ name: 'images', remaining: 2, total: 4 }, 0).percent, 70);
    assert.equal(stageProgress({ name: 'images', remaining: 0, total: 4 }, 0).percent, 95);
    assert.equal(stageProgress({ name: 'images', remaining: 1, total: 4 }, 0).step, '3 of 4 images');
});

test('a run with no images to draw does not divide by zero', () => {
    assert.equal(stageProgress({ name: 'images', remaining: 0, total: 0 }, 0).percent, 45);
});

test('progress never runs backwards across the whole run', () => {
    const run = [
        stageProgress({ name: 'layout' }, 1000),
        stageProgress({ name: 'layout' }, 15000),
        stageProgress({ name: 'images', remaining: 3, total: 3 }, 0),
        stageProgress({ name: 'images', remaining: 1, total: 3 }, 0),
        stageProgress({ name: 'images', remaining: 0, total: 3 }, 0),
        stageProgress({ name: 'placing' }, 0),
    ];
    for (let i = 1; i < run.length; i += 1) {
        assert.ok(run[i].percent >= run[i - 1].percent, `went backwards at step ${i}`);
    }
    assert.equal(run.at(-1).percent, 100);
});
