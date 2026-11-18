import type { Lang } from '../core/i18n';
import type { Settings } from '../core/settings';
import { VIEW_ROOT_SELECTOR } from '../core/view-root';
import { collect } from '../pipeline/detect';
import { BlockController, type ReconcilerDeps } from './reconciler';
import { ViewStore } from './store';

export interface ViewDeps {
  settings(): Settings;
  lang(): Lang;
  now?: () => number;
}

/**
 * One instance per open view root. Holds the per-view store and every block
 * controller, so two panes on the same note never share a block's state.
 */
export class PreviewView {
  readonly store: ViewStore;
  private readonly controllers = new Map<HTMLElement, BlockController>();
  private readonly deps: ViewDeps;
  /** The stable root the blocks live under — the note's preview, the embed, … */
  private readonly root: HTMLElement;

  constructor(viewId: string, root: HTMLElement, deps: ViewDeps) {
    this.store = new ViewStore(viewId);
    this.root = root;
    this.deps = deps;
  }

  get blockCount(): number {
    return this.controllers.size;
  }

  /** The registry keys its root map by this element. */
  get rootEl(): HTMLElement {
    return this.root;
  }

  /**
   * True once the root has left the document — the leaf is closed. A block's own
   * detachment is NOT a signal: the reading view's virtual scrolling detaches whole
   * sections on scroll and re-attaches them later, card included.
   */
  get isDetached(): boolean {
    return !this.root.isConnected;
  }

  process(el: HTMLElement): void {
    if (!this.deps.settings().enabled) {
      return;
    }

    this.sweepOrphaned();
    const descriptors = collect(el);

    for (const descriptor of descriptors) {
      const existing = this.controllers.get(descriptor.preEl);
      if (existing) {
        if (existing.blockId === descriptor.id) {
          existing.refresh();
          continue;
        }
        existing.destroy(true);
        this.controllers.delete(descriptor.preEl);
      }

      const controller = new BlockController(descriptor, this.reconcilerDeps());
      controller.mount();
      if (controller.isMounted) {
        this.controllers.set(descriptor.preEl, controller);
      }
    }
  }

  /** Theme change or settings change: repaint every block from the store. */
  refresh(): void {
    if (!this.deps.settings().enabled) {
      this.teardown(true);
      return;
    }
    this.sweepOrphaned();
    for (const controller of this.controllers.values()) {
      controller.refresh();
    }
  }

  teardown(restore: boolean): void {
    for (const controller of this.controllers.values()) {
      controller.destroy(restore);
    }
    this.controllers.clear();
    this.store.clear();
  }

  /** Drops blocks whose wrapper Obsidian wiped out (a section being re-rendered). */
  private sweepOrphaned(): void {
    for (const [preEl, controller] of Array.from(this.controllers)) {
      if (controller.isOrphaned) {
        controller.destroy(false);
        this.controllers.delete(preEl);
      }
    }
  }

  private reconcilerDeps(): ReconcilerDeps {
    return {
      store: this.store,
      settings: () => this.deps.settings(),
      lang: () => this.deps.lang(),
      now: this.deps.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now())),
    };
  }
}

/** Resolves the stable view root so one note open twice yields two independent views. */
export class ViewRegistry {
  private roots = new WeakMap<Element, PreviewView>();
  private readonly live: PreviewView[] = [];
  private sequence = 0;
  private readonly deps: ViewDeps;
  private pruneScheduled = false;

  constructor(deps: ViewDeps) {
    this.deps = deps;
  }

  /**
   * `containerEl` is the post-processor context's container: the reading view supplies
   * the note's preview sizer, which is the one stable root for a pass whose section
   * elements are still detached.
   */
  resolve(el: HTMLElement, containerEl?: HTMLElement): PreviewView {
    this.schedulePrune();
    const root =
      containerEl?.closest<HTMLElement>(VIEW_ROOT_SELECTOR) ??
      containerEl ??
      el.closest<HTMLElement>(VIEW_ROOT_SELECTOR) ??
      el;
    const existing = this.roots.get(root);
    if (existing) {
      return existing;
    }
    this.sequence += 1;
    const view = new PreviewView(`view-${this.sequence}`, root, this.deps);
    this.roots.set(root, view);
    this.live.push(view);
    return view;
  }

  process(el: HTMLElement, containerEl?: HTMLElement): void {
    this.resolve(el, containerEl).process(el);
  }

  refreshAll(): void {
    for (const view of this.live) {
      view.refresh();
    }
  }

  teardownAll(restore: boolean): void {
    for (const view of this.live) {
      view.teardown(restore);
    }
    this.live.length = 0;
    this.roots = new WeakMap<Element, PreviewView>();
  }

  get views(): readonly PreviewView[] {
    return this.live;
  }

  /**
   * Deferred on purpose: the reading view calls the post-processor for every section
   * of a pass before attaching any of them, so a synchronous prune would tear down the
   * blocks created moments earlier in the same pass. By the time this runs, the pass
   * has attached its sections and only genuinely closed leaves are left detached.
   */
  private schedulePrune(): void {
    if (this.pruneScheduled) {
      return;
    }
    this.pruneScheduled = true;
    queueMicrotask(() => {
      this.pruneScheduled = false;
      this.pruneClosedViews();
    });
  }

  /** A closed leaf must not leave its controllers (or its store) reachable. */
  private pruneClosedViews(): void {
    for (let index = this.live.length - 1; index >= 0; index -= 1) {
      const view = this.live[index];
      if (view.isDetached) {
        /* Restores the source block: a mis-pruned but still-alive section keeps its
         * content and can be decorated again on its next pass. The roots entry must
         * go too, or a later pass on the same element would resolve to this dead
         * view — no longer in `live`, it would miss refreshAll and the final
         * teardown. */
        this.roots.delete(view.rootEl);
        view.teardown(true);
        this.live.splice(index, 1);
      }
    }
  }
}
