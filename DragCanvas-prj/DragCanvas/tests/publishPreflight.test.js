import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectBeforePublish } from '../src/utils/publishPreflight.js';

test('preflight reports the common publishing mistakes once each', () => {
  const issues = inspectBeforePublish({
    one: { type: { resolvedName: 'Image' }, props: { src: '/one.jpg', alt: '' } },
    two: { type: { resolvedName: 'Image' }, props: { src: '/two.jpg', alt: '' } },
    form: { type: { resolvedName: 'Form' }, props: { fields: [{ type: 'text' }] } },
    text: { type: { resolvedName: 'Text' }, props: { text: 'Lorem ipsum' } },
  }, { title: '' });
  assert.deepEqual(issues.map((issue) => issue.code), [
    'missing-title', 'missing-h1', 'missing-alt', 'form-email', 'placeholder-text',
  ]);
});

test('a sound page passes preflight', () => {
  const issues = inspectBeforePublish({
    h1: { type: { resolvedName: 'Heading' }, props: { level: 1, text: 'Hello' } },
    image: { type: { resolvedName: 'Image' }, props: { src: '/one.jpg', alt: 'A view' } },
  }, { title: 'Site' });
  assert.deepEqual(issues, []);
});
