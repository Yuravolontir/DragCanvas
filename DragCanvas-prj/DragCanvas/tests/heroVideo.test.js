/**
 * A background video hero, guaranteed rather than hoped for.
 *
 * The prompt tells the model a video opening suits most sites and nothing ever
 * checked, so it produced one when it felt like it. Asking again is the honest
 * first answer; this is what happens when asking again did not work.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { promoteHeroToVideo } from '../utils/ai.helpers.js';
import { wantsMotion, askedForMotion, hasVideoHero } from '../features/ai/ai.ctrl.js';

const heroWithPhoto = () => ({
    type: 'Container',
    props: { backgroundImage: 'https://example.com/hero.jpg', background: { r: 0, g: 0, b: 0, a: 1 } },
    children: [{ type: 'Heading', props: { text: 'Ride with us' }, children: [] }],
});

test('a video opening is expected by default', () => {
    assert.equal(wantsMotion('a BMX school in Tel Aviv'), true);
    assert.equal(wantsMotion(''), true);
});

test('a request that argues against motion is taken at its word', () => {
    for (const prompt of ['a law firm, no video', 'portfolio without animation', 'a static one-pager']) {
        assert.equal(wantsMotion(prompt), false, prompt);
    }
});

test('only an explicit ask is worth spending a retry on', () => {
    assert.equal(askedForMotion('bakery with a video hero'), true);
    assert.equal(askedForMotion('a bakery in Haifa'), false);
});

test('the still hero keeps its words, its crop and its photograph', () => {
    const layout = { sections: [heroWithPhoto()] };
    assert.equal(promoteHeroToVideo(layout, 'BMX school'), true);

    const hero = layout.sections[0];
    assert.equal(hero.props.backgroundImage, undefined, 'the still is the poster now, not painted twice');

    const [video] = hero.children;
    assert.equal(video.type, 'Video');
    assert.equal(video.props.sourceType, 'background');
    assert.equal(video.props.poster, 'https://example.com/hero.jpg');
    assert.match(video.props.src, /^https:\/\/videos\.pexels\.com\//);
    assert.equal(video.children[0].props.text, 'Ride with us', 'the headline stays inside');
    assert.equal(hasVideoHero(layout), true);
});

test('a hero that is not a full-bleed photograph is left alone', () => {
    const plain = { sections: [{ type: 'Container', props: {}, children: [{ type: 'Heading', props: {}, children: [] }] }] };
    assert.equal(promoteHeroToVideo(plain, 'anything'), false);

    const empty = { sections: [{ type: 'Container', props: { backgroundImage: 'x.jpg' }, children: [] }] };
    assert.equal(promoteHeroToVideo(empty, 'anything'), false, 'nothing to put in front of the footage');
});

test('a layout that already opens on video is not touched twice', () => {
    const layout = { sections: [heroWithPhoto()] };
    promoteHeroToVideo(layout, 'x');
    const after = JSON.stringify(layout);
    if (!hasVideoHero(layout)) throw new Error('setup');
    assert.equal(JSON.stringify(layout), after);
});
