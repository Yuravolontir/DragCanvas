import test from 'node:test';
import assert from 'node:assert/strict';
import { slotsFor } from '../features/bookings/booking.ctrl.js';

test('booking slots follow the configured IANA timezone', () => {
  const settings = { TimeZone: 'Asia/Jerusalem', StartHour: 9, EndHour: 11, Duration: 60 };
  assert.deepEqual(slotsFor('2026-01-15', settings).map(date => date.toISOString()), [
    '2026-01-15T07:00:00.000Z',
    '2026-01-15T08:00:00.000Z',
  ]);
});

test('booking slots account for daylight-saving time', () => {
  const settings = { TimeZone: 'Europe/Berlin', StartHour: 9, EndHour: 10, Duration: 60 };
  assert.equal(slotsFor('2026-01-15', settings)[0].toISOString(), '2026-01-15T08:00:00.000Z');
  assert.equal(slotsFor('2026-07-15', settings)[0].toISOString(), '2026-07-15T07:00:00.000Z');
});

test('booking slots skip a local time that does not exist during DST change', () => {
  const settings = { TimeZone: 'Europe/Berlin', StartHour: 2, EndHour: 3, Duration: 60 };
  assert.deepEqual(slotsFor('2026-03-29', settings), []);
});
