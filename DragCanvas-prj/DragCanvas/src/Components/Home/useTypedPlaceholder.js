import { useEffect, useState } from 'react';

/**
 * Types example prompts into the input's placeholder, one character at a time.
 *
 * The point is to answer "what am I supposed to write here?" without a wall of
 * instructions. Examples that appear letter by letter get read; a static list
 * above the box does not.
 *
 * It stops the instant it stops being helpful - the moment the visitor focuses
 * the field or types anything - because a placeholder that keeps rewriting
 * itself under someone who is trying to think is a distraction, and under
 * someone using a screen reader it is noise. It never starts at all when
 * reduced motion is asked for.
 */

const TYPE_MS = 45;
const DELETE_MS = 22;
const HOLD_MS = 1800;

export function useTypedPlaceholder(examples, { enabled = true } = {}) {
  const [text, setText] = useState('');

  useEffect(() => {
    // Nothing to schedule when the animation is off. The hook returns an empty
    // string for that case below rather than clearing state here: writing state
    // synchronously in an effect body only causes a second render to undo the
    // first one.
    if (!enabled || examples.length === 0) return undefined;

    let exampleIndex = 0;
    let charCount = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const example = examples[exampleIndex];

      if (!deleting) {
        charCount += 1;
        setText(example.slice(0, charCount));

        if (charCount === example.length) {
          deleting = true;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
        return;
      }

      charCount -= 1;
      setText(example.slice(0, charCount));

      if (charCount === 0) {
        deleting = false;
        exampleIndex = (exampleIndex + 1) % examples.length;
      }
      timer = setTimeout(tick, DELETE_MS);
    };

    timer = setTimeout(tick, TYPE_MS);
    return () => clearTimeout(timer);
  }, [examples, enabled]);

  return enabled ? text : '';
}
