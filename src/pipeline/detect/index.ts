import type { BlockDescriptor } from '../../core/contracts';
import { hashSource } from '../../core/hash';
import { SENTINEL_FENCE } from '../../core/settings';

const SENTINEL_CLASS = `language-${SENTINEL_FENCE}`;

const VIEW_ROOT_SELECTOR = '.markdown-preview-view, .markdown-reading-view, .markdown-rendered';
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
  if (!(codeEl instanceof HTMLElement)) return false;
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
  return ancestor instanceof HTMLElement ? ancestor : codeEl;
}

function resolveScope(el: HTMLElement): ParentNode {
  return el.closest(VIEW_ROOT_SELECTOR) ?? el;
}

function sentinelCodeElements(scope: ParentNode): HTMLElement[] {
  return Array.from(scope.querySelectorAll('code')).filter(isSentinelCode) as HTMLElement[];
}

/**
 * Collects sentinel blocks inside the post-processor element.
 *
 * Ids are `{hash}:{occurrenceIndex}` where the index counts earlier blocks with an
 * identical source inside the same view root, so the id survives re-renders and a
 * content edit naturally becomes a fresh block.
 */
export function collect(el: HTMLElement): BlockDescriptor[] {
  if (!el.isConnected && el.parentElement === null) {
    return [];
  }
  if (el.closest(LIVE_PREVIEW_SELECTOR)) {
    return [];
  }

  const scope = resolveScope(el);
  const all = sentinelCodeElements(scope);
  const seen = new Map<string, number>();
  const descriptors: BlockDescriptor[] = [];

  for (const codeEl of all) {
    const sourceText = codeEl.textContent ?? '';
    const hash = hashSource(sourceText);
    const occurrenceIndex = seen.get(hash) ?? 0;
    seen.set(hash, occurrenceIndex + 1);

    if (!el.contains(codeEl)) {
      continue;
    }
    /* Already owned by a previous pass: never double-wrap. */
    if (codeEl.closest(`.${BLOCK_WRAPPER_CLASS}`)) {
      continue;
    }
    descriptors.push({
      id: `${hash}:${occurrenceIndex}`,
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
