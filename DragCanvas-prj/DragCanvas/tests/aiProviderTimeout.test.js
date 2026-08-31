import test from 'node:test';
import assert from 'node:assert/strict';

// Must be set before ai.service.js is imported: MODEL_TIMEOUT_MS is read once
// at module load, and a short timeout keeps this test fast.
process.env.AI_TIMEOUT_MS = '50';
process.env.OPENROUTER_API_KEY = 'test-key';

const { repairLayoutJson } = await import('../features/ai/ai.service.js');

test('a provider that never responds is treated as a retryable timeout, not a hang', async () => {
  const originalFetch = global.fetch;
  global.fetch = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      reject(error);
    });
  });

  try {
    await assert.rejects(
      repairLayoutJson('{"sections":[]}'),
      (error) => {
        assert.equal(error.retryable, true);
        assert.match(error.message, /did not respond/i);
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});
