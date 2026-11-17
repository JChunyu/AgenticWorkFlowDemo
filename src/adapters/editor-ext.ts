/**
 * The single editor-state touchpoint (AD-16).
 *
 * Everything CodeMirror-shaped lives here: the field that projects blocks, the
 * widget that replaces them, and the two keys that let a cursor walk into a card.
 * Nothing leaves this file except an `Extension` and a refresh call, so `view/` and
 * `pipeline/` never learn CodeMirror exists.
 *
 * Three rules this file is careful about, all learned the hard way:
 *   - a block replacement may only come from a state field. CodeMirror rejects one
 *     supplied by a `ViewPlugin` (`Block decorations may not be specified via
 *     plugins`) and tears the whole editor down with a `RangeError`, so the
 *     projection is a `StateField` and the plugin is left with lifecycle only;
 *   - the state holds no DOM. Widgets are descriptors compared by block identity,
 *     and the element is built lazily in `toDOM`, so one state shared by two panes
 *     still yields one card per pane and no pane can rip a node out of the other;
 *   - the click index lives on the card element, not in a module map: the block's
 *     offsets can move under an unrelated edit while the element stays cached, so
 *     the handler resolves the identity against the document at click time.
 *
 * The CodeMirror modules are taken from the host at runtime and never bundled: they
 * ship inside Obsidian. Loading is lazy so the build's export-shape probe can load
 * `main.js` in plain Node where CodeMirror does not exist.
 */
import type * as CmState from '@codemirror/state';
import type * as CmView from '@codemirror/view';

import { type ScannedBlock, scanSentinelBlocks } from '../core/fence-scan';
import { log } from '../core/log';
import { render } from '../pipeline/render';
import { scrub } from '../pipeline/scrub';
import { enterTarget, projectEditorBlocks } from '../view/live-preview';

/** Class of the element inserted where a block was. Shell styling only (AD-15). */
export const EDITOR_CARD_CLASS = 'h5r-editor-card';

/** Marker for a card with no content, so the shell can keep it clickable. */
const EMPTY_CARD_CLASS = 'h5r-editor-card--empty';

/** Elements a card may carry that own their own clicks (a CSS-only toggle, a link). */
const CARD_CONTROL = 'input, label, button, select, textarea, summary, details, a[href]';

/**
 * A click that began on one of the card's own controls belongs to that control, not to
 * the card. Without this the editor takes the event and the card collapses into source
 * the instant someone presses the control the card was built around.
 *
 * `composedPath` and not `target`: by the time a listener outside the shadow root sees
 * the event, the browser has retargeted `target` to the host, so only the path still
 * knows the click started on a `<label>`.
 */
export function isCardControlEvent(event: Event): boolean {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  for (const node of path) {
    const element = node as Element | null;
    if (typeof element?.matches === 'function' && element.matches(CARD_CONTROL)) return true;
  }
  return false;
}

/** Block identity carried by the element itself, so a click needs no shared index. */
const CARD_BLOCK_ATTR = 'data-h5r-block';

export interface EditorExtDeps {
  /** Read at every rebuild, so the global switch needs no re-registration. */
  enabled(): boolean;
}

type Modules = {
  readonly view: typeof CmView;
  readonly state: typeof CmState;
};

let modules: Modules | null = null;
let missingReported = false;

function reportMissing(reason: string): void {
  if (missingReported) return;
  missingReported = true;
  log.warn(`editor modules unavailable, live preview stays off: ${reason}`);
}

function loadModules(): Modules | null {
  if (modules) return modules;
  try {
    const loader: NodeRequire | undefined = typeof require === 'function' ? require : undefined;
    if (!loader) {
      reportMissing('no require');
      return null;
    }
    const view = loader('@codemirror/view') as typeof CmView;
    const state = loader('@codemirror/state') as typeof CmState;
    if (
      !view?.EditorView ||
      !view?.Decoration ||
      !view?.ViewPlugin ||
      !view?.WidgetType ||
      !view?.keymap ||
      !state?.Prec ||
      !state?.StateField
    ) {
      reportMissing('incomplete module surface');
      return null;
    }
    modules = { view, state };
    return modules;
  } catch (error) {
    reportMissing(error instanceof Error ? error.message : 'require threw');
    return null;
  }
}

/** Live editors, so a settings change can force a rebuild without a reload. */
const liveViews = new Set<CmView.EditorView>();

/** Settings changed: rebuild every open editor so the switch takes effect at once. */
export function refreshEditorDecorations(): void {
  for (const view of liveViews) {
    view.dispatch({});
  }
}

/** Stamps the identity a later click resolves against the document. */
function markCard(element: HTMLElement, block: ScannedBlock): void {
  element.setAttribute(CARD_BLOCK_ATTR, block.id);
}

/**
 * One failing block must not take the rest of the editor down with it: scrub and
 * render run inside `toDOM`, which CodeMirror calls during its own DOM update, so a
 * throw here would abort that update mid-way.
 */
function cardElement(block: ScannedBlock): HTMLElement | null {
  try {
    const fragment = scrub(block.sourceText);
    if (!fragment.ok) {
      log.warn('editor: block left as source (scrub failed)', fragment.error);
      return null;
    }
    const host = render(fragment.value);
    host.element.classList.add(EDITOR_CARD_CLASS);
    /* An empty block renders as a 0-height box nobody can click back into. */
    if (block.sourceText.trim().length === 0) {
      host.element.classList.add(EMPTY_CARD_CLASS);
    }
    markCard(host.element, block);
    return host.element;
  } catch (error) {
    log.warn('editor: block left as source (render threw)', error);
    return null;
  }
}

