/**
 * Editor-state orchestration, expressed as pure projection (AD-17/AD-18).
 *
 * Two decisions live here rather than inside the CodeMirror layer, because they are
 * the story's rules and must be testable without an editor:
 *   1. which blocks are carded right now (`projectEditorBlocks`);
 *   2. where an arrow key should land when it walks into a card (`enterTarget`).
 *
 * The adapter only translates: it reads the document and cursor, asks these
 * functions, and builds decorations from the answer.
 */
import { type ScannedBlock, scanSentinelBlocks } from '../core/fence-scan';

/** A cursor position or selection, in document offsets. */
export interface TextRange {
  readonly from: number;
  readonly to: number;
}

export interface ProjectOptions {
  /** The global switch. `false` must behave exactly as if the plugin were absent. */
  readonly enabled?: boolean;
}

function intersects(block: ScannedBlock, range: TextRange): boolean {
  return range.from <= block.to && range.to >= block.from;
}

/**
 * Returns the blocks that should be replaced by a card right now.
 *
 * A block yields to source when any cursor position or selection touches it: a
 * collapsed cursor inside the block, an endpoint on either fence line, or a
 * selection that merely spans it. Showing source in all of those cases is the
 * conservative reading — hidden text must never be selected or typed over.
 */
export function projectEditorBlocks(
  docText: string,
  cursorRanges: readonly TextRange[],
  options: ProjectOptions = {},
): ScannedBlock[] {
  if (options.enabled === false) {
    return [];
  }

  const blocks = scanSentinelBlocks(docText);
  if (cursorRanges.length === 0) {
    return blocks;
  }
  return blocks.filter((block) => !cursorRanges.some((range) => intersects(block, range)));
}

/** 1-based line number of a document offset. */
function lineNumberAt(docText: string, offset: number): number {
  let line = 1;
  const limit = Math.min(offset, docText.length);
  for (let index = 0; index < limit; index += 1) {
    if (docText.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

/**
 * Where an arrow key should place the cursor when the next line is a card.
 *
 * A replaced block is unreachable by keyboard, so the adapter binds these two keys.
 * The move only takes over when the card is on the very next line; anything else
 * returns `null` and the editor keeps its default behaviour.
 *
 * Landing points are the nearest boundary of the block: down → `from` (opening
 * fence), up → `to` (closing fence). Landing inside the content is Story 7.2.
 */
export function enterTarget(
  docText: string,
  cursorHead: number,
  direction: 1 | -1,
): number | null {
  if (docText.length === 0) {
    return null;
  }

  const cursorLine = lineNumberAt(docText, cursorHead);

  for (const block of scanSentinelBlocks(docText)) {
    const startLine = lineNumberAt(docText, block.from);
    const endLine = lineNumberAt(docText, block.to);
    if (direction === 1 && startLine === cursorLine + 1) {
      return block.from;
    }
    if (direction === -1 && endLine === cursorLine - 1) {
      return block.to;
    }
  }

  return null;
}
