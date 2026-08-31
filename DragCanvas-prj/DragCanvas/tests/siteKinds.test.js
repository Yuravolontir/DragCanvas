/**
 * Which kind of site the generator thinks it is building.
 *
 * The kind decides the menu of sections the model is offered, so a prompt that
 * matches nothing gets the blandest menu there is - hero, what this is about,
 * get in touch - and every such site comes back the same shape whatever it is
 * about. Measured over realistic prompts, more than half of them missed: a BMX
 * school, a driving school, a language school, a summer camp and a florist all
 * landed in the fallback, which is why "every site looks the same" was a fair
 * description of what the generator produced.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { inferSiteKind, SITE_KINDS } from '../features/ai/prompt/site.kinds.js';

const REALISTIC = [
    ['a BMX bike school', 'education'],
    ['a skate academy', 'education'],
    ['a driving school', 'education'],
    ['a language school for adults', 'education'],
    ['a summer camp for kids', 'education'],
    ['private guitar lessons', 'education'],
    ['a bakery in Tel Aviv', 'restaurant'],
    ['a SaaS analytics product', 'product'],
    ['a photographer portfolio', 'portfolio'],
    ['a tech conference in Berlin', 'event'],
    ['a personal blog about hiking', 'content'],
    ['a weekly podcast about cooking at home', 'content'],
    ['a dentist in Haifa', 'localBusiness'],
    ['a florist', 'localBusiness'],
];

test('realistic prompts reach a kind that suits them', () => {
    for (const [prompt, expected] of REALISTIC) {
        assert.equal(inferSiteKind(prompt).key, expected, prompt);
    }
});

test('nothing in a broad sample falls through to the bland fallback', () => {
    const sample = [
        ...REALISTIC.map(([prompt]) => prompt),
        'a yoga teacher', 'a dance studio for kids', 'a tutoring service', 'a climbing centre',
        'a charity for street dogs', 'an online course about Python', 'a car dealership',
        'a veterinary clinic', 'a real estate agency', 'a travel agency', 'a furniture shop',
    ];
    const missed = sample.filter(prompt => inferSiteKind(prompt).key === 'general');
    assert.deepEqual(missed, [], 'these would all get the same generic page');
});

test('matching is by substring, so a word inside a word can win', () => {
    // 'architect' is a portfolio keyword and lives inside 'architecture'. The
    // match is deliberately cheap - a wrong guess only changes which advice is
    // shown, never whether a page is produced - but it is worth knowing that
    // this is how it behaves rather than discovering it in a generation.
    assert.equal(inferSiteKind('a podcast about architecture').key, 'portfolio');
});

test('a prompt about nothing recognisable still gets a usable menu', () => {
    const kind = inferSiteKind('qwerty zxcvbn');
    assert.equal(kind.key, 'general');
    assert.ok(kind.sections && kind.notes, 'the fallback still describes a page');
});

test('every kind offers a menu and advice, not an empty shell', () => {
    for (const [key, kind] of Object.entries(SITE_KINDS)) {
        assert.ok(kind.label, key);
        assert.ok(kind.sections.split('·').length >= 5, `${key} should offer more sections than one page uses`);
        assert.ok(kind.keywords.length >= 5, `${key} needs enough keywords to be reachable`);
    }
});

test('the education menu reaches for the elements a school page needs', () => {
    const { sections, notes } = SITE_KINDS.education;
    const text = `${sections} ${notes}`.toLowerCase();
    for (const wanted of ['timetable', 'instructor', 'countdown', 'pricing']) {
        assert.ok(text.includes(wanted), `education should mention ${wanted}`);
    }
});
