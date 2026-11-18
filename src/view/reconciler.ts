import type { BlockDescriptor } from '../core/contracts';
import { t, type Lang } from '../core/i18n';
import { log } from '../core/log';
import { HARD_BUDGET_MS, SOFT_BUDGET_MS, type Settings } from '../core/settings';
import { BLOCK_WRAPPER_CLASS } from '../pipeline/detect';
import { render } from '../pipeline/render';
import { scrub } from '../pipeline/scrub';
import { createNotice, createToggle } from './shell';
import type { BlockRecord, BlockState, ViewStore } from './store';

/** Class marking the untouched Obsidian `<pre>` once it lives inside our wrapper. */
export const SOURCE_CLASS = 'h5r-source';

export interface ReconcilerDeps {
  readonly store: ViewStore;
  readonly settings: () => Settings;
  readonly lang: () => Lang;
  readonly now: () => number;
}

type ContentOutcome = { kind: 'rendered' } | { kind: 'degraded' } | { kind: 'failed'; text: string };

/**
 * Owns exactly one block: it sequences detect → scrub → render (AD-1), measures the
 * render against the two budgets (AD-13), and creates every shell control (AD-14).
 */
export class BlockController {
  private readonly desc: BlockDescriptor;
  private readonly deps: ReconcilerDeps;
  private wrapper: HTMLElement | null = null;
  private shadowHost: HTMLElement | null = null;
  private record: BlockRecord;
  private removedCount = 0;
  private mounted = false;

  constructor(desc: BlockDescriptor, deps: ReconcilerDeps) {
    this.desc = desc;
    this.deps = deps;
    const settings = deps.settings();
    this.record = deps.store.ensure(desc.id, settings.defaultState === 'source' ? 'source' : 'rendered');
  }

  get blockId(): string {
    return this.desc.id;
  }

  get sourceEl(): HTMLElement {
    return this.desc.preEl;
  }

  get state(): BlockState {
    return this.record.state;
  }

  get isMounted(): boolean {
    return this.mounted;
  }

  /**
   * True once the block's wrapper has been wiped out from under us — Obsidian empties
   * a section before re-rendering it. A merely detached wrapper (the reading view's
   * virtual scrolling detaches whole sections on scroll) is NOT orphaned: the card
   * must survive that and come back with its section.
   */
  get isOrphaned(): boolean {
    return this.wrapper !== null && this.wrapper.parentElement === null;
  }

  /** Wraps the native block and paints the first frame. Never runs while disabled. */
  mount(): void {
    if (!this.deps.settings().enabled) {
      return;
    }
    const pre = this.desc.preEl;
    const parent = pre.parentElement;
    if (!parent) {
      return;
    }
    /* Re-processing an already wrapped block must not create a second host. */
    const existingWrapper = parent.classList.contains(BLOCK_WRAPPER_CLASS)
      ? parent
      : createDiv({ cls: BLOCK_WRAPPER_CLASS });
    if (existingWrapper !== parent) {
      parent.insertBefore(existingWrapper, pre);
      existingWrapper.appendChild(pre);
    }
    const wrapper = existingWrapper;
    pre.classList.add(SOURCE_CLASS);
    this.wrapper = wrapper;
    this.mounted = true;
    this.apply(false);
  }

  /**
   * Re-derives the frame from the store. `force` bypasses the budget once;
   * `sourceOnly` shows the source without re-running the pipeline, which is how a
   * failed block stops failing over and over.
   */
  apply(force: boolean, sourceOnly = false): void {
    if (!this.wrapper) {
      return;
    }
    const settings = this.deps.settings();
    const lang = this.deps.lang();

    this.clearHost();
    this.clearChrome();
    this.removedCount = 0;

    if (sourceOnly) {
      this.record = this.deps.store.patch(this.desc.id, { state: 'source' });
      this.setFrameState('source');
      this.paintToggle('rendered');
      return;
    }

    if (this.desc.sourceText.trim().length === 0) {
      this.record = this.deps.store.patch(this.desc.id, { state: 'empty' });
      this.setFrameState('empty');
      this.paintNotice('info', t('block.empty', lang), undefined, undefined);
      return;
    }

    const outcome = this.produceContent(force);

    if (outcome.kind === 'failed') {
      this.record = this.deps.store.patch(this.desc.id, { state: 'failed' });
      this.setFrameState('failed');
      if (settings.showErrorHints) {
        this.paintNotice('danger', outcome.text, t('notice.viewSource', lang), () => {
          this.apply(false, true);
        });
      }
      return;
    }

    if (outcome.kind === 'degraded') {
      this.record = this.deps.store.patch(this.desc.id, { state: 'degraded' });
      this.setFrameState('degraded');
      this.paintToggle('rendered');
      if (settings.showErrorHints) {
        this.paintNotice('warning', t('notice.degraded', lang), t('toggle.toPreview', lang), () => {
          this.record = this.deps.store.patch(this.desc.id, { state: 'rendered' });
          this.apply(true);
        });
      }
      return;
    }

    const state: BlockState = this.record.state === 'source' ? 'source' : 'rendered';
    this.record = this.deps.store.patch(this.desc.id, { state });
    this.setFrameState(state);
    this.paintToggle(state === 'rendered' ? 'source' : 'rendered');

    if (state === 'rendered' && this.removedCount > 0 && settings.showErrorHints && !this.record.warningDismissed) {
      this.paintNotice('warning', t('notice.removed', lang), t('notice.dismiss', lang), () => this.dismissWarning());
    }
  }

