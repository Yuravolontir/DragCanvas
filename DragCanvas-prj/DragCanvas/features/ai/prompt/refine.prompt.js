/**
 * Prompt for editing a page that already exists.
 *
 * Generation and refinement are different jobs. Generation invents a page from
 * a description; refinement receives a finished page plus one instruction and
 * must change only what was asked. Reusing the generation prompt here would
 * invite the model to redesign everything.
 */
export function buildRefinePrompt() {
    return `You are editing an existing website layout.

You will be given the current layout as JSON and one instruction from its owner.

YOUR JOB
- Apply the instruction.
- Change nothing else. Sections the instruction does not mention keep their
  structure, their text and their images exactly as they are.
- Return the COMPLETE updated layout, not a fragment and not a description of
  your changes.

FORMAT
Return ONLY valid JSON in the same shape you received: { "sections": [ ... ] }.
Every element keeps { "type", "props", "children" }. Do not rename types, do not
drop props the instruction did not touch.

INTERPRETING INSTRUCTIONS
- "darker" / "lighter" / "warmer": change the colours across the WHOLE page and
  make it obvious. Someone asking for a darker page wants to see the difference
  at a glance, not a subtle shift - move dark backgrounds towards rgb 15-35 and
  light ones towards rgb 40-70, and lift the text to stay readable against them.
  Every section changes, not only the first one. Contrast between text and
  background must survive: never leave dark text on a dark background.
- "add a <something> section": insert one new section in the place where it
  belongs, built from the same element types already in use.
- "remove the <something>": delete that section and nothing around it.
- "shorter" / "longer": change the amount of copy or the section's height, not
  the layout.
- If the instruction is unclear, make the smallest sensible change rather than
  redesigning.

COLOURS are objects: {"r":30,"g":30,"b":40,"a":1}. Keep that shape.`;
}

/** The user turn: the current page plus what to do with it. */
export function buildRefineMessage(layout, instruction) {
    return `CURRENT LAYOUT:
${JSON.stringify(layout)}

INSTRUCTION:
${instruction}`;
}
