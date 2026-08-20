import test from 'node:test';
import assert from 'node:assert/strict';

import { responsiveValue, responsiveVisibility, updateResponsiveDraft } from '../src/utils/responsiveProps.js';

test('responsive values inherit desktop until overridden', () => {
  const props = { width: '100%', responsive: { mobile: { width: '320px' } } };
  assert.equal(responsiveValue(props, 'tablet', 'width'), '100%');
  assert.equal(responsiveValue(props, 'mobile', 'width'), '320px');
});

test('visibility defaults to shown and can be hidden per device', () => {
  assert.equal(responsiveVisibility({}, 'mobile'), true);
  assert.equal(responsiveVisibility({ responsive: { mobile: { visible: false } } }, 'mobile'), false);
  assert.equal(responsiveVisibility({ responsive: { mobile: { visible: false } } }, 'desktop'), true);
});

test('clearing an override restores inheritance', () => {
  const props = { width: '100%', responsive: { mobile: { width: '300px' } } };
  updateResponsiveDraft(props, 'mobile', 'width', '');
  assert.equal(responsiveValue(props, 'mobile', 'width'), '100%');
});
