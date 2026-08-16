/**
 * Regression tests for template visibility.
 *
 * Hiding a template already worked, through DELETE, which sets IsActive = false.
 * Nothing set it back, so the requirement's "enable or disable" only ran in one
 * direction and a hidden template needed a database query to recover.
 *
 * The endpoint takes the state the template should end in rather than flipping
 * what it finds, so the test that matters is the one asserting the value handed
 * to the model is the value that arrived - not merely that something was written.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { makeRes, makeNext } from './helpers.js';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';

const { default: TemplateMdl } = await import('../features/templates/template.mdl.js');
const { setTemplateVisibility } = await import('../features/templates/template.ctrl.js');

function stubTemplates(rowCount) {
  const original = TemplateMdl.setTemplateVisibilityInDB;
  const seen = [];

  TemplateMdl.setTemplateVisibilityInDB = async (id, isActive) => {
    seen.push({ id, isActive });
    return rowCount;
  };

  return { seen, restore() { TemplateMdl.setTemplateVisibilityInDB = original; } };
}

const request = (isActive, id = '16') => ({ params: { id }, body: { isActive } });

test('showing a template writes true', async (t) => {
  const stub = stubTemplates(1);
  t.after(stub.restore);

  const res = makeRes();
  await setTemplateVisibility(request(true), res, makeNext());

  assert.equal(res.statusCode, 200);
  assert.deepEqual(stub.seen, [{ id: '16', isActive: true }]);
});

test('hiding a template writes false', async (t) => {
  const stub = stubTemplates(1);
  t.after(stub.restore);

  const res = makeRes();
  await setTemplateVisibility(request(false), res, makeNext());

  assert.equal(res.statusCode, 200);
  assert.deepEqual(stub.seen, [{ id: '16', isActive: false }]);
});

test('a missing or non-boolean isActive is refused', async (t) => {
  const stub = stubTemplates(1);
  t.after(stub.restore);

  for (const body of [{}, { isActive: 'true' }, { isActive: 1 }, { isActive: null }]) {
    const res = makeRes();
    await setTemplateVisibility({ params: { id: '16' }, body }, res, makeNext());
    assert.equal(res.statusCode, 400, `${JSON.stringify(body)} should be refused`);
  }

  assert.equal(stub.seen.length, 0, 'nothing should have been written');
});

test('a template that does not exist answers 404', async (t) => {
  const stub = stubTemplates(0);
  t.after(stub.restore);

  const res = makeRes();
  await setTemplateVisibility(request(true, '9999'), res, makeNext());

  assert.equal(res.statusCode, 404);
});
