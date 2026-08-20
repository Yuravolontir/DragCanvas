import test from 'node:test';
import assert from 'node:assert/strict';

import { safeDetails, writeLog } from '../utils/logger.js';

test('structured logs redact credentials recursively', () => {
  assert.deepEqual(safeDetails({
    userId: 7,
    password: 'secret',
    nested: { authorization: 'Bearer token', value: 'safe' },
  }), {
    userId: 7,
    password: '[redacted]',
    nested: { authorization: '[redacted]', value: 'safe' },
  });
});

test('writeLog emits searchable JSON', () => {
  let line = '';
  const sink = { info: (value) => { line = value; } };
  const record = writeLog('info', 'http_request', { requestId: 'abc', status: 200 }, sink);
  assert.equal(record.event, 'http_request');
  assert.deepEqual(JSON.parse(line), record);
});
