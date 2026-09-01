/**
 * How a published page reports a visit.
 *
 * The endpoints a published site calls answer every origin with a wildcard,
 * because the site lives on a domain nobody knew when the server was written.
 * That answer is refused for any request carrying credentials - and
 * `navigator.sendBeacon` always carries them. The browser rejected the
 * preflight, the request never left, and no visit to any published site was
 * ever counted. It failed in the console of the person's own site, which is
 * where they found it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const exporter = fs.readFileSync(path.join(root, 'src/utils/exportToHtml.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

/** The one line in the exporter that reports a visit. */
const beaconLine = exporter.split('\n').find((line) => line.includes('fetch(analyticsUrl'));

test('a published page sends no credentials to an endpoint that answers everyone', () => {
  // The call, not the word: the comment above the replacement explains why it
  // is not used, and naming the thing you are avoiding is worth keeping.
  assert.doesNotMatch(exporter, /navigator\.sendBeacon\(/,
    'a beacon always sends credentials, and a wildcard origin may not answer one');
  assert.ok(beaconLine, 'the visit is reported by a fetch');
  assert.match(beaconLine, /credentials: 'omit'/, 'and it says so out loud');
});

test('the visit still survives somebody leaving straight away', () => {
  // The whole reason a beacon was reached for. keepalive is what keeps the
  // request alive across the navigation instead.
  assert.match(beaconLine, /keepalive: true/);
});

test('the endpoints a published site calls still answer every origin', () => {
  // The wildcard is not the bug. A published site is on a domain nobody knew
  // in advance, so there is nothing else these could answer - which is exactly
  // why the page must not ask with credentials.
  for (const route of ['/api/analytics/hit', '/api/forms/submit', '/api/subscribers/subscribe']) {
    const line = server.split('\n').find((l) => l.includes(`'${route}'`) && l.includes('cors('));
    assert.ok(line, `${route} sets its own CORS`);
    assert.match(line, /origin: '\*'/, `${route} answers any origin`);
  }
});
