import { describe, expect, it } from 'vitest';
import { compositeKey, ViewStore } from '../../src/view/store';

describe('per-view store', () => {
  it('seeds a block with the configured default and keeps it', () => {
    const store = new ViewStore('view-1');

    const first = store.ensure('abc:0', 'source');
    const second = store.ensure('abc:0', 'rendered');

    expect(first.state).toBe('source');
    expect(second).toBe(first);
    expect(store.size).toBe(1);
  });

  it('patches without losing untouched fields', () => {
    const store = new ViewStore('view-1');
    store.ensure('abc:0', 'rendered');

    const record = store.patch('abc:0', { overBudget: true });

    expect(record).toEqual({ state: 'rendered', warningDismissed: false, overBudget: true });
  });

  it('keeps two views on the same note fully independent', () => {
    const paneA = new ViewStore('view-1');
    const paneB = new ViewStore('view-2');

    paneA.ensure('abc:0', 'rendered');
    paneA.patch('abc:0', { state: 'source' });
    paneB.ensure('abc:0', 'rendered');

    expect(paneA.get('abc:0')?.state).toBe('source');
    expect(paneB.get('abc:0')?.state).toBe('rendered');
  });

  it('composes the documented composite key', () => {
    expect(compositeKey('view-7', 'deadbeef:1')).toBe('view-7:deadbeef:1');
  });

  it('clears on teardown', () => {
    const store = new ViewStore('view-1');
    store.ensure('abc:0', 'rendered');

    store.clear();

    expect(store.size).toBe(0);
    expect(store.ids()).toEqual([]);
  });
});
