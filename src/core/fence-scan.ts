/**
 * Text-level recognition of sentinel blocks (AD-3).
 *
 * Reading view recognizes blocks from Obsidian's rendered DOM; the editor has no
 * rendered DOM to read, so it scans plain document text here. Both entries agree on
 * what a sentinel block is, and both derive identity through `core/block-id`.
 *
 * The rules deliberately mirror CommonMark's fenced-code rules, because that is
 * what decides whether reading view shows a code block at all:
 *   - a fence may be indented at most 3 spaces (4+ makes it an indented code block);
 *   - the info string's first word is the language, so `h5-renderer foo` is a sentinel;
 *   - a closing fence carries nothing after the marker, and must be at least as long;
 *   - an unclosed fence runs to the next bare fence, or is dropped at end of document.
 *
 * Pure: no DOM, no Obsidian, no module state.
 */
import { blockId } from './block-id';
import { SENTINEL_FENCE } from './settings';

/** One sentinel block located in the document text, in document order. */
export interface ScannedBlock {
  /** Same identity reading view computes, via `core/block-id`. */
  readonly id: string;
  /** Offset of the opening fence line's first character. */
  readonly from: number;
  /** Offset just past the closing fence line's last character. */
  readonly to: number;
  /** Inner text, with the fence's own indentation removed. */
  readonly sourceText: string;
}

interface Line {
  readonly start: number;
  /** End of the visible text: before `\r` in a CRLF document. */
  readonly end: number;
  readonly text: string;
}

/** At most three leading spaces; a tab or a deeper indent is an indented code block. */
const FENCE_OPEN = /^( {0,3})(`{3,}|~{3,})(.*)$/;

/** A closing fence carries nothing after the marker. */
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

function splitLines(docText: string): Line[] {
  const lines: Line[] = [];
  let start = 0;

  for (let index = 0; index <= docText.length; index += 1) {
    const atEnd = index === docText.length;
    if (!atEnd && docText.charCodeAt(index) !== 10) continue;

    const raw = docText.slice(start, index);
    const text = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    lines.push({ start, end: start + text.length, text });
    start = index + 1;
  }

  return lines;
}

/** First word of the info string — the same token Obsidian turns into a language class. */
function isSentinelInfo(info: string): boolean {
  const [first] = info.trim().split(/\s+/);
  return first === SENTINEL_FENCE;
}

function findClosingLine(lines: readonly Line[], from: number, marker: string): number {
  const fenceChar = marker[0];
  for (let index = from; index < lines.length; index += 1) {
    const match = FENCE_CLOSE.exec(lines[index].text);
    if (!match) continue;
    if (match[1][0] !== fenceChar || match[1].length < marker.length) continue;
    return index;
  }
  return -1;
}

/** Removes the fence's own indentation so `sourceText` matches reading view's text. */
function dedent(text: string, width: number): string {
  if (width === 0) return text;
  let strip = 0;
  while (strip < width && text.charCodeAt(strip) === 32) strip += 1;
  return text.slice(strip);
}

/**
 * Scans document text for sentinel blocks.
 *
 * Aliases (`h5`, `h5-renderer-x`), wrong case, tab- or 4-space-indented fences, and
 * fences sharing a line with prose are ignored silently: an unrecognized block must
 * not flash, report, or half-render.
 */
export function scanSentinelBlocks(docText: string): ScannedBlock[] {
  if (docText.length === 0) {
    return [];
  }

  const lines = splitLines(docText);
  const blocks: ScannedBlock[] = [];
  const seen = new Map<string, number>();
  let index = 0;

  while (index < lines.length) {
    const opening = FENCE_OPEN.exec(lines[index].text);
    if (!opening) {
      index += 1;
      continue;
    }

    /* CommonMark: a backtick fence's info string may not contain a backtick. */
    if (opening[2][0] === '`' && opening[3].includes('`')) {
      index += 1;
      continue;
    }

    if (!isSentinelInfo(opening[3])) {
      /*
       * Any other fence owns the lines up to its own closing fence: a sentinel fence
       * written inside a ```md example is code the reader sees verbatim, not a card.
       * Skipping the whole block keeps the two recognition entries agreeing.
       */
      const close = findClosingLine(lines, index + 1, opening[2]);
      index = close < 0 ? lines.length : close + 1;
      continue;
    }

    const closingIndex = findClosingLine(lines, index + 1, opening[2]);
    if (closingIndex < 0) {
      /* Still unclosed at the end of the document: drop it. */
      index += 1;
      continue;
    }

    const indent = opening[1].length;
    const sourceText = lines
      .slice(index + 1, closingIndex)
      .map((line) => dedent(line.text, indent))
      .join('\n');

    const occurrence = seen.get(sourceText) ?? 0;
    seen.set(sourceText, occurrence + 1);

    blocks.push({
      id: blockId(sourceText, occurrence),
      from: lines[index].start,
      to: lines[closingIndex].end,
      sourceText,
    });
    index = closingIndex + 1;
  }

  return blocks;
}
