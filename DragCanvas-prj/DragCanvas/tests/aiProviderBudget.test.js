import test from 'node:test';
import assert from 'node:assert/strict';

import { affordableTokenLimit, publicProviderError } from '../features/ai/ai.service.js';

test('OpenRouter credit errors produce a safe automatic token fallback', () => {
    const providerMessage = 'You requested up to 32000 tokens, but can only afford 14190. To increase, visit https://openrouter.ai/keys/private-id';
    assert.equal(affordableTokenLimit(providerMessage, 32000), 13934);
});

test('too-small or unrelated provider limits are not retried', () => {
    assert.equal(affordableTokenLimit('can only afford 2000', 32000), null);
    assert.equal(affordableTokenLimit('rate limited', 32000), null);
});

test('provider errors never expose its key-management URL', () => {
    const message = publicProviderError(402);
    assert.match(message, /credits/i);
    assert.doesNotMatch(message, /openrouter\.ai\/workspaces|keys\//i);
});
