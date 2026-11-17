import type { BlockId } from '../core/contracts';

export type BlockState = 'rendered' | 'source' | 'empty' | 'failed' | 'degraded';

export interface BlockRecord {
  state: BlockState;
  /** Warning notice dismissed for this view's lifetime. */
  warningDismissed: boolean;
  /** The block exceeded the budget once; its next render degrades. */
  overBudget: boolean;
}

/**
 * The only mutable state in the plugin. Keyed by `{viewId, blockId}` so two panes
 * on the same note stay independent and block state never touches the DOM or disk.
 */
export class ViewStore {
  readonly viewId: string;
  private readonly records = new Map<BlockId, BlockRecord>();

  constructor(viewId: string) {
    this.viewId = viewId;
  }

  get key(): string {
    return this.viewId;
  }

  get size(): number {
    return this.records.size;
  }

  get(blockId: BlockId): BlockRecord | undefined {
    return this.records.get(blockId);
  }

  ensure(blockId: BlockId, initial: BlockState): BlockRecord {
    const existing = this.records.get(blockId);
    if (existing) {
      return existing;
    }
    const created: BlockRecord = { state: initial, warningDismissed: false, overBudget: false };
    this.records.set(blockId, created);
    return created;
  }

  set(blockId: BlockId, record: BlockRecord): void {
    this.records.set(blockId, record);
  }

  patch(blockId: BlockId, patch: Partial<BlockRecord>): BlockRecord {
    const current = this.records.get(blockId) ?? {
      state: 'rendered' as BlockState,
      warningDismissed: false,
      overBudget: false,
    };
    const next = { ...current, ...patch };
    this.records.set(blockId, next);
    return next;
  }

  delete(blockId: BlockId): void {
    this.records.delete(blockId);
  }

  clear(): void {
    this.records.clear();
  }

  ids(): BlockId[] {
    return Array.from(this.records.keys());
  }
}

/** `{viewId}:{blockId}` — the composite key the architecture specifies. */
export function compositeKey(viewId: string, blockId: BlockId): string {
  return `${viewId}:${blockId}`;
}
