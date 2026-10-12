/**
 * Where a generation's waiting went, and the three places it was cut.
 *
 * Measured against the real providers: the layout call is about a minute and
 * cannot be shortened without the model breaking its own JSON, so the savings
 * are around it - pictures drawn in one round instead of two, a tenth of the
 * bytes per picture, and a request for motion that can no longer cost three
 * whole layouts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { retryForMotion } from '../features/ai/ai.ctrl.js';

const videoHero = { type: 'Video', props: { sourceType: 'background', src: 'clip.mp4' }, children: [] };
const imageHero = { type: 'Container', props: { backgroundImage: 'photo.jpg' }, children: [] };

test('a still hero after an explicit ask earns exactly one retry', () => {
    const still = { sections: [imageHero] };
    const prompt = 'a law firm, with a video hero';
    assert.equal(retryForMotion(prompt, still, 1), true, 'first attempt: ask again');
    assert.equal(retryForMotion(prompt, still, 2), false, 'second attempt: repair it instead of a third layout');
    assert.equal(retryForMotion(prompt, still, 3), false);
});

test('no retry when nobody asked, or when the hero already moves', () => {
    assert.equal(retryForMotion('a law firm in Haifa', { sections: [imageHero] }, 1), false);
    assert.equal(retryForMotion('a law firm, with a video hero', { sections: [videoHero] }, 1), false);
});

/** A fetch that answers only when told to, so concurrency can be counted. */
function deferredFetch() {
    const pending = [];
    let inFlight = 0;
    let peak = 0;
    const fetch = (url, init) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        return new Promise((resolve) => {
            pending.push(() => {
                inFlight -= 1;
                const { prompt } = JSON.parse(init.body);
                resolve({ ok: true, json: async () => ({ data: { url: `https://img/${prompt.length}-${pending.length}` } }) });
            });
        });
    };
    return { fetch, pending, peak: () => peak };
}

test('every budgeted picture is ordered in the same round', async (t) => {
    const stub = deferredFetch();
    t.mock.method(globalThis, 'fetch', stub.fetch);
    globalThis.localStorage ??= { getItem: () => 'token' };

    const { replacePlaceholderImages } = await import('../src/utils/aiImages.js');
    // Six pictures on six differently worded sections, so six distinct prompts.
    const images = ['harbour', 'kitchen', 'garden', 'studio', 'library', 'workshop'].map((place, i) => ({
        type: 'Image',
        props: { src: `https://picsum.photos/seed/${place}/800/600`, alt: `the ${place}` },
        children: [{ type: 'Heading', props: { text: `Our ${place}, room ${i}` }, children: [] }],
    }));
    const layout = { sections: images.map((image) => ({ props: {}, children: [image] })) };
    const run = replacePlaceholderImages(layout, {}, () => {});

    // Let every worker reach its fetch before anything answers.
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(stub.pending.length, 6, 'all six were asked for before the first came back');

    stub.pending.forEach((answer) => answer());
    await run;
    assert.equal(stub.peak(), 6);
    assert.ok(images.every((image) => image.props.src.startsWith('https://img/')), 'every answer lands in its picture');
});

test('pictures are asked for as WebP, a tenth of the PNG they replaced', async (t) => {
    process.env.STABILITY_API_KEY ||= 'test-key';
    let sentFormat;
    t.mock.method(globalThis, 'fetch', async (url, init) => {
        sentFormat = init.body.get('output_format');
        return new Response(Buffer.from('RIFF0000WEBP'), { status: 200, headers: { 'content-type': 'image/webp' } });
    });

    const { generateImage } = await import('../features/ai/ai.service.js');
    const { contentType } = await generateImage('a harbour at dawn');
    assert.equal(sentFormat, 'webp');
    assert.equal(contentType, 'image/webp');
});

test('a picture that never answers is given up on, not waited for forever', async (t) => {
    process.env.STABILITY_API_KEY ||= 'test-key';
    t.mock.timers.enable({ apis: ['setTimeout'] });
    t.mock.method(globalThis, 'fetch', (url, init) => new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));

    const { generateImage } = await import('../features/ai/ai.service.js');
    const pending = generateImage('a harbour at dawn');
    t.mock.timers.tick(45000);
    // 504 is what sends the controller to its stock-photo fallback.
    await assert.rejects(pending, (error) => error.status === 504);
});

