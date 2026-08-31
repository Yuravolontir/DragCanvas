import test from 'node:test';
import assert from 'node:assert/strict';
import { refinePagesWithRetry, retryBackoffMs } from '../features/ai/ai.ctrl.js';

test('refinePagesWithRetry does not re-call pages that already succeeded', async () => {
  const pages = ['home', 'about', 'contact'];
  const calls = [];
  let contactAttempts = 0;

  const work = async (page) => {
    calls.push(page);
    if (page === 'contact') {
      contactAttempts += 1;
      if (contactAttempts === 1) throw new Error('transient failure');
    }
    return `${page}-refined`;
  };

  const result = await refinePagesWithRetry(pages, work, { concurrency: 2, retries: 1 });

  assert.deepEqual(result, ['home-refined', 'about-refined', 'contact-refined']);
  assert.equal(calls.filter(p => p === 'home').length, 1);
  assert.equal(calls.filter(p => p === 'about').length, 1);
  assert.equal(calls.filter(p => p === 'contact').length, 2);
});

test('refinePagesWithRetry throws the last error when a page still fails after retrying', async () => {
  const pages = ['home', 'about'];
  const work = async (page) => {
    if (page === 'about') throw new Error('about page shrank');
    return `${page}-refined`;
  };

  await assert.rejects(
    refinePagesWithRetry(pages, work, { concurrency: 2, retries: 1 }),
    /about page shrank/
  );
});

test('refinePagesWithRetry preserves input order regardless of completion order', async () => {
  const pages = [10, 20, 30, 40];
  const work = async (n) => {
    await new Promise(resolve => setTimeout(resolve, n === 10 ? 20 : 0));
    return n * 2;
  };

  const result = await refinePagesWithRetry(pages, work, { concurrency: 4, retries: 0 });
  assert.deepEqual(result, [20, 40, 60, 80]);
});

test('retryBackoffMs grows exponentially and is capped', () => {
  const first = retryBackoffMs(1);
  const second = retryBackoffMs(2);
  const third = retryBackoffMs(3);
  assert.ok(second > first);
  assert.ok(third >= second);
  assert.ok(retryBackoffMs(20) <= 4000);
});
