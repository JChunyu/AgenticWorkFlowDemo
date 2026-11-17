/**
 * Block identity, defined once for both recognition entries (AD-3).
 *
 * Reading view reads a block's source from Obsidian's parsed `<code>` element;
 * the editor scans raw document text. If those two paths normalized or hashed
 * differently, the same block would get two identities and the two views could
 * never agree on "the same card" — so both call this file.
 */
import { hashSource } from './hash';

/** Line endings are the only normalization both paths need to share. */
export function normalizeSource(sourceText: string): string {
  return sourceText.replace(/\r\n?/g, '\n');
}

/**
 * `{sha256前8位}:{occurrenceIndex}` — identical source text inside one view yields
 * the same hash and is disambiguated by document order, so an edit to a block's
 * content naturally becomes a new block.
 */
export function blockId(sourceText: string, occurrenceIndex: number): string {
  return `${hashSource(normalizeSource(sourceText))}:${occurrenceIndex}`;
}
