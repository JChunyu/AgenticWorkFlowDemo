import type { RemovedEntry, SanitizedFragment } from '../../core/contracts';
import { ErrorCode, fail, ok, type Result } from '../../core/errors';
import { cleanCss, cleanInlineStyle } from './css';

/**
 * The single gate HTML passes through. Every strip rule lives here and nowhere
 * else; `render` cannot accept a raw string, so there is no second path in.
 */

const FORBIDDEN_TAGS = 'script, link, iframe, object, embed, base, meta, frame, frameset, applet';

const FORBIDDEN_KIND: Record<string, RemovedEntry['kind']> = {
  script: 'script',
  link: 'external-reference',
  iframe: 'embedded-frame',
  object: 'embedded-frame',
  embed: 'embedded-frame',
  frame: 'embedded-frame',
  frameset: 'embedded-frame',
  applet: 'embedded-frame',
  base: 'external-reference',
  meta: 'external-reference',
};

/** Attributes that make the browser fetch something the moment the card renders. */
const RESOURCE_ATTRIBUTES = new Set(['src', 'srcset', 'poster', 'xlink:href', 'background', 'ping', 'data']);

/** Attributes that only act when the reader clicks, so plain http links stay useful. */
const NAVIGATION_ATTRIBUTES = new Set(['href', 'action', 'formaction']);

const SCRIPT_SCHEMES = ['javascript:', 'vbscript:', 'data:text/html'];

/**
 * Every Unicode control character. Written as a property class so the file carries no
 * literal control escape: `javascript:` split by a newline or a NUL is still a script.
 */
const CONTROL_CHARACTERS = /\p{Cc}/gu;

function normalizeUrl(value: string): string {
  return value.trim().toLowerCase().replace(CONTROL_CHARACTERS, '');
}

function isScriptUrl(value: string): boolean {
  const normalized = normalizeUrl(value);
  return SCRIPT_SCHEMES.some((scheme) => normalized.startsWith(scheme));
}

/**
 * Resource attributes must not survive unless they are self-contained: anything
 * that would trigger a request breaks the zero-network promise (NFR4 / FR17).
 */
function isRemoteResource(value: string): boolean {
  const normalized = normalizeUrl(value);
  if (normalized.length === 0) {
    return false;
  }
  /* `data:` is self-contained and `#fragment` only points inside the same card. */
  return !normalized.startsWith('data:') && !normalized.startsWith('#');
}

function stripForbiddenElements(root: ParentNode, removed: RemovedEntry[]): void {
  for (const element of Array.from(root.querySelectorAll(FORBIDDEN_TAGS))) {
    const tag = element.tagName.toLowerCase();
    removed.push({ kind: FORBIDDEN_KIND[tag] ?? 'external-reference', detail: `<${tag}>` });
    element.remove();
  }
}

function scrubAttributes(root: ParentNode, removed: RemovedEntry[]): void {
  for (const element of Array.from(root.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();

      if (name.startsWith('on')) {
        removed.push({ kind: 'event-handler', detail: name });
        element.removeAttribute(attribute.name);
        continue;
      }

      if (name === 'style') {
        const cleaned = cleanInlineStyle(attribute.value);
        removed.push(...cleaned.removed);
        if (cleaned.removed.length === 0) {
          continue;
        }
        element.setAttribute(attribute.name, cleaned.value);
        continue;
      }

      if (RESOURCE_ATTRIBUTES.has(name)) {
        if (isScriptUrl(attribute.value)) {
          removed.push({ kind: 'javascript-url', detail: name });
          element.removeAttribute(attribute.name);
          continue;
        }
        if (isRemoteResource(attribute.value)) {
          removed.push({ kind: 'external-reference', detail: `${name}=${attribute.value.slice(0, 40)}` });
          element.removeAttribute(attribute.name);
        }
        continue;
      }

      if (NAVIGATION_ATTRIBUTES.has(name) && isScriptUrl(attribute.value)) {
        removed.push({ kind: 'javascript-url', detail: name });
        element.removeAttribute(attribute.name);
      }
    }
  }
}

/** Moves every `<style>` block out of the markup and into the card's own stylesheet. */
function extractStyles(
  root: ParentNode,
  styles: string[],
  rootDeclarations: string[],
  removed: RemovedEntry[],
): void {
  for (const styleEl of Array.from(root.querySelectorAll('style'))) {
    const cleaned = cleanCss(styleEl.textContent ?? '');
    removed.push(...cleaned.removed);
    if (cleaned.css.trim().length > 0) {
      styles.push(cleaned.css);
    }
    if (cleaned.rootDeclarations.trim().length > 0) {
      rootDeclarations.push(cleaned.rootDeclarations);
    }
    styleEl.remove();
  }
}

/**
 * `sourceText` is the code block's `textContent` — already decoded by Obsidian's
 * own parser, so no markdown parsing happens here.
 */
export function scrub(sourceText: string): Result<SanitizedFragment> {
  if (typeof DOMParser === 'undefined') {
    return fail(ErrorCode.ParseFailed, 'no-dom');
  }

  try {
    /*
     * A `DOMParser` document is inert: nothing renders, no subresource loads and no
     * handler fires, so the string is never "live" and the note's DOM is never the
     * parse target. Nothing escapes this function before stripForbiddenElements /
     * extractStyles / scrubAttributes have run, and `render` only accepts the result.
     */
    const parsed = new DOMParser().parseFromString(sourceText, 'text/html');
    /* `<link>`, `<meta>` and a leading `<style>` are hoisted into `<head>`, so both
     * halves are scrubbed; only the body becomes the card. */
    const scopes: ParentNode[] = parsed.head ? [parsed.head, parsed.body] : [parsed.body];

    const removed: RemovedEntry[] = [];
    const styles: string[] = [];
    const rootDeclarations: string[] = [];

    for (const scope of scopes) {
      stripForbiddenElements(scope, removed);
      extractStyles(scope, styles, rootDeclarations, removed);
      scrubAttributes(scope, removed);
    }

    const fragment: SanitizedFragment = {
      sanitized: true,
      /* Read back through the serializer; no markup is ever assigned to `innerHTML`. */
      contentHtml: parsed.body.innerHTML,
      styles,
      rootStyleSeed: rootDeclarations.join(';'),
      removed,
    };
    return ok(fragment);
  } catch (error) {
    return fail(ErrorCode.ParseFailed, error instanceof Error ? error.message : 'scrub-error');
  }
}
