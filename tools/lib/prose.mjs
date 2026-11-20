/**
 * The prose in `tools/demos.mjs` is markdown, because it goes into the `.md`
 * files verbatim. The screenshot and video stages need HTML, so this converts
 * the one construct those paragraphs use: inline code.
 */
export function inline(value) {
  return value.replace(/`([^`]+)`/g, (_match, code) => `<code>${code}</code>`);
}
