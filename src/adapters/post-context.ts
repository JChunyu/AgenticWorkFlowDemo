/**
 * The runtime shape of the markdown post-processor context fields the plugin
 * consumes. `containerEl` is present at runtime (the note's preview root) but is
 * not declared in the obsidian typings, so it is read through this one function —
 * and tested there: a typo in the property name would otherwise silently drop the
 * reading view's root and regress the whole detached-section fix.
 */
export interface PostProcessorContextLike {
  containerEl?: HTMLElement;
}

export function containerElOf(ctx: PostProcessorContextLike | undefined): HTMLElement | undefined {
  return ctx?.containerEl;
}
