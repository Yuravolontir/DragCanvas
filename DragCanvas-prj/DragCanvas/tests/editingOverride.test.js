/**
 * Who owns Craft's editing flag.
 *
 * Two things want it off: a phone, which cannot edit, and the Preview button,
 * which is the whole of what previewing is. The first attempt drove the flag
 * both ways - "editing is on unless this is a phone" - and that quietly took
 * ownership from the button: pressing Preview on a desktop turned editing off,
 * and the viewport turned it straight back on. The button worked and was undone
 * in the same tick, which looked exactly like a button that does not press.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { editingOverride } from '../src/editor/editingOverride.js';

test('a phone takes editing down and remembers doing it', () => {
    assert.deepEqual(
        editingOverride({ phone: true, enabled: true, forcedOff: false }),
        { enabled: false, forcedOff: true }
    );
});

test('a phone that is already read-only is left alone', () => {
    assert.equal(editingOverride({ phone: true, enabled: false, forcedOff: true }), null);
});

test('Preview is not overruled', () => {
    // The regression, stated plainly: a desktop with editing off is somebody
    // pressing Preview, not a mistake to correct.
    assert.equal(editingOverride({ phone: false, enabled: false, forcedOff: false }), null);
});

test('rotating back to a tablet undoes only this override', () => {
    assert.deepEqual(
        editingOverride({ phone: false, enabled: false, forcedOff: true }),
        { enabled: true, forcedOff: false }
    );
});

test('an ordinary editing desktop is never written to', () => {
    assert.equal(editingOverride({ phone: false, enabled: true, forcedOff: false }), null);
    assert.equal(editingOverride({ phone: false, enabled: true, forcedOff: true }), null);
});

test('the phone rule wins while the phone is showing', () => {
    // Even if the flag was turned off by Preview first, arriving on a phone and
    // leaving it must not hand editing back to a screen that cannot use it.
    const onPhone = editingOverride({ phone: true, enabled: true, forcedOff: false });
    assert.equal(onPhone.enabled, false);
    assert.equal(editingOverride({ phone: true, enabled: false, forcedOff: onPhone.forcedOff }), null);
});
