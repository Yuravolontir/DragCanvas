import test from 'node:test';
import assert from 'node:assert/strict';
import { pexelsQueryFromImagePrompt } from '../features/ai/ai.service.js';

test('stock fallback searches for the business and required subject, not prompt boilerplate', () => {
  const query = pexelsQueryFromImagePrompt('Create a highly relevant photograph. Website subject and business: Dental Clinic website. Page: Home. Section context: Gentle care. Required image subject or role: friendly dentist treating a patient. User request: use modern dentistry photos. The visible subject must match.');
  assert.match(query, /Dental Clinic website/i);
  assert.match(query, /friendly dentist treating a patient/i);
  assert.doesNotMatch(query, /visible subject must match/i);
  assert.ok(query.length <= 180);
});
