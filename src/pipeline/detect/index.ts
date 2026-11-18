import { blockId, normalizeSource } from '../../core/block-id';
import type { BlockDescriptor } from '../../core/contracts';
import { SENTINEL_FENCE } from '../../core/settings';

const SENTINEL_CLASS = `language-${SENTINEL_FENCE}`;

const LIVE_PREVIEW_SELECTOR = '.cm-editor';

/** Wrapper class used by `view`; blocks already owned are never re-collected. */
export const BLOCK_WRAPPER_CLASS = 'h5r-block';

/**
 * Obsidian's own markup is `<pre><code class="language-x">`, but other plugins may
 * re-parent or re-tag the block, so the code element is accepted wherever it lives as
 * long as the language class is exact. `language-h5-renderer-x` is rejected: only the
 * exact class name is the sentinel.
 */
function isSentinelCode(codeEl: Element): boolean {
  /* `instanceOf` is realm aware; `instanceof` fails for a node from a popout window. */
  if (!codeEl.instanceOf(HTMLElement)) return false;
  if (codeEl.tagName !== 'CODE') return false;
  return codeEl.classList.contains(SENTINEL_CLASS);
}

/** The `<pre>` that should stay visible as the source, whatever wraps it. */
function sourceElementFor(codeEl: HTMLElement): HTMLElement {
  const parent = codeEl.parentElement;
  if (parent && parent.tagName === 'PRE') {
    return parent;
  }
  const ancestor = codeEl.closest('pre');
  return ancestor?.instanceOf(HTMLElement) ? ancestor : codeEl;
}

function sentinelCodeElements(scope: ParentNode): HTMLElement[] {
  return Array.from(scope.querySelectorAll('code')).filter(isSentinelCode);
}

/**
 * Collects sentinel blocks inside the post-processor element.
 *
 * The reading view hands a post-processor its section element *before* that element
 * is attached to the document, so the element must be scanned even while detached.
 * Occurrences are counted within this element only: sibling sections are invisible
 * during the pass that renders them (and re-appear later), so counting them would
 * make an id flap between passes. An id that survives re-renders matters more —
 * two identical blocks in different sections share an occurrence index and thus a
 * store record, which is stable and harmless.
 *
 * Ids are `{hash}:{occurrenceIndex}` where the index counts earlier blocks with an
 * identical source inside the same element, so an edit naturally becomes a new block.
 */
export function collect(el: HTMLElement): BlockDescriptor[] {
  if (el.closest(LIVE_PREVIEW_SELECTOR)) {
    return [];
  }

  const all = sentinelCodeElements(el);
  const seen = new Map<string, number>();
  const descriptors: BlockDescriptor[] = [];

  for (const codeEl of all) {
    const sourceText = normalizeSource(codeEl.textContent ?? '');
    const occurrenceIndex = seen.get(sourceText) ?? 0;
    seen.set(sourceText, occurrenceIndex + 1);

    /* Already owned by a previous pass: never double-wrap. Wrapped blocks still
     * count toward the occurrence index so a fresh twin keeps its position. */
    if (codeEl.closest(`.${BLOCK_WRAPPER_CLASS}`)) {
      continue;
    }
    descriptors.push({
      id: blockId(sourceText, occurrenceIndex),
      sourceText,
      codeEl,
      preEl: sourceElementFor(codeEl),
    });
  }

  return descriptors;
}

/** True when the post-processor element contains a native ```html block. */
export function containsPlainHtmlBlock(el: HTMLElement): boolean {
  const codes = Array.from(el.querySelectorAll('code.language-html'));
  return codes.some((code) => !code.closest(`.${BLOCK_WRAPPER_CLASS}`));
}
