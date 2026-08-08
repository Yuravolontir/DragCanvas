import { SYSTEM_PROMPT } from './system.prompt.js';
import { inferSiteKind, describeSiteKind } from './site.kinds.js';
import { buildExampleSection } from './examples.js';
import { buildVisualBrief } from './design.presets.js';

/**
 * Assembles the system prompt for one request out of four parts:
 *   - the base prompt: which elements exist and how they are used
 *   - the kind of site: what usually belongs on this sort of page
 *   - a visual brief: palette, type scale and spacing, drawn at random
 *   - sometimes an example: a real design from this system, compressed
 *
 * Building it per request is what makes two generations differ.
 */
export async function buildSystemPrompt(userPrompt) {
    const kind = inferSiteKind(userPrompt);
    const brief = buildVisualBrief();
    const example = await buildExampleSection(kind.key);

    return {
        kind,
        brief: brief.chosen,
        systemPrompt: [SYSTEM_PROMPT, describeSiteKind(kind), brief.text, example]
            .filter(Boolean)
            .join('\n\n'),
    };
}