  /** Theme or settings changed: rebuild from the store without bypassing the budget. */
  refresh(): void {
    this.apply(false);
  }

  /** Removes the host and restores the native block. */
  destroy(restore: boolean): void {
    this.clearHost();
    this.clearChrome();
    this.mounted = false;
    const wrapper = this.wrapper;
    this.wrapper = null;
    if (!wrapper) {
      return;
    }
    if (restore) {
      const pre = this.desc.preEl;
      pre.classList.remove(SOURCE_CLASS);
      const parent = wrapper.parentElement;
      if (parent) {
        parent.insertBefore(pre, wrapper);
      }
    }
    wrapper.remove();
  }

  private produceContent(force: boolean): ContentOutcome {
    const lang = this.deps.lang();
    const scrubbed = scrub(this.desc.sourceText);
    if (!scrubbed.ok) {
      log.warn('scrub failed', scrubbed.error);
      return { kind: 'failed', text: t('notice.parseFailed', lang) };
    }

    this.removedCount = scrubbed.value.removed.length;

    /* A block the user is inspecting as source still needs a live host for print/PDF. */
    const budgetBypass = force || this.record.state === 'source';

    if (this.record.overBudget && !budgetBypass) {
      return { kind: 'degraded' };
    }

    const started = this.deps.now();

    let hostElement: HTMLElement;
    try {
      hostElement = render(scrubbed.value).element;
    } catch (error) {
      log.error('render failed', error);
      return { kind: 'failed', text: t('notice.renderFailed', lang) };
    }

    const elapsed = this.deps.now() - started;

    if (elapsed > HARD_BUDGET_MS && !budgetBypass) {
      this.record = this.deps.store.patch(this.desc.id, { overBudget: true });
      return { kind: 'degraded' };
    }

    if (elapsed > SOFT_BUDGET_MS) {
      this.record = this.deps.store.patch(this.desc.id, { overBudget: true });
    } else if (force) {
      this.record = this.deps.store.patch(this.desc.id, { overBudget: false });
    }

    this.shadowHost = hostElement;
    this.wrapper?.insertBefore(hostElement, this.wrapper.firstChild);
    return { kind: 'rendered' };
  }

  private clearHost(): void {
    if (!this.shadowHost) {
      return;
    }
    this.shadowHost.remove();
    this.shadowHost = null;
  }

  private clearChrome(): void {
    const wrapper = this.wrapper;
    if (!wrapper) {
      return;
    }
    for (const child of Array.from(wrapper.children)) {
      if (child.classList.contains('h5r-toggle') || child.classList.contains('h5r-notice')) {
        child.remove();
      }
    }
  }

  private setFrameState(state: BlockState): void {
    if (!this.wrapper) {
      return;
    }
    /*
     * `--hostless` marks a block with no card to print: a source view of a block that
     * could not render. The print rules need that distinction in CSS, and asking the
     * selector engine with `:has()` would invalidate far too much to answer it.
     */
    const hostless = this.shadowHost === null ? ` ${BLOCK_WRAPPER_CLASS}--hostless` : '';
    this.wrapper.className = `${BLOCK_WRAPPER_CLASS} ${BLOCK_WRAPPER_CLASS}--${state}${hostless}`;
  }

  private paintToggle(next: 'source' | 'rendered'): void {
    if (!this.wrapper || !this.deps.settings().showToggle) {
      return;
    }
    const button = createToggle({
      lang: this.deps.lang(),
      next,
      onActivate: () => {
        const target = this.record.state === 'rendered' ? 'source' : 'rendered';
        this.record = this.deps.store.patch(this.desc.id, { state: target });
        this.apply(true);
      },
    });
    this.wrapper.insertBefore(button, this.wrapper.firstChild);
  }

  private paintNotice(
    kind: 'info' | 'warning' | 'danger',
    text: string,
    actionLabel: string | undefined,
    onAction: (() => void) | undefined,
  ): void {
    if (!this.wrapper) {
      return;
    }
    /* Escape closes a focused notice without moving the reading position. */
    const onDismiss =
      kind === 'danger'
        ? onAction
        : kind === 'warning'
          ? () => this.dismissWarning()
          : undefined;

    const notice = createNotice({
      kind,
      text,
      lang: this.deps.lang(),
      action: actionLabel && onAction ? { label: actionLabel, onActivate: onAction } : undefined,
      onDismiss,
    });
    this.wrapper.insertBefore(notice, this.wrapper.firstChild);
  }

  private dismissWarning(): void {
    this.record = this.deps.store.patch(this.desc.id, { warningDismissed: true });
    this.clearChrome();
    this.paintToggle(this.record.state === 'rendered' ? 'source' : 'rendered');
  }
}
