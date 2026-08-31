import test from 'node:test';
import assert from 'node:assert/strict';

import { createBuilder } from '../scripts/templates/_builder.mjs';
import saas from '../scripts/templates/saas.mjs';

const byLabel = (map, label) => Object.values(map).find(
  (node) => node.custom?.displayName === label,
);

test('the shared next-step section uses the template panel colour and editorial copy', () => {
  const b = createBuilder();
  const root = b.root({ width: '100%' });
  const panel = { r: 31, g: 36, b: 48, a: 1 };

  b.modernSuite(root, {
    mode: 'service',
    panel,
    ink: { r: 255, g: 255, b: 255, a: 1 },
  });

  assert.deepEqual(byLabel(b.map, 'Next step panel').props.background, panel);
  assert.equal(byLabel(b.map, 'Next step heading').props.text, 'Start with a conversation');
  assert.equal(byLabel(b.map, 'Appointment booking').props.heading, 'Choose a time');

  const allCopy = Object.values(b.map).map((node) => node.props?.text).filter(Boolean).join(' ');
  assert.doesNotMatch(allCopy, /Everything in one place|Modern tools/i);
});

test('content pages close with a newsletter instead of commerce widgets', () => {
  const b = createBuilder();
  const root = b.root({ width: '100%' });

  b.modernSuite(root, { mode: 'content' });

  assert.ok(byLabel(b.map, 'Newsletter signup'));
  assert.equal(byLabel(b.map, 'Selected pieces'), undefined);
  assert.equal(byLabel(b.map, 'Collection countdown'), undefined);
});

test('the SaaS template no longer ends with a generic product shop', () => {
  const template = saas();

  assert.ok(byLabel(template.map, 'Newsletter signup'));
  assert.equal(byLabel(template.map, 'Selected pieces'), undefined);
  assert.equal(byLabel(template.map, 'Collection countdown'), undefined);
});
