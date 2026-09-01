/**
 * What a failed generation is allowed to say.
 *
 * Every 5xx body is redacted on the way out, and rightly: a controller usually
 * hands on the database driver's own text, which is a free map of the schema.
 * The AI generator is not like that. Its failures are things somebody has to
 * act on - a key was revoked, an account is out of credit - and replacing those
 * with "Something went wrong on our side. Reference: 6777409b" left the person
 * with nothing to do and us with nothing to go on. That happened, twice, and
 * the reference number was all anybody had.
 *
 * So a controller may mark a sentence as written for the reader. These cases
 * hold the two halves of that: the marked ones survive, everything else is
 * still redacted, and the marker itself never reaches the client.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildErrorResponse } from '../utils/response.builder.js';
import { refusalMessage } from '../features/ai/ai.ctrl.js';

/** Run one body through hideInternalErrors as production would. */
async function throughMiddleware(status, body) {
  const had = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    // Imported fresh so the module reads the environment it is being tested in.
    const { hideInternalErrors } = await import(`../middlewares/error.js?case=${status}-${Math.random()}`);
    let sent = null;
    const res = { statusCode: status, json: (value) => { sent = value; return value; } };
    hideInternalErrors({ id: 'ref-1234', method: 'POST', path: '/api/ai/generate' }, res, () => {});
    res.json(body);
    return sent;
  } finally {
    if (had === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = had;
  }
}

test('a sentence written for the reader survives a 502', async () => {
  const sent = await throughMiddleware(502, buildErrorResponse('The AI service has no credit left.', { written: true }));
  assert.equal(sent.error, 'The AI service has no credit left.');
});

test('the marker is not part of the reply', async () => {
  const sent = await throughMiddleware(502, buildErrorResponse('Say this.', { written: true }));
  assert.ok(!('written' in sent), 'an internal marker must not be shipped');
  assert.equal(sent.success, false);
});

test('anything unmarked is still redacted', async () => {
  // This is the case the redaction exists for.
  const sent = await throughMiddleware(500, buildErrorResponse('relation "TBProjects" does not exist'));
  assert.match(sent.error, /Something went wrong on our side/);
  assert.doesNotMatch(sent.error, /TBProjects/);
});

test('a 4xx is left alone either way', async () => {
  const sent = await throughMiddleware(400, buildErrorResponse('Prompt is required'));
  assert.equal(sent.error, 'Prompt is required');
});

test('each refusal says which one it is and what to do', () => {
  const noKey = refusalMessage({ message: 'Missing OPENROUTER_API_KEY' });
  const noCredit = refusalMessage({ message: 'Payment required', status: 402 });
  const badKey = refusalMessage({ message: 'Unauthorized', status: 401 });

  assert.notEqual(noKey, noCredit);
  assert.notEqual(noCredit, badKey);
  assert.match(noCredit, /credit/i);
  assert.match(badKey, /key/i);

  // None of the three is helped by pressing the button again, so none of them
  // may suggest it.
  for (const message of [noKey, noCredit, badKey]) {
    assert.doesNotMatch(message, /try again/i);
  }
});

test('a refusal never repeats what the provider said', () => {
  // The provider's text is logged, not shown: it is the one part of this that
  // nobody vouched for.
  const message = refusalMessage({ message: 'invalid_api_key: sk-or-v1-abcdef', status: 401 });
  assert.doesNotMatch(message, /sk-or/);
  assert.doesNotMatch(message, /invalid_api_key/);
});
