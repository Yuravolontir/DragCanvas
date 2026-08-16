/**
 * Carries the prompt a visitor typed on the landing page through registration
 * and into the editor.
 *
 * The hero invites someone to describe their site, but generating it needs an
 * account: `POST /api/ai/generate` is behind verifyToken, it costs money per
 * call, and publishing spends the project's own Netlify token. Losing what they
 * wrote at the sign-up form would make the invitation a bait - so the sentence
 * travels with them and is waiting in the AI panel when they arrive.
 *
 * sessionStorage rather than localStorage: this belongs to one visit. A prompt
 * still sitting there in a week, silently filling the editor, would be a
 * puzzle rather than a convenience.
 */

const KEY = 'dragcanvas_pending_prompt';

/** Longer than any reasonable one-line description; guards against a paste bomb. */
const MAX_LENGTH = 500;

export function storePendingPrompt(prompt) {
  const text = String(prompt ?? '').trim().slice(0, MAX_LENGTH);
  if (!text) return;

  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    // Private mode, or storage full. The prompt is a convenience, not a
    // requirement - the visitor can retype it, so this must never throw.
  }
}

/**
 * Read the stored prompt and forget it in the same breath.
 *
 * Consuming on read is deliberate: the prompt should land in the editor once.
 * If it survived, every later visit to the editor in this tab would refill the
 * panel with an old sentence.
 */
export function consumePendingPrompt() {
  try {
    const text = sessionStorage.getItem(KEY);
    if (text) sessionStorage.removeItem(KEY);
    return text || '';
  } catch {
    return '';
  }
}
