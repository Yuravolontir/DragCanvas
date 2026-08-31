/**
 * When is a still hero worth another round trip?
 *
 * A video opening is expected by default now - the prompt says it suits most
 * sites - and a hero that arrives still is repaired in place rather than
 * refused. Spending one of the three attempts is reserved for the case where
 * the person asked for motion in so many words: that is the request where
 * coming back with a photograph is a plain miss rather than a preference.
 *
 * `wantsMotion` (the default expectation) is covered in heroVideo.test.js.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { askedForMotion, hasVideoHero } from '../features/ai/ai.ctrl.js';

const videoHero = { type: 'Video', props: { sourceType: 'background', src: 'clip.mp4' }, children: [] };
const imageHero = { type: 'Container', props: { backgroundImage: 'photo.jpg' }, children: [] };

test('a request that asks for motion in words is recognised', () => {
    for (const prompt of [
        'a bakery site with a video hero',
        'animated landing page for a gym',
        'make it cinematic',
        'coffee shop, moving background',
    ]) {
        assert.equal(askedForMotion(prompt), true, prompt);
    }
});

test('an ordinary request does not by itself earn a retry', () => {
    for (const prompt of [
        'a law firm in Haifa',
        'portfolio for a ceramicist',
        'dashboard for a SaaS product',
    ]) {
        assert.equal(askedForMotion(prompt), false, prompt);
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

test('only an explicit ask spends one of the three attempts', () => {
    const layout = { sections: [imageHero] };
    // The pair the controller actually branches on before retrying.
    assert.equal(askedForMotion('a law firm in Haifa') && !hasVideoHero(layout), false, 'an ordinary request is repaired, not retried');
    assert.equal(askedForMotion('a law firm, with a video hero') && !hasVideoHero(layout), true, 'asked for it by name: ask again');
});
