import type { Lang } from '../core/i18n';
import type { Settings } from '../core/settings';
import { collect } from '../pipeline/detect';
import { BlockController, type ReconcilerDeps } from './reconciler';
import { ViewStore } from './store';

const VIEW_ROOT_SELECTOR = '.markdown-preview-view, .markdown-reading-view, .markdown-rendered';

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

  constructor(viewId: string, deps: ViewDeps) {
    this.store = new ViewStore(viewId);
    this.deps = deps;
  }

  get blockCount(): number {
    return this.controllers.size;
  }

  /** True when every block this view owned has left the document. */
  get isDetached(): boolean {
    for (const preEl of this.controllers.keys()) {
      if (preEl.isConnected) {
        return false;
      }
    }
    return this.controllers.size > 0;
  }

  process(el: HTMLElement): void {
    if (!this.deps.settings().enabled) {
      return;
    }

    this.sweepDetached();
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
    this.sweepDetached();
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

  private sweepDetached(): void {
    for (const [preEl, controller] of Array.from(this.controllers)) {
      if (!preEl.isConnected) {
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

  constructor(deps: ViewDeps) {
    this.deps = deps;
  }

  resolve(el: HTMLElement): PreviewView {
    this.pruneClosedViews();
    const root = el.closest(VIEW_ROOT_SELECTOR) ?? el;
    const existing = this.roots.get(root);
    if (existing) {
      return existing;
    }
    this.sequence += 1;
    const view = new PreviewView(`view-${this.sequence}`, this.deps);
    this.roots.set(root, view);
    this.live.push(view);
    return view;
  }

  process(el: HTMLElement): void {
    this.resolve(el).process(el);
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

  /** A closed leaf must not leave its controllers (or its store) reachable. */
  private pruneClosedViews(): void {
    for (let index = this.live.length - 1; index >= 0; index -= 1) {
      const view = this.live[index];
      if (view.isDetached) {
        view.teardown(false);
        this.live.splice(index, 1);
      }
    }
  }
}
