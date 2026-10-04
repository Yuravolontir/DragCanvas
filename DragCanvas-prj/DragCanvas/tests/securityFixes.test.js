/**
 * The five faults found in the audit, each pinned by the case that exposed it.
 *
 * Four of them were invisible from outside: the code read as if the guard was
 * there. The fifth - a monthly schedule landing on the 3rd of March - was a
 * date arithmetic mistake no reviewer would catch by reading.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { passwordProblem, MIN_PASSWORD_LENGTH } from '../utils/password.js';
import { calculateNextRunDate } from '../jobs/schedule.processor.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// ---------- 1. a plain admin must not be able to take over a superadmin ----------

test('every admin-only action on another account checks for a superadmin', () => {
  const ctrl = read('features/users/user.ctrl.js');
  for (const fn of ['updateStatus', 'updateRole', 'resetPassword']) {
    const body = ctrl.slice(ctrl.indexOf(`export async function ${fn}(`));
    const end = body.indexOf('\nexport async function', 1);
    const scope = end === -1 ? body : body.slice(0, end);
    assert.match(scope, /loadProtectedTarget\(req, res,/,
      `${fn} must refuse a superadmin target - it sits behind requireAdmin, which a plain admin satisfies`);
  }
});

test('the guard lets a superadmin through and stops everyone else', () => {
  const ctrl = read('features/users/user.ctrl.js');
  const guard = ctrl.slice(ctrl.indexOf('async function loadProtectedTarget'));
  assert.match(guard, /target\.IsSuperAdmin && !req\.user\?\.isSuperAdmin/);
  assert.match(guard, /403/);
});

// ---------- 2. a password has to be worth hashing ----------

test('the obvious weak passwords are refused', () => {
  for (const bad of ['', 'a', 'short1', 'abcdefgh', '12345678', null, undefined, 12345678]) {
    assert.ok(passwordProblem(bad), `${String(bad)} must be refused`);
  }
});

test('a reasonable password is accepted', () => {
  for (const good of ['correct9horse', 'Passw0rdish', 'aaaaaaa1']) {
    assert.equal(passwordProblem(good), null, `${good} should pass`);
  }
});

test('the floor is eight characters', () => {
  assert.equal(MIN_PASSWORD_LENGTH, 8);
  assert.ok(passwordProblem('abcdef1'));      // seven
  assert.equal(passwordProblem('abcdefg1'), null); // eight
});

test('signup and the admin reset enforce the same rule', () => {
  for (const file of ['features/auth/auth.ctrl.js', 'features/users/user.ctrl.js']) {
    assert.match(read(file), /passwordProblem\(/, `${file} must apply the policy`);
  }
});

test('an admin reset no longer hands out one shared password', () => {
  const hook = read('src/Components/Admin/useAdminUsers.js');
  // The call, not the word: the comment above the fix names the constant it
  // replaced, and naming what you removed is worth keeping.
  assert.ok(!/setTempPassword\(\s*['"][^'"]*['"]\s*\)/.test(hook),
    'a literal password for every user is a password everyone knows');
  assert.match(hook, /crypto\.getRandomValues/, 'and it has to be drawn from crypto');
});

// ---------- 3. monthly schedules on short months ----------

test('a monthly schedule never lands on a date nobody chose', () => {
  const RealDate = Date;
  const at = (now, day) => {
    global.Date = class extends RealDate {
      constructor(...a) { return a.length ? new RealDate(...a) : new RealDate(now); }
      static now() { return new RealDate(now).getTime(); }
    };
    try { return calculateNextRunDate('monthly', '09:00', day); }
    finally { global.Date = RealDate; }
  };

  // The reported case: the 31st, asked on the 31st of January, used to answer
  // the 3rd of March - February skipped and the day wrong.
  assert.equal(at('2026-01-31T10:00:00', '31').toISOString().slice(0, 10), '2026-02-28');
  // The 31st in a thirty-day month used to roll into the next month's 1st.
  assert.equal(at('2026-04-15T10:00:00', '31').toISOString().slice(0, 10), '2026-04-30');
  assert.equal(at('2026-02-01T10:00:00', '30').toISOString().slice(0, 10), '2026-02-28');
});

test('an ordinary monthly schedule is unchanged', () => {
  const RealDate = Date;
  const at = (now, day) => {
    global.Date = class extends RealDate {
      constructor(...a) { return a.length ? new RealDate(...a) : new RealDate(now); }
      static now() { return new RealDate(now).getTime(); }
    };
    try { return calculateNextRunDate('monthly', '09:00', day); }
    finally { global.Date = RealDate; }
  };
  assert.equal(at('2026-03-10T10:00:00', '15').toISOString().slice(0, 10), '2026-03-15');
  assert.equal(at('2026-03-20T10:00:00', '15').toISOString().slice(0, 10), '2026-04-15');
});

test('daily and weekly still answer a real date', () => {
  for (const freq of ['daily', 'weekly']) {
    const d = calculateNextRunDate(freq, '09:00', '3');
    assert.ok(d instanceof Date && !Number.isNaN(d.getTime()), `${freq} must return a date`);
    assert.ok(d > new Date(), `${freq} must be in the future`);
  }
});

// ---------- 4. the user search ----------

test('searching with stray spaces still finds the account', () => {
  const hook = read('src/Components/Admin/useAdminUsers.js');
  assert.match(hook, /const needle = searchEmail\.trim\(\)\.toLowerCase\(\);/,
    'the guard trimmed and the comparison did not, so " ivan " matched nobody');
  assert.ok(!/includes\(searchEmail\.toLowerCase\(\)\)/.test(hook));
});

// ---------- 5. the unsubscribe token ----------

test('a stored unsubscribe row is no longer a working link', () => {
  const ctrl = read('features/subscribers/subscriber.ctrl.js');
  const send = ctrl.slice(ctrl.indexOf('export async function send('));
  assert.ok(!/token=\$\{recipient\.UnsubscribeTokenHash\}/.test(send),
    'mailing the stored hash made the hashing decorative');
  assert.match(send, /rotateUnsubscribe\(recipient\.Subscriber_ID, hash\(/,
    'each send must store only the hash of a fresh token');
});

test('links already delivered keep working', () => {
  // Breaking them would leave a recipient unable to unsubscribe, which is worse
  // than the weakness being closed.
  const unsub = read('features/subscribers/subscriber.ctrl.js');
  const fn = unsub.slice(unsub.indexOf('export async function unsubscribe('));
  assert.match(fn, /unsubscribe\(hash\(value\)\)/, 'the hashed form must be tried');
  assert.match(fn, /unsubscribe\(value\)/, 'and the legacy value must still be accepted');
});
