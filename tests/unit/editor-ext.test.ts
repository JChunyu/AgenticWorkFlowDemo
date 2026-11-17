import { afterEach, describe, expect, it } from 'vitest';
import {
  createEditorExtension,
  isCardControlEvent,
  refreshEditorDecorations,
} from '../../src/adapters/editor-ext';

/*
 * CodeMirror is pulled through `require`, the same loader the adapter uses at
 * runtime. A normal `import` resolves the ESM build and the two copies disagree on
 * `instanceof`, which CodeMirror treats as an unrecognized extension.
 */
const cmState = require('@codemirror/state') as typeof import('@codemirror/state');
const cmView = require('@codemirror/view') as typeof import('@codemirror/view');
const { EditorState, EditorSelection } = cmState;
type EditorView = import('@codemirror/view').EditorView;

/**
 * Real CodeMirror, real decorations: the adapter is the one place the story's
 * user-visible behaviour can vanish while typecheck, unit tests and build all stay
 * green. A wrong `enabled:` wiring or a lost dispatch is caught here.
 */
const doc = 'intro\n\n```h5-renderer\n<div>a</div>\n```\n\ntail';
const cardSelector = '.h5r-editor-card';

const mounted: EditorView[] = [];

function mount(
  text: string,
  enabled: () => boolean,
  extra: import('@codemirror/state').Extension[] = [],
): { view: EditorView; parent: HTMLElement } {
  const parent = document.createElement('div');
  document.body.appendChild(parent);
  const view = new cmView.EditorView({
    state: EditorState.create({
      doc: text,
      extensions: [createEditorExtension({ enabled }), ...extra],
    }),
    parent,
  });
  mounted.push(view);
  return { view, parent };
}

const cardCount = (parent: HTMLElement): number => parent.querySelectorAll(cardSelector).length;

afterEach(() => {
  while (mounted.length > 0) {
    mounted.pop()?.destroy();
  }
  document.body.innerHTML = '';
});

