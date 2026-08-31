/**
 * Whether the viewport should force Craft's editing flag, and which way.
 *
 * `options.enabled` has an owner already: the Preview button in the Header
 * toggles it, and that is the whole of what Preview means. A phone needs it off
 * as well - a device that cannot edit should not be pretending to - and the
 * first version of that drove the flag both ways, `enabled === !phone`. On a
 * desktop that reads as "editing must be on", so pressing Preview turned it off
 * and this turned it straight back: the button worked and was undone in the
 * same tick, which from the outside looked like a button that did not press.
 *
 * So the rule is one-directional. A phone forces the flag off and remembers
 * doing so; leaving the phone undoes only that forcing. Anything else holding
 * the flag is left alone.
 *
 * Pure, and separate from the component, because the fault was in the rule
 * rather than in React - a rule can be read, argued with, and tested.
 *
 * @param {object} state
 * @param {boolean} state.phone      the viewport is a phone
 * @param {boolean} state.enabled    Craft's current options.enabled
 * @param {boolean} state.forcedOff  this override is what turned it off
 * @returns {{enabled: boolean, forcedOff: boolean} | null} null to write nothing
 */
export function editingOverride({ phone, enabled, forcedOff }) {
  // A phone cannot edit. Take the flag down and record that it was us.
  if (phone && enabled) return { enabled: false, forcedOff: true };

  // Back on a real screen, and the only reason editing is off is that a phone
  // was showing this a moment ago. Hand it back.
  if (!phone && forcedOff && !enabled) return { enabled: true, forcedOff: false };

  // Everything else: somebody else's flag, or already where it should be.
  return null;
}
