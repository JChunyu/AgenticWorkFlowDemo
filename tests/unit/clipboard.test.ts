import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeClipboard } from '../../src/adapters/clipboard';
import { createCopyFallback, createInlineMessage } from '../../src/view/shell';

function stubClipboard(value: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

describe('clipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports success when the browser accepts the write', async () => {
    stubClipboard({ writeText: async () => undefined });

    await expect(writeClipboard('card')).resolves.toBe(true);
  });

  it('reports failure instead of throwing when permission is missing', async () => {
    stubClipboard({
      writeText: async () => {
        throw new Error('denied');
      },
    });

    await expect(writeClipboard('card')).resolves.toBe(false);
  });

  it('reports failure when there is no clipboard at all', async () => {
    stubClipboard(undefined);

    await expect(writeClipboard('card')).resolves.toBe(false);
  });
});

describe('degraded surfaces stay inline', () => {
  it('offers a selectable textarea instead of a modal', () => {
    const box = createCopyFallback({ lang: 'zh', text: 'card text', onClose: () => undefined });

    expect(box.tagName).toBe('DIV');
    expect(box.querySelector('textarea')?.value).toBe('card text');
    expect(box.querySelector('textarea')?.readOnly).toBe(true);
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('explains a read-only vault in one line with one action', () => {
    const box = createInlineMessage({
      lang: 'zh',
      text: 'read only',
      actionLabel: 'copy',
      onAction: () => undefined,
      onClose: () => undefined,
    });

    expect(box.querySelectorAll('.h5r-onboarding__action')).toHaveLength(1);
    expect(box.textContent).toContain('read only');
  });
});
