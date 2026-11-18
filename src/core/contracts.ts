/**
 * The only two data contracts the pipeline stages may exchange.
 * Stages never import each other; `view` owns the sequencing.
 */

/** `{sha256前8位}:{occurrenceIndex}` — content change produces a new id. */
export type BlockId = string;

/** Output of `pipeline/detect`. */
export interface BlockDescriptor {
  readonly id: BlockId;
  readonly sourceText: string;
  /** The `<code>` element Obsidian produced for the fence. */
  readonly codeEl: HTMLElement;
  /** The `<pre>` wrapper — reused verbatim as the source-state view. */
  readonly preEl: HTMLElement;
}

export type RemovedKind =
  | 'script'
  | 'event-handler'
  | 'javascript-url'
  | 'embedded-frame'
  | 'external-reference';

export interface RemovedEntry {
  readonly kind: RemovedKind;
  /** Machine-readable label for logging; never shown to the user. */
  readonly detail: string;
}

/**
 * Output of `pipeline/scrub` — the only shape `pipeline/render` accepts.
 * A branded, non-constructible-from-string value: `render(fragment)` cannot be
 * called with raw markup.
 */
export interface SanitizedFragment {
  readonly sanitized: true;
  readonly contentHtml: string;
  readonly styles: readonly string[];
  /** Whitelisted `html`/`body` declarations migrated onto the render container. */
  readonly rootStyleSeed: string;
  readonly removed: readonly RemovedEntry[];
}

/** Output of `pipeline/render` — never attached to the document by `render`. */
export interface ShadowHost {
  readonly element: HTMLElement;
  readonly shadow: ShadowRoot;
  /** The stylesheet text the shadow root adopted, for callers that need to inspect it. */
  readonly css: string;
}