describe('createEditorExtension', () => {
  it('replaces a sentinel block with a card', () => {
    const { parent } = mount(doc, () => true);

    expect(cardCount(parent)).toBe(1);
  });

  it('leaves the block as source while the cursor is inside it', () => {
    const { view, parent } = mount(doc, () => true);
    const inside = doc.indexOf('<div>');

    view.dispatch({ selection: { anchor: inside } });

    expect(cardCount(parent)).toBe(0);
  });

  it('cards nothing and clears existing cards when switched off', () => {
    let enabled = true;
    const { parent } = mount(doc, () => enabled);
    expect(cardCount(parent)).toBe(1);

    enabled = false;
    refreshEditorDecorations();

    expect(cardCount(parent)).toBe(0);
  });

  it('moves the cursor into the block when a card is clicked', () => {
    const { view, parent } = mount(doc, () => true);
    const card = parent.querySelector<HTMLElement>(cardSelector);
    expect(card).not.toBeNull();

    card?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));

    expect(view.state.selection.main.head).toBe(doc.indexOf('```h5-renderer'));
    expect(cardCount(parent)).toBe(0);
  });

  it('does not move the cursor on a right click', () => {
    const { view, parent } = mount(doc, () => true);
    const card = parent.querySelector<HTMLElement>(cardSelector);

    card?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 2 }));

    expect(view.state.selection.main.head).toBe(0);
    expect(cardCount(parent)).toBe(1);
  });

  it('re-cards a block after the cursor leaves it', () => {
    const { view, parent } = mount(doc, () => true);

    view.dispatch({ selection: { anchor: doc.indexOf('<div>') } });
    expect(cardCount(parent)).toBe(0);

    view.dispatch({ selection: { anchor: 0 } });
    expect(cardCount(parent)).toBe(1);
  });

  it('keeps the card after an unrelated edit elsewhere in the note', () => {
    const { view, parent } = mount(doc, () => true);

    view.dispatch({ changes: { from: 0, insert: 'x' } });

    expect(cardCount(parent)).toBe(1);
  });

  it('still enters the block after an edit shifted it down', () => {
    const { view, parent } = mount(doc, () => true);
    const shift = 'xx\n'.length;

    /* The element outlives the edit (equal content), so its offsets are stale. */
    view.dispatch({ changes: { from: 0, insert: 'xx\n' } });
    const card = parent.querySelector<HTMLElement>(cardSelector);
    expect(card).not.toBeNull();

    card?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));

    expect(view.state.selection.main.head).toBe(doc.indexOf('```h5-renderer') + shift);
  });

  it('walks into the block when the down arrow is pressed on the line above', () => {
    const { view, parent } = mount(doc, () => true);
    /* Line 2, the blank line: only an adjacent line may hand the cursor to a card. */
    view.dispatch({ selection: { anchor: doc.indexOf('\n\n') + 1 } });
    expect(cardCount(parent)).toBe(1);

    view.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true }),
    );

    expect(view.state.selection.main.head).toBe(doc.indexOf('```h5-renderer'));
    expect(cardCount(parent)).toBe(0);
  });

  it('walks into the block when the up arrow is pressed on the line below', () => {
    const { view, parent } = mount(doc, () => true);
    /* Line 6, the blank line under the closing fence. */
    view.dispatch({ selection: { anchor: doc.indexOf('tail') - 1 } });

    view.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', keyCode: 38, bubbles: true, cancelable: true }),
    );

    expect(view.state.selection.main.head).toBe(doc.lastIndexOf('```') + 3);
    expect(cardCount(parent)).toBe(0);
  });

  it('puts the block content, not just a box, inside the card', () => {
    const { parent } = mount(doc, () => true);
    const card = parent.querySelector<HTMLElement>(cardSelector);

    expect(card?.shadowRoot?.querySelector('.h5r-root > div')?.textContent).toBe('a');
  });

  it('leaves the arrow key to the editor while the switch is off', () => {
    const text = 'intro\n\n```h5-renderer\n<div>a</div>\n```\nafter';
    const { view } = mount(text, () => false);
    /* Past the closing fence: with the plugin on, this hand-off lands on block.to. */
    const blockEnd = text.indexOf('```\nafter') + 3;

    view.dispatch({ selection: { anchor: text.indexOf('after') + 2 } });
    view.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', keyCode: 38, bubbles: true, cancelable: true }),
    );

    expect(view.state.selection.main.head).not.toBe(blockEnd);
  });

  it('never collapses a multi-cursor selection into one range', () => {
    /* CodeMirror drops extra ranges unless the facet is on, as Obsidian has it. */
    const { view } = mount(doc, () => true, [cmState.EditorState.allowMultipleSelections.of(true)]);

    view.dispatch({
      selection: EditorSelection.create([
        EditorSelection.cursor(6),
        EditorSelection.cursor(doc.indexOf('tail')),
      ]),
    });
    expect(view.state.selection.ranges.length).toBe(2);
    view.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true }),
    );

    expect(view.state.selection.ranges.length).toBe(2);
  });

  it('gives each pane its own card when two panes share one state', () => {
    const state = EditorState.create({
      doc,
      extensions: [createEditorExtension({ enabled: () => true })],
    });
    const left = document.createElement('div');
    const right = document.createElement('div');
    document.body.append(left, right);
    mounted.push(
      new cmView.EditorView({ state, parent: left }),
      new cmView.EditorView({ state, parent: right }),
    );

    const cardLeft = left.querySelector(cardSelector);
    const cardRight = right.querySelector(cardSelector);

    /* One state, two panes: a node cached in the state would end up in only one. */
    expect(cardLeft).not.toBeNull();
    expect(cardRight).not.toBeNull();
    expect(cardLeft).not.toBe(cardRight);
  });

  it('leaves the card alone while an input method is composing', () => {
    const { view, parent } = mount(doc, () => true);
    /* A one-character typo in the info string: a rebuild would stop carding the block. */
    const typo = doc.indexOf('h5-renderer') + 'h5-renderer'.length - 1;

    view.dispatch({
      changes: { from: typo, to: typo + 1, insert: 's' },
      userEvent: 'input.type.compose',
    });
    expect(cardCount(parent)).toBe(1);

    /* Composition over: the next ordinary transaction rebuilds and drops the card. */
    view.dispatch({});
    expect(cardCount(parent)).toBe(0);
  });

  it('keeps an empty block clickable instead of a zero-height box', () => {
    const text = '```h5-renderer\n```\n\nafter';
    const { view, parent } = mount(text, () => true);
    /* The block starts at offset 0, so the cursor has to move off it first. */
    view.dispatch({ selection: { anchor: text.indexOf('after') } });
    const card = parent.querySelector<HTMLElement>(cardSelector);

    expect(card?.classList.contains('h5r-editor-card--empty')).toBe(true);

    card?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));

    expect(view.state.selection.main.head).toBe(0);
  });

  it('hands a click that started on a card control to the control', () => {
    /*
     * happy-dom does not retarget shadow-DOM events, so the browser path is exercised
     * at the decision level: the click's composed path is what reveals the `<label>`,
     * because `target` has already been retargeted to the host by then.
     */
    const path = (...nodes: Node[]): Event => ({ composedPath: () => nodes }) as unknown as Event;

    expect(isCardControlEvent(path(document.createElement('label')))).toBe(true);
    expect(isCardControlEvent(path(document.createElement('a')))).toBe(false);
    expect(isCardControlEvent(path(document.createElement('div')))).toBe(false);
    expect(isCardControlEvent(path())).toBe(false);
    /* An event without `composedPath` must not be mistaken for a control click. */
    expect(isCardControlEvent({} as Event)).toBe(false);
  });

  it('cards every sentinel block and nothing else', () => {
    const text = [
      'intro',
      '',
      '```h5-renderer',
      '<p>one</p>',
      '```',
      '',
      '```html',
      '<b>html</b>',
      '```',
      '',
      '```h5-renderer',
      '<p>two</p>',
      '```',
      '',
      '```h5-renderer',
      '<p>three</p>',
      '```',
      '',
      '> ```h5-renderer',
      '> <p>four</p>',
      '> ```',
      '',
    ].join('\n');
    const { parent } = mount(text, () => true);

    expect(cardCount(parent)).toBe(3);
  });
});
