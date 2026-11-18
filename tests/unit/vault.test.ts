import { afterEach, describe, expect, it, vi } from 'vitest';
import { inlineHost } from '../../src/adapters/vault';

function appWith(view: unknown) {
  return { workspace: { getActiveViewOfType: () => view } } as never;
}

describe('inlineHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to the active document body when no note is open', () => {
    vi.stubGlobal('activeDocument', document);

    /* The active document, not the main one: a popout window's message must land
     * in the popout where the user is looking. */
    expect(inlineHost(appWith(null))).toBe(document.body);
  });

  it('lands in the open note when a MarkdownView is active', () => {
    vi.stubGlobal('activeDocument', document);
    const contentEl = document.createElement('div');
    const preview = document.createElement('div');
    preview.className = 'markdown-preview-view';
    contentEl.appendChild(preview);

    expect(inlineHost(appWith({ contentEl }))).toBe(preview);

    /* No preview surface (source mode): the view's own container still beats the body. */
    const bare = document.createElement('div');
    expect(inlineHost(appWith({ contentEl: bare }))).toBe(bare);
  });
});
