import type { BlockDescriptor } from '../../core/contracts';
import { hashSource } from '../../core/hash';
import { SENTINEL_FENCE } from '../../core/settings';

const SENTINEL_CLASS = `language-${SENTINEL_FENCE}`;

const VIEW_ROOT_SELECTOR = '.markdown-preview-view, .markdown-reading-view, .markdown-rendered';
const LIVE_PREVIEW_SELECTOR = '.cm-editor';

/** Wrapper class used by `view`; blocks already owned are never re-collected. */
export const BLOCK_WRAPPER_CLASS = 'h5r-block';

function isSentinelCode(codeEl: Element): boolean {
  if (!(codeEl instanceof HTMLElement)) return false;
  if (codeEl.tagName !== 'CODE') return false;
  if (!codeEl.classList.contains(SENTINEL_CLASS)) return false;
  if (!(codeEl.parentElement instanceof HTMLElement)) return false;
  if (codeEl.parentElement.tagName !== 'PRE') return false;
  return true;
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
    const preEl = codeEl.parentElement;
    if (!preEl) {
      continue;
    }
    descriptors.push({
      id: `${hash}:${occurrenceIndex}`,
      sourceText,
      codeEl,
      preEl,
    });
  }

  return descriptors;
}

/** True when the post-processor element contains a native ```html block. */
export function containsPlainHtmlBlock(el: HTMLElement): boolean {
  const codes = Array.from(el.querySelectorAll('code.language-html'));
  return codes.some((code) => !code.closest(`.${BLOCK_WRAPPER_CLASS}`));
}
