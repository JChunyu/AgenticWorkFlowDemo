/**
 * The stable roots an Obsidian markdown view renders into. One selector for one
 * truth: the view registry resolves a pass's root with it, and the onboarding
 * prompts resolve theirs with the same list — two lists once drifted and put the
 * prompt inside a section, where every re-render wiped it.
 */
export const VIEW_ROOT_SELECTOR = '.markdown-preview-view, .markdown-reading-view, .markdown-rendered';
