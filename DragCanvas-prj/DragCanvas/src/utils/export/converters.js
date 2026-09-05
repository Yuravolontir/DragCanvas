import { interactiveConverters } from './converters.interactive.js';
import { layoutConverters } from './converters.layout.js';
import { mediaConverters } from './converters.media.js';
import { sectionsConverters } from './converters.sections.js';
import { textConverters } from './converters.text.js';

/**
 * One function per element the editor can produce, keyed by the name Craft
 * saved it under.
 *
 * They are split across five files only because thirty-five of them in one
 * place is unreadable; nothing depends on which file an element lives in.
 * A new element needs an entry here, or it will silently be missing from every
 * published page - which is what tests/exportCoverage.test.js watches for.
 */
export const converters = {
  ...layoutConverters,
  ...textConverters,
  ...mediaConverters,
  ...sectionsConverters,
  ...interactiveConverters,
};
