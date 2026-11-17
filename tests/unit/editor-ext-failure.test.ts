import { afterEach, describe, expect, it, vi } from 'vitest';

/*
 * `render` is made to fail on one block on purpose: the failure path is the branch
 * that decides whether a note stays readable, and it cannot be reached by picking a
 * clever input — `scrub` already guarantees a well-formed fragment.
 */
vi.mock('../../src/pipeline/render', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/pipeline/render')>();
  return {
    ...actual,
    render(fragment: Parameters<typeof actual.render>[0]) {
      if (fragment.contentHtml.includes('BOOM')) throw new Error('render exploded');
      return actual.render(fragment);
    },
  };
});

import { createEditorExtension } from '../../src/adapters/editor-ext';

const cmState = require('@codemirror/state') as typeof import('@codemirror/state');
const cmView = require('@codemirror/view') as typeof import('@codemirror/view');
const { EditorState } = cmState;
type EditorView = import('@codemirror/view').EditorView;

const doc =
  'intro\n\n```h5-renderer\n<div>ok</div>\n```\n\n```h5-renderer\n<div>BOOM</div>\n```\n';

const mounted: EditorView[] = [];

function mount(text: string): { view: EditorView; parent: HTMLElement } {
  const parent = document.createElement('div');
  document.body.appendChild(parent);
  const view = new cmView.EditorView({
    state: EditorState.create({ doc: text, extensions: [createEditorExtension({ enabled: () => true })] }),
    parent,
  });
  mounted.push(view);
  return { view, parent };
}

const count = (parent: HTMLElement, selector: string): number =>
  parent.querySelectorAll(selector).length;

afterEach(() => {
  while (mounted.length > 0) {
    mounted.pop()?.destroy();
  }
  document.body.innerHTML = '';
});

describe('a block that cannot render', () => {
  it('falls back to its own source and leaves the other cards standing', () => {
    const { parent } = mount(doc);

    expect(count(parent, '.h5r-editor-card')).toBe(1);
    const standIn = parent.querySelector<HTMLElement>('.h5r-editor-source');
    expect(standIn).not.toBeNull();
    /* The block's own text, so nothing is lost while it cannot render a card. */
    expect(standIn?.textContent).toBe('<div>BOOM</div>');
  });

  it('lets a click on the stand-in reach the source', () => {
    const { view, parent } = mount(doc);
    const standIn = parent.querySelector<HTMLElement>('.h5r-editor-source');

    standIn?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));

    expect(view.state.selection.main.head).toBe(doc.lastIndexOf('```h5-renderer'));
    expect(count(parent, '.h5r-editor-source')).toBe(0);
    expect(count(parent, '.h5r-editor-card')).toBe(1);
  });
});
