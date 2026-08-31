/**
 * The bar over the generation modal.
 *
 * Only one phase can measure itself, and the bar says so rather than inventing
 * a number for the others: a bar that creeps to 90% and waits is a lie people
 * learn to distrust, and then the honest phase is not believed either.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { stageProgress } from '../src/utils/generationProgress.js';

test('a phase that cannot measure itself sweeps instead of guessing', () => {
    for (const stage of [null, { name: 'layout' }, { name: 'refining' }, { name: 'unknown' }]) {
        assert.equal(stageProgress(stage).mode, 'sweep', JSON.stringify(stage));
        assert.equal(stageProgress(stage).value, undefined);
    }
});

test('drawing images reports a real fraction and a step count', () => {
    const none = stageProgress({ name: 'images', remaining: 4, total: 4 });
    assert.equal(none.mode, 'value');
    assert.equal(none.step, '0 of 4');

    const half = stageProgress({ name: 'images', remaining: 2, total: 4 });
    assert.ok(half.value > none.value, 'the bar must move as images land');
    assert.equal(half.step, '2 of 4');

    const all = stageProgress({ name: 'images', remaining: 0, total: 4 });
    assert.equal(all.step, '4 of 4');
    assert.ok(all.value > half.value);
    assert.ok(all.value < 1, 'placing the page still has to happen');
});

test('an image phase with nothing to draw does not divide by zero', () => {
    assert.equal(stageProgress({ name: 'images', remaining: 0, total: 0 }).mode, 'sweep');
});

test('progress never runs backwards or past the end', () => {
    let last = 0;
    for (const remaining of [6, 5, 4, 3, 2, 1, 0]) {
        const { value } = stageProgress({ name: 'images', remaining, total: 6 });
        assert.ok(value >= last, `went backwards at ${remaining}`);
        assert.ok(value <= 1);
        last = value;
    }
    assert.equal(stageProgress({ name: 'placing' }).value, 1);
});
