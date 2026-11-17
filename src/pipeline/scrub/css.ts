import type { RemovedEntry } from '../../core/contracts';

/**
 * CSS is a network vector (`@import`, `url()`) and a containment risk
 * (`body`/`html` rules). This module neutralises both while leaving every other
 * rule byte-identical so authors keep full control inside the shadow root.
 */

/** Properties carried over from `html`/`body`/`:root` onto the render container. */
const ROOT_STYLE_WHITELIST = new Set(['font-family', 'font-size', 'line-height', 'color', 'text-align']);

const ROOT_SELECTORS = new Set(['html', 'body', ':root']);

interface Piece {
  readonly kind: 'rule' | 'at' | 'text';
  readonly prelude: string;
  readonly body: string;
}

export interface CleanCssResult {
  readonly css: string;
  /** `prop:value;prop:value` harvested from root selectors, `!important` stripped. */
  readonly rootDeclarations: string;
  readonly removed: RemovedEntry[];
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripImports(css: string, removed: RemovedEntry[]): string {
  return css.replace(/@import\b\s*[^;]*;?/gi, (match) => {
    removed.push({ kind: 'external-reference', detail: match.trim().slice(0, 60) });
    return '';
  });
}

function neutraliseUrls(css: string, removed: RemovedEntry[]): string {
  return css.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi, (match, _quote: string, target: string) => {
    const value = String(target).trim();
    if (value.toLowerCase().startsWith('data:')) {
      return match;
    }
    removed.push({ kind: 'external-reference', detail: value.slice(0, 60) });
    return 'none';
  });
}

function splitDeclarations(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of body) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === ';' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) {
    parts.push(current);
  }
  return parts;
}

function harvestRootDeclarations(body: string): string {
  const kept: string[] = [];
  for (const declaration of splitDeclarations(body)) {
    const separator = declaration.indexOf(':');
    if (separator < 0) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    if (!ROOT_STYLE_WHITELIST.has(property)) continue;
    const value = declaration
      .slice(separator + 1)
      .replace(/!\s*important/gi, '')
      .trim();
    if (value.length === 0) continue;
    kept.push(`${property}:${value}`);
  }
  return kept.join(';');
}

function tokenize(css: string): Piece[] {
  const pieces: Piece[] = [];
  let index = 0;
  let textStart = 0;

  while (index < css.length) {
    if (css[index] !== '{') {
      index += 1;
      continue;
    }
    const prelude = css.slice(textStart, index).trim();
    let depth = 1;
    let cursor = index + 1;
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === '{') depth += 1;
      else if (css[cursor] === '}') depth -= 1;
      cursor += 1;
    }
    const body = css.slice(index + 1, Math.max(index + 1, cursor - 1));
    pieces.push({ kind: prelude.startsWith('@') ? 'at' : 'rule', prelude, body });
    index = cursor;
    textStart = cursor;
  }

  const tail = css.slice(textStart).trim();
  if (tail.length > 0) {
    pieces.push({ kind: 'text', prelude: '', body: tail });
  }
  return pieces;
}

/** Strips network vectors and moves root-level typography onto the container. */
export function cleanCss(input: string): CleanCssResult {
  const removed: RemovedEntry[] = [];
  const withoutComments = stripComments(input);
  const withoutImports = stripImports(withoutComments, removed);
  const neutralised = neutraliseUrls(withoutImports, removed);

  const rootParts: string[] = [];
  const output: string[] = [];

  for (const piece of tokenize(neutralised)) {
    if (piece.kind === 'text') {
      output.push(piece.body);
      continue;
    }
    if (piece.kind === 'at') {
      output.push(`${piece.prelude}{${piece.body}}`);
      continue;
    }

    const selectors = piece.prelude
      .split(',')
      .map((selector) => selector.trim())
      .filter((selector) => selector.length > 0);
    const isRootRule = selectors.length > 0 && selectors.every((selector) => ROOT_SELECTORS.has(selector));

    if (isRootRule) {
      const harvested = harvestRootDeclarations(piece.body);
      if (harvested.length > 0) {
        rootParts.push(harvested);
      }
      continue;
    }

    output.push(`${piece.prelude}{${piece.body}}`);
  }

  return {
    css: output.join('\n'),
    rootDeclarations: rootParts.join(';'),
    removed,
  };
}

/** Cleans a single inline `style="..."` value; returns the new value only. */
export function cleanInlineStyle(value: string): { value: string; removed: RemovedEntry[] } {
  const removed: RemovedEntry[] = [];
  const cleaned = neutraliseUrls(value, removed);
  return { value: cleaned, removed };
}