/**
 * Degradation for a block that cannot render: the block's own fence text, still
 * clickable, so a click enters source and nothing is lost. Built from `sourceText`
 * rather than the block's offsets — those can lag behind a widget kept alive by an
 * equal `eq`, and a wrong-but-valid range would show another block's text.
 */
function sourceStandIn(view: CmView.EditorView, block: ScannedBlock): HTMLElement {
  const standIn = view.dom.ownerDocument.createElement('pre');
  standIn.className = 'h5r-editor-source';
  standIn.textContent = block.sourceText;
  markCard(standIn, block);
  return standIn;
}

export function createEditorExtension(deps: EditorExtDeps): CmState.Extension {
  const loaded = loadModules();
  if (!loaded) {
    return [];
  }

  const { EditorView, Decoration, ViewPlugin, WidgetType, keymap } = loaded.view;
  const { Prec, StateField } = loaded.state;
  type DecorationSet = CmView.DecorationSet;

  class CardWidget extends WidgetType {
    constructor(readonly block: ScannedBlock) {
      super();
    }

    /**
     * The rendered card depends on the source text alone, so equal identity means an
     * equal widget and CodeMirror keeps the node it already mounted — that is what
     * spares every unchanged block a re-render while the offsets around it move.
     */
    eq(other: CardWidget): boolean {
      return other.block.id === this.block.id && other.block.sourceText === this.block.sourceText;
    }

    toDOM(view: CmView.EditorView): HTMLElement {
      return cardElement(this.block) ?? sourceStandIn(view, this.block);
    }

    /**
     * `false` for the card itself — CodeMirror drops any event raised inside a widget
     * whose `ignoreEvent` says `true` before the editor's own handlers see it, so the
     * default would swallow the click handler below and the card would become a dead
     * rectangle. `true` for a click that started on the card's own control, which must
     * keep the click: otherwise a card with a CSS-only toggle folds into source the
     * moment it is used.
     */
    ignoreEvent(event: Event): boolean {
      return isCardControlEvent(event);
    }
  }

  function build(state: CmState.EditorState): DecorationSet {
    /* The switch is checked before touching the document: off means no copy. */
    if (!deps.enabled()) {
      return Decoration.none;
    }

    const docText = state.doc.toString();
    const cursorRanges = state.selection.ranges.map((range) => ({
      from: range.from,
      to: range.to,
    }));
    const blocks = projectEditorBlocks(docText, cursorRanges);
    const ranges = blocks.map((block) =>
      Decoration.replace({ block: true, widget: new CardWidget(block) }).range(block.from, block.to),
    );

    return Decoration.set(ranges, true);
  }

  const cards = StateField.define<DecorationSet>({
    create: (state) => build(state),
    update: (decorations, transaction) => {
      /* Never shuffle decorations under a composing input method. */
      if (transaction.isUserEvent('input.type.compose')) return decorations.map(transaction.changes);
      return build(transaction.state);
    },
    provide: (field) => EditorView.decorations.from(field),
  });

  /* Lifecycle only: the field owns the decorations, this keeps the refresh list. */
  const track = ViewPlugin.fromClass(
    class {
      constructor(readonly view: CmView.EditorView) {
        liveViews.add(view);
      }

      destroy(): void {
        liveViews.delete(this.view);
      }
    },
  );

  const clicks = EditorView.domEventHandlers({
    mousedown(event, view) {
      if (event.button !== 0 || view.composing || isCardControlEvent(event)) return false;

      /* No `instanceof`: in a popout window the node comes from another realm. */
      const card = (event.target as Element | null)?.closest?.(`[${CARD_BLOCK_ATTR}]`) ?? null;
      if (card === null) return false;

      const id = card.getAttribute(CARD_BLOCK_ATTR);
      if (id === null) return false;
      /* Resolved now, not at render time: the block may have moved since. */
      const block = scanSentinelBlocks(view.state.doc.toString()).find((each) => each.id === id);
      if (!block) return false;

      /* Entering the block is enough; precise line targeting is a later story. */
      event.preventDefault();
      view.dispatch({ selection: { anchor: block.from } });
      view.focus();
      return true;
    },
  });

  /**
   * Both arrows share one guard set. A switched-off plugin must leave the key alone
   * (otherwise the cursor still snaps to the fence's column 0), and a multi-cursor
   * selection must not be collapsed into a single anchor.
   */
  function enter(view: CmView.EditorView, direction: 1 | -1): boolean {
    if (!deps.enabled() || view.composing) return false;
    /* Multi-cursor and non-empty selections belong to the editor's own motion. */
    const { ranges } = view.state.selection;
    if (ranges.length > 1 || !ranges[0].empty) return false;
    const target = enterTarget(view.state.doc.toString(), view.state.selection.main.head, direction);
    if (target === null) return false;
    view.dispatch({ selection: { anchor: target } });
    view.focus();
    return true;
  }

  const arrows = keymap.of([
    { key: 'ArrowDown', run: (view) => enter(view, 1) },
    { key: 'ArrowUp', run: (view) => enter(view, -1) },
  ]);

  return [cards, track, clicks, Prec.high(arrows)];
}
