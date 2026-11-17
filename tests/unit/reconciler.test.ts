import { beforeEach, describe, expect, it } from 'vitest';
import { t } from '../../src/core/i18n';
import { DEFAULT_SETTINGS, type Settings } from '../../src/core/settings';
import { ViewRegistry } from '../../src/view';
import { codeBlock, noteView, resetBody, sequenceNow } from './helpers';

function registry(settings: Settings = DEFAULT_SETTINGS, now?: () => number): ViewRegistry {
  return new ViewRegistry({ settings: () => settings, lang: () => 'zh', now });
}

function blockOf(view: HTMLElement): HTMLElement | null {
  return view.querySelector<HTMLElement>('.h5r-block');
}

describe('block orchestration', () => {
  beforeEach(() => {
    resetBody();
  });

  it('renders a sentinel block inside a shadow root and hides the code text', () => {
    const view = noteView(codeBlock('<p>Hello</p>'));
    registry().process(view);

    const block = blockOf(view);
    expect(block).not.toBeNull();
    expect(block?.classList.contains('h5r-block--rendered')).toBe(true);

    const host = block?.querySelector<HTMLElement>('.h5r-rendered-host');
    expect(host?.shadowRoot?.querySelector('p')?.textContent).toBe('Hello');
    expect(document.querySelector('p')).toBeNull();
    expect(view.querySelectorAll('.h5r-rendered-host')).toHaveLength(1);
  });

  it('flips between source and rendered without touching the store of another pane', () => {
    const first = noteView(codeBlock('<p>same</p>'));
    const second = noteView(codeBlock('<p>same</p>'));
    const views = registry();
    views.process(first);
    views.process(second);

    const toggle = first.querySelector<HTMLButtonElement>('.h5r-toggle');
    expect(toggle?.textContent).toBe(t('toggle.toSource', 'zh'));
    expect(toggle?.getAttribute('aria-label')).toBe(t('toggle.aria.toSource', 'zh'));
    toggle?.click();

    expect(blockOf(first)?.classList.contains('h5r-block--source')).toBe(true);
    expect(first.querySelector('.h5r-toggle')?.textContent).toBe(t('toggle.toPreview', 'zh'));
    expect(blockOf(second)?.classList.contains('h5r-block--rendered')).toBe(true);

    first.querySelector<HTMLButtonElement>('.h5r-toggle')?.click();
    expect(blockOf(first)?.classList.contains('h5r-block--rendered')).toBe(true);
  });

  it('does not toggle when the block content itself is clicked', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    registry().process(view);

    blockOf(view)?.querySelector<HTMLElement>('.h5r-rendered-host')?.click();

    expect(blockOf(view)?.classList.contains('h5r-block--rendered')).toBe(true);
  });

  it('shows a placeholder for an empty block and never an empty render area', () => {
    const view = noteView(codeBlock('   '));
    registry().process(view);

    const block = blockOf(view);
    expect(block?.classList.contains('h5r-block--empty')).toBe(true);
    expect(block?.querySelector('.h5r-rendered-host')).toBeNull();
    expect(block?.querySelector('.h5r-notice__text')?.textContent).toBe(t('block.empty', 'zh'));
  });

  it('reports removed scripts with exactly one dismissible warning', () => {
    const view = noteView(codeBlock('<div>ok</div><script>alert(1)</script>'));
    registry().process(view);

    const notices = view.querySelectorAll('.h5r-notice');
    expect(notices).toHaveLength(1);
    expect(notices[0].getAttribute('role')).toBe('status');
    expect(notices[0].getAttribute('aria-live')).toBe('polite');
    expect(notices[0].querySelector('.h5r-notice__text')?.textContent).toBe(t('notice.removed', 'zh'));
    expect(blockOf(view)?.querySelector('.h5r-rendered-host')).not.toBeNull();

    notices[0].querySelector<HTMLButtonElement>('.h5r-notice__action')?.click();

    expect(view.querySelectorAll('.h5r-notice')).toHaveLength(0);
  });

  it('stays silent about removed content when error hints are off', () => {
    const view = noteView(codeBlock('<div>ok</div><script>alert(1)</script>'));
    registry({ ...DEFAULT_SETTINGS, showErrorHints: false }).process(view);

    expect(view.querySelectorAll('.h5r-notice')).toHaveLength(0);
  });

  it('renders nothing at all while rendering is disabled', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    registry({ ...DEFAULT_SETTINGS, enabled: false }).process(view);

    expect(view.querySelector('.h5r-block')).toBeNull();
    expect(view.querySelector('.h5r-toggle')).toBeNull();
    expect(view.querySelector('.h5r-notice')).toBeNull();
    expect(view.querySelector('.h5r-rendered-host')).toBeNull();
  });

  it('honours the source default for new blocks and keeps a host for print', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    registry({ ...DEFAULT_SETTINGS, defaultState: 'source' }).process(view);

    expect(blockOf(view)?.classList.contains('h5r-block--source')).toBe(true);
    expect(view.querySelector('.h5r-toggle')?.textContent).toBe(t('toggle.toPreview', 'zh'));

    /* Print and PDF force the rendered state, so the host must exist even in source. */
    const host = blockOf(view)?.querySelector<HTMLElement>('.h5r-rendered-host');
    expect(host?.shadowRoot?.querySelector('p')?.textContent).toBe('x');
  });

  it('keeps the render host after flipping a rendered block to source', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    registry().process(view);

    view.querySelector<HTMLButtonElement>('.h5r-toggle')?.click();

    expect(blockOf(view)?.classList.contains('h5r-block--source')).toBe(true);
    expect(blockOf(view)?.querySelector('.h5r-rendered-host')).not.toBeNull();
  });

  it('hides the toggle when the setting says so and still renders the card', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    registry({ ...DEFAULT_SETTINGS, showToggle: false }).process(view);

    expect(view.querySelector('.h5r-toggle')).toBeNull();
    expect(blockOf(view)?.classList.contains('h5r-block--rendered')).toBe(true);
    expect(blockOf(view)?.querySelector('.h5r-rendered-host')).not.toBeNull();
  });

  it('degrades on the render that follows a soft budget overrun', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    const views = registry(DEFAULT_SETTINGS, sequenceNow([0, 60, 0, 1]));
    views.process(view);

    expect(blockOf(view)?.classList.contains('h5r-block--rendered')).toBe(true);

    views.refreshAll();

    expect(blockOf(view)?.classList.contains('h5r-block--degraded')).toBe(true);
  });

  it('degrades immediately past the hard budget and renders again when forced', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    const views = registry(DEFAULT_SETTINGS, sequenceNow([0, 700, 0, 1]));
    views.process(view);

    expect(blockOf(view)?.classList.contains('h5r-block--degraded')).toBe(true);
    expect(view.querySelector('.h5r-notice__text')?.textContent).toBe(t('notice.degraded', 'zh'));

    view.querySelector<HTMLButtonElement>('.h5r-toggle')?.click();

    expect(blockOf(view)?.classList.contains('h5r-block--rendered')).toBe(true);
  });

  it('restores the native block when torn down', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    const views = registry();
    views.process(view);
    expect(blockOf(view)).not.toBeNull();

    views.teardownAll(true);

    expect(blockOf(view)).toBeNull();
    expect(view.querySelector('pre > code')?.textContent).toBe('<p>x</p>');
  });

  it('never introduces a positive tabindex or a focus trap', () => {
    const view = noteView(codeBlock('<html><body onload="x()"></body></html>'));
    registry().process(view);

    const nodes = Array.from(view.querySelectorAll('[tabindex]'));
    for (const node of nodes) {
      expect(Number(node.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    }
  });

  it('closes a focused notice with Escape without stealing focus', () => {
    const view = noteView(codeBlock('<div>ok</div><script>alert(1)</script>'));
    registry().process(view);

    const notice = view.querySelector<HTMLElement>('.h5r-notice');
    expect(notice?.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).not.toBe(notice);

    notice?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(view.querySelectorAll('.h5r-notice')).toHaveLength(0);
  });

  it('keeps no block state on the DOM', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    registry().process(view);
    const block = blockOf(view);

    expect(block?.hasAttribute('data-state')).toBe(false);
    expect(JSON.stringify(block?.dataset ?? {})).toBe('{}');
    expect(block?.getAttribute('aria-pressed')).toBeNull();
  });
});
