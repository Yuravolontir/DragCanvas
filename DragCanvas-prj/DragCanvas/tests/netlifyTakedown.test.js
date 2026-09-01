/**
 * Taking a published site down when its project is deleted.
 *
 * Deleting a project only ever marked the row. Whatever it had published went
 * on being served, on a URL the account could no longer reach and could no
 * longer take down either - the id that identified the site was on the row that
 * had just been deleted. Every deleted-but-published project was a page left up
 * for good and a name nobody could reuse.
 *
 * The awkward part is what to do when Netlify says no, so most of this is about
 * that: the delete is the user's own, they have confirmed it, and it must not
 * be refused because somebody else's API was briefly unhappy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { deleteNetlifySite } from '../features/publish/netlify.service.js';

/** Stand in for fetch, recording what it was asked to do. */
function stubFetch(reply) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, method: options?.method, auth: options?.headers?.Authorization });
    if (reply instanceof Error) throw reply;
    return { ok: reply.status >= 200 && reply.status < 300, status: reply.status };
  };
  return calls;
}

const withToken = async (token, run) => {
  const had = process.env.NETLIFY_TOKEN;
  const realFetch = globalThis.fetch;
  if (token === null) delete process.env.NETLIFY_TOKEN;
  else process.env.NETLIFY_TOKEN = token;
  try {
    return await run();
  } finally {
    if (had === undefined) delete process.env.NETLIFY_TOKEN;
    else process.env.NETLIFY_TOKEN = had;
    globalThis.fetch = realFetch;
  }
};

test('the site is deleted, by id, with the token', async () => {
  await withToken('tok', async () => {
    const calls = stubFetch({ status: 204 });
    const result = await deleteNetlifySite('site-123');

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'DELETE');
    assert.match(calls[0].url, /\/sites\/site-123$/);
    assert.equal(calls[0].auth, 'Bearer tok');
  });
});

test('a site that is already gone counts as gone', async () => {
  // Somebody deleting it in Netlify's own dashboard first is the ordinary way
  // this happens, and it is the end state that was asked for.
  await withToken('tok', async () => {
    stubFetch({ status: 404 });
    assert.deepEqual(await deleteNetlifySite('site-123'), { ok: true });
  });
});

test('a project that never published asks Netlify nothing', async () => {
  await withToken('tok', async () => {
    const calls = stubFetch({ status: 500 });
    assert.deepEqual(await deleteNetlifySite(null), { ok: true });
    assert.equal(calls.length, 0, 'no site, no call');
  });
});

test('a refusal is reported rather than thrown', async () => {
  // Thrown, it would become a 500 and the user could not delete their own
  // project at all.
  await withToken('tok', async () => {
    stubFetch({ status: 422 });
    const result = await deleteNetlifySite('site-123');
    assert.equal(result.ok, false);
    assert.match(result.reason, /422/);
  });
});

test('a network failure is reported rather than thrown', async () => {
  await withToken('tok', async () => {
    stubFetch(new Error('getaddrinfo ENOTFOUND'));
    const result = await deleteNetlifySite('site-123');
    assert.equal(result.ok, false);
    assert.match(result.reason, /ENOTFOUND/);
  });
});

test('no token is a refusal, not a silent success', async () => {
  // Silent success would mean a server missing its token quietly leaves every
  // deleted site standing, which is the bug this exists to fix.
  await withToken(null, async () => {
    const calls = stubFetch({ status: 204 });
    const result = await deleteNetlifySite('site-123');
    assert.equal(result.ok, false);
    assert.equal(calls.length, 0);
  });
});

test('the delete reads the project before it deletes the row', async () => {
  // The site id lives on the row. Marking it deleted first would throw away the
  // only way of finding the site.
  const source = (await import('node:fs')).readFileSync(
    new URL('../features/projects/project.ctrl.js', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export async function deleteProject'));
  const read = body.indexOf('getProjectByIdFromDB');
  const takedown = body.indexOf('deleteNetlifySite');
  const remove = body.indexOf('deleteProjectFromDB');

  assert.ok(read > -1 && takedown > -1 && remove > -1, 'all three steps are there');
  assert.ok(read < takedown, 'read the row before using what is on it');
  assert.ok(takedown < remove, 'take the site down before losing its id');
});
