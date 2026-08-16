/**
 * Regression test for activating and deactivating an account.
 *
 * Found by exercising the requirement rather than reading it. `targetID` was
 * checked and `newStatus` was not, so a request that left it out sent undefined
 * into the column: IsActive became NULL, which is neither active nor inactive.
 * verifyToken reads that as inactive, so the account was locked out - and the
 * response said "updated to inactive", which reads like it was intended.
 *
 * The cases below are the shapes a malformed request arrives in. What matters is
 * that none of them reach the database.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { makeRes, makeNext } from './helpers.js';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';

const { default: UserMdl } = await import('../features/users/user.mdl.js');
const { updateStatus } = await import('../features/users/user.ctrl.js');

function stub() {
  const original = { get: UserMdl.getUserByIdFromDB, set: UserMdl.updateStatusInDB };
  const writes = [];

  UserMdl.getUserByIdFromDB = async () => ({ User_ID: 12, UserName: 'someone' });
  UserMdl.updateStatusInDB = async (id, status) => { writes.push({ id, status }); };

  return { writes, restore() { UserMdl.getUserByIdFromDB = original.get; UserMdl.updateStatusInDB = original.set; } };
}

const ADMIN = { userId: 1, isAdmin: true, isSuperAdmin: true };
const call = (body) => ({ body, user: ADMIN });

test('a missing newStatus never reaches the database', async (t) => {
  const s = stub();
  t.after(s.restore);

  for (const body of [{ targetID: 12 }, { targetID: 12, isActive: true }, { targetID: 12, newStatus: 'true' }, { targetID: 12, newStatus: null }]) {
    const res = makeRes();
    await updateStatus(call(body), res, makeNext());
    assert.equal(res.statusCode, 400, `${JSON.stringify(body)} should be refused`);
  }

  assert.equal(s.writes.length, 0, 'nothing should have been written');
});

test('deactivating writes false, activating writes true', async (t) => {
  const s = stub();
  t.after(s.restore);

  for (const value of [false, true]) {
    const res = makeRes();
    await updateStatus(call({ targetID: 12, newStatus: value }), res, makeNext());
    assert.equal(res.statusCode, 200);
  }

  assert.deepEqual(s.writes.map(w => w.status), [false, true]);
});

test('an admin still cannot deactivate themselves', async (t) => {
  const s = stub();
  t.after(s.restore);

  const res = makeRes();
  await updateStatus({ body: { targetID: 1, newStatus: false }, user: ADMIN }, res, makeNext());

  assert.equal(res.statusCode, 400);
  assert.equal(s.writes.length, 0);
});
