import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../../src/core/i18n';
import { DEFAULT_SETTINGS } from '../../src/core/settings';

vi.mock('../../src/pipeline/scrub', () => ({
  scrub: () => ({ ok: false, error: { code: 'parse-failed', detail: 'boom' } }),
}));

const { ViewRegistry } = await import('../../src/view');
const { codeBlock, noteView, resetBody } = await import('./helpers');

function newView() {
  return new ViewRegistry({ settings: () => DEFAULT_SETTINGS, lang: () => 'zh' });
}

describe('parse failure', () => {
  beforeEach(() => {
    resetBody();
  });

  it('degrades the failing block to source with one assertive notice', () => {
    const view = noteView(codeBlock('<p>broken</p>'));
    newView().process(view);

    const block = view.querySelector('.h5r-block');
    expect(block?.classList.contains('h5r-block--failed')).toBe(true);

    const notices = view.querySelectorAll('.h5r-notice');
    expect(notices).toHaveLength(1);
    expect(notices[0].getAttribute('aria-live')).toBe('assertive');
    expect(notices[0].querySelector('.h5r-notice__text')?.textContent).toBe(t('notice.parseFailed', 'zh'));
    expect(view.querySelector('.h5r-rendered-host')).toBeNull();
  });

  it('leaves neighbouring blocks untouche', () => {
    const view = noteView(codeBlock('<p>one</p>'), codeBlock('<p>two</p>'));

    newView().process(view);

    expect(view.querySelectorAll('.h5r-block')).toHaveLength(2);
  });

  it('shows one notice per block and offers the source as the next step', () => {
    const view = noteView(codeBlock('<p>broken</p>'));
    newView().process(view);

    const action = view.querySelector<HTMLButtonElement>('.h5r-notice__action');
    expect(action?.textContent).toBe(t('notice.viewSource', 'zh'));
    action?.click();

    expect(view.querySelector('.h5r-block')?.classList.contains('h5r-block--source')).toBe(true);
    expect(view.querySelectorAll('.h5r-notice')).toHaveLength(0);
  });

  it('says nothing when error hints are switched off', () => {
    const view = noteView(codeBlock('<p>broken</p>'));
    new ViewRegistry({
      settings: () => ({ ...DEFAULT_SETTINGS, showErrorHints: false }),
      lang: () => 'zh',
    }).process(view);

    expect(view.querySelectorAll('.h5r-notice')).toHaveLength(0);
    expect(view.querySelector('.h5r-block')?.classList.contains('h5r-block--failed')).toBe(true);
  });
});
