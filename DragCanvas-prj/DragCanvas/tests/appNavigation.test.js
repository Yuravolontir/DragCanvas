import test from 'node:test';
import assert from 'node:assert/strict';

import { APP_NAV_ITEMS, APP_NAV_Z_INDEX, userDisplayName } from '../src/utils/appNavigation.js';

test('the application navbar keeps its three primary destinations', () => {
  assert.deepEqual(APP_NAV_ITEMS, [
    { label: 'Create', path: '/create-new-project' },
    { label: 'My Projects', path: '/my-projects' },
    { label: 'Templates', path: '/inspire-me' },
  ]);
});

test('the navbar stays above the editor chrome', () => {
  assert.ok(APP_NAV_Z_INDEX > 99999);
});

test('the welcome name accepts login and refreshed-session response shapes', () => {
  assert.equal(userDisplayName({ UserName: 'Yura' }), 'Yura');
  assert.equal(userDisplayName({ username: 'yura' }), 'yura');
  assert.equal(userDisplayName({ name: 'Yura V' }), 'Yura V');
  assert.equal(userDisplayName({ UserEmail: 'yura@example.com' }), 'yura@example.com');
  assert.equal(userDisplayName(null), 'User');
});