test('a one-character slip in the JSON is mended locally, not by another call', async () => {
    const { safeParseAIJson } = await import('../utils/ai.helpers.js');
    // Both shapes taken from real one-line answers that failed to parse.
    const strayQuote = '{"sections":[{"props":{"color":{"r":92,"g":90,"b":90,"a":1"}},"type":"Text"}]}';
    const bracketShort = '{"sections":[{"props":{"text":"hi"},"type":"Text","children":[]}]';
    assert.equal(safeParseAIJson(strayQuote).sections[0].type, 'Text');
    assert.equal(safeParseAIJson(bracketShort).sections[0].props.text, 'hi');
    assert.throws(() => safeParseAIJson('no json here at all'), 'what cannot be mended still fails');
});

test('the model is asked for single-line JSON', async () => {
    const { SYSTEM_PROMPT } = await import('../features/ai/prompt/system.prompt.js');
    assert.match(SYSTEM_PROMPT, /JSON on a single line/);
});

/** Drive the real controller against a scripted provider. */
async function generateWith(t, answers, prompt) {
    process.env.OPENROUTER_API_KEY ||= 'test-key';
    process.env.AI_RETRY_BACKOFF_MS = '1';
    const db = (await import('../utils/db.sql.services.js')).default;
    t.mock.method(db, 'executeQuery', async () => []);
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => {
        const content = answers[Math.min(calls, answers.length - 1)];
        calls += 1;
        return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }), { status: 200 });
    });
    const { generateWebsite } = await import('../features/ai/ai.ctrl.js');
    const res = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await generateWebsite({ body: { prompt }, user: { userId: 1 } }, res);
    return { res, calls: () => calls };
}

const stillPage = JSON.stringify({
    sections: Array.from({ length: 6 }, (_, i) => ({
        props: { anchor: `part-${i}`, backgroundImage: i === 0 ? 'https://picsum.photos/seed/hero/1600/900' : '' },
        children: [{ type: 'Heading', props: { text: `Part ${i}` }, children: [] }],
    })),
});

test('a page held back for its still hero is delivered when the retries fail', async (t) => {
    const { res, calls } = await generateWith(t, [stillPage, 'not json', 'not json'], 'a law firm, with a video hero');
    assert.equal(calls(), 3, 'one call per attempt - no extra round-trip asking the model to repair');
    assert.equal(res.statusCode, 200, 'the visitor gets the page, not an error');
    assert.ok(res.body.data.sections.length >= 6);
});

const nav = { props: {}, children: [{ type: 'NavbarElement', props: { links: [] }, children: [] }] };
const footer = { props: { anchor: 'footer' }, children: [{ type: 'Text', props: { text: '©' }, children: [] }] };
const part = (name) => ({ props: { anchor: name }, children: [{ type: 'Heading', props: { text: name }, children: [] }] });
const threePages = JSON.stringify({
    pages: ['home', 'about', 'contact'].map((slug) => ({ name: slug, slug, sections: [nav, part(`${slug}-a`), part(`${slug}-b`), footer] })),
});

test('pages nobody asked for are folded into one page, content kept', async () => {
    const { flattenToOnePage } = await import('../utils/ai.helpers.js');
    const out = flattenToOnePage(JSON.parse(threePages));
    assert.equal(out.pages, undefined);
    const anchors = out.sections.map((s) => s.props.anchor);
    assert.deepEqual(anchors.filter((a) => a && a !== 'footer'), ['home-a', 'home-b', 'about-a', 'about-b', 'contact-a', 'contact-b']);
    assert.equal(out.sections.filter((s) => s.children[0].type === 'NavbarElement').length, 1, 'one navbar');
    assert.equal(anchors.filter((a) => a === 'footer').length, 1, 'one footer, at the end');
    assert.equal(anchors.at(-1), 'footer');
});

test('without the multi-page box the controller returns a single page', async (t) => {
    const { res } = await generateWith(t, [threePages], 'a bakery in Haifa');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.pages, undefined, 'no pages the visitor did not ask for');
    assert.ok(res.body.data.sections.length >= 6);
});

test('with the multi-page box the pages stay pages', async (t) => {
    process.env.OPENROUTER_API_KEY ||= 'test-key';
    const db = (await import('../utils/db.sql.services.js')).default;
    t.mock.method(db, 'executeQuery', async () => []);
    t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ choices: [{ message: { content: threePages }, finish_reason: 'stop' }] }), { status: 200 }));
    const { generateWebsite } = await import('../features/ai/ai.ctrl.js');
    const res = { status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await generateWebsite({ body: { prompt: 'a bakery in Haifa', multiPage: true }, user: { userId: 1 } }, res);
    assert.equal(res.body.data.pages.length, 3);
});
