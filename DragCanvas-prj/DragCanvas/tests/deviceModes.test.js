import test from 'node:test';
import assert from 'node:assert/strict';

import { DEVICE_MODES, deviceModeForWidth, deviceWidth, normaliseDeviceMode } from '../src/utils/deviceModes.js';

test('editor device modes use stable preview widths', () => {
  assert.equal(DEVICE_MODES.desktop.width, 1440);
  assert.equal(DEVICE_MODES.tablet.width, 768);
  assert.equal(DEVICE_MODES.mobile.width, 390);
});

test('editor device mode follows the available interface width', () => {
  assert.equal(deviceModeForWidth(1440), 'desktop');
  assert.equal(deviceModeForWidth(900), 'tablet');
  assert.equal(deviceModeForWidth(390), 'mobile');
});

test('an unknown saved mode safely falls back to desktop', () => {
  assert.equal(normaliseDeviceMode('watch'), 'desktop');
  assert.equal(deviceWidth('watch'), 1440);
});
