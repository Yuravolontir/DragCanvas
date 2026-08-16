/**
 * Regression tests for deleting a user.
 *
 * This is the only irreversible thing an administrator can do, and the guards
 * are the whole of its safety. Each case below is a way the account system could
 * be destroyed by one click:
 *
 *   - an admin deleting themselves, which with a single administrator leaves
 *     nobody able to administer anything;
 *   - anyone deleting the superadmin, which is the same but permanent;
 *   - a mistyped id quietly deleting somebody else.
 *
 * The cascade itself needs a database and is covered by the deploy check in the
 * change's task list. What is tested here is everything that decides whether the
 * cascade runs at all.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { makeRes, makeNext } from './helpers.js';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';

/**
 * The controller reaches the database through the model, so the model is
 * replaced for the duration. `deleteUserFromDB` records whether it was called -
 * "the guard returned the right status" and "the guard actually stopped the
 * deletion" are different claims, and only the second one matters.
 */
const { default: UserMdl } = await import('../features/users/user.mdl.js');
const { deleteUser } = await import('../features/users/user.ctrl.js');

const ADMIN = { userId: 8, email: 'admin@example.com', isAdmin: true, isSuperAdmin: false };

function stubUsers({ target, onDelete }) {
  const original = { get: UserMdl.getUserByIdFromDB, del: UserMdl.deleteUserFromDB };
  const calls = { deleted: 0 };

  UserMdl.getUserByIdFromDB = async () => target;
  UserMdl.deleteUserFromDB = async () => {
    calls.deleted += 1;
    return onDelete ?? true;
  };

  return {
    calls,
    restore() {
      UserMdl.getUserByIdFromDB = original.get;
      UserMdl.deleteUserFromDB = original.del;
    },
  };
}

const request = (id, user = ADMIN) => ({ params: { id: String(id) }, user });

test('an admin cannot delete their own account', async (t) => {
  const stub = stubUsers({ target: { User_ID: 8, UserName: 'admin' } });
  t.after(stub.restore);

  const res = makeRes();
  await deleteUser(request(8), res, makeNext());

  assert.equal(res.statusCode, 400);
  assert.equal(stub.calls.deleted, 0, 'the deletion must not have run');
});

test('a superadmin cannot be deleted', async (t) => {
  const stub = stubUsers({ target: { User_ID: 9, UserName: 'root', IsSuperAdmin: true } });
  t.after(stub.restore);

  const res = makeRes();
  await deleteUser(request(9), res, makeNext());

  assert.equal(res.statusCode, 403);
  assert.equal(stub.calls.deleted, 0, 'the deletion must not have run');
});

test('deleting somebody who does not exist is a 404, not a silent success', async (t) => {
  const stub = stubUsers({ target: null });
  t.after(stub.restore);

  const res = makeRes();
  await deleteUser(request(4242), res, makeNext());

  assert.equal(res.statusCode, 404);
  assert.equal(stub.calls.deleted, 0);
});

test('a non-numeric id is refused before anything is looked up', async (t) => {
  const stub = stubUsers({ target: { User_ID: 7, UserName: 'someone' } });
  t.after(stub.restore);

  const res = makeRes();
  await deleteUser(request('abc'), res, makeNext());

  assert.equal(res.statusCode, 400);
  assert.equal(stub.calls.deleted, 0);
});

test('an ordinary user is deleted, and the deletion actually runs', async (t) => {
  const stub = stubUsers({ target: { User_ID: 7, UserName: 'someone', IsSuperAdmin: false } });
  t.after(stub.restore);

  const res = makeRes();
  await deleteUser(request(7), res, makeNext());

  assert.equal(res.statusCode, 200);
  assert.equal(stub.calls.deleted, 1);
  assert.match(res.body.data.message, /someone/);
});

test('a row that vanished between the lookup and the delete answers 404', async (t) => {
  // Two administrators on the same account at the same time: the second one
  // must not report success for a deletion that removed nothing.
  const stub = stubUsers({ target: { User_ID: 7, UserName: 'someone' }, onDelete: false });
  t.after(stub.restore);

  const res = makeRes();
  await deleteUser(request(7), res, makeNext());

  assert.equal(res.statusCode, 404);
});
