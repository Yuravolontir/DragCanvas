/**
 * When is a still hero a defect?
 *
 * The prompt tells the model to open on a background video and it complies when
 * it feels like it. Requiring one on every site would be wrong - the prompt
 * itself says a video opening suits *most* sites - and would spend a retry on
 * every law firm and dashboard that is better off plain. So the criterion
 * follows the request: motion is required when the person asked for it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { wantsMotion, hasVideoHero } from '../features/ai/ai.ctrl.js';

const videoHero = { type: 'Video', props: { sourceType: 'background', src: 'clip.mp4' }, children: [] };
const imageHero = { type: 'Container', props: { backgroundImage: 'photo.jpg' }, children: [] };

test('a request that asks for motion is recognised', () => {
    for (const prompt of [
        'a bakery site with a video hero',
        'animated landing page for a gym',
        'make it cinematic',
        'coffee shop, moving background',
    ]) {
        assert.equal(wantsMotion(prompt), true, prompt);
    }
});

test('an ordinary request is not treated as asking for motion', () => {
    for (const prompt of [
        'a law firm in Haifa',
        'portfolio for a ceramicist',
        'dashboard for a SaaS product',
    ]) {
        assert.equal(wantsMotion(prompt), false, prompt);
    }
});

test('a background video anywhere on any page counts as a hero', () => {
    assert.equal(hasVideoHero({ sections: [videoHero] }), true);
    assert.equal(hasVideoHero({ sections: [{ type: 'Container', props: {}, children: [videoHero] }] }), true);
    assert.equal(hasVideoHero({ pages: [{ sections: [imageHero] }, { sections: [videoHero] }] }), true);
});

test('a plain player is not a hero', () => {
    const player = { type: 'Video', props: { sourceType: 'player', src: 'clip.mp4' }, children: [] };
    assert.equal(hasVideoHero({ sections: [player] }), false);
});

test('a layout that opens on an image has no video hero', () => {
    assert.equal(hasVideoHero({ sections: [imageHero] }), false);
});

test('a still hero is only a defect when motion was asked for', () => {
    const layout = { sections: [imageHero] };
    // The pair the controller actually branches on.
    assert.equal(wantsMotion('a law firm in Haifa') && !hasVideoHero(layout), false, 'no retry for an ordinary request');
    assert.equal(wantsMotion('a law firm, with a video hero') && !hasVideoHero(layout), true, 'retry when it was asked for');
});
