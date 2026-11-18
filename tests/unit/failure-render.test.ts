import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../../src/core/i18n';
import { DEFAULT_SETTINGS } from '../../src/core/settings';

vi.mock('../../src/pipeline/scrub', () => ({
  scrub: () => ({
    ok: true,
    value: {
      sanitized: true,
      contentHtml: '<p>fine</p>',
      styles: [],
      rootStyleSeed: '',
      removed: [],
    },
  }),
}));

vi.mock('../../src/pipeline/render', () => ({
  HOST_CLASS: 'h5r-rendered-host',
  render: () => {
    throw new Error('render exploded');
  },
}));

const { ViewRegistry } = await import('../../src/view');
const { codeBlock, noteView, resetBody } = await import('./helpers');

describe('render failure', () => {
  beforeEach(() => {
    resetBody();
  });

  it('discards the shadow host entirely and shows the source plus one notice', () => {
    const view = noteView(codeBlock('<p>x</p>'));

    new ViewRegistry({ settings: () => DEFAULT_SETTINGS, lang: () => 'zh' }).process(view);

    expect(view.querySelector('.h5r-rendered-host')).toBeNull();
    const wrapper = view.querySelector('.h5r-block');
    expect(wrapper?.classList.contains('h5r-block--failed')).toBe(true);
    /* No card to print, so the print rules keep the source visible for this block. */
    expect(wrapper?.classList.contains('h5r-block--hostless')).toBe(true);
    expect(view.querySelector('.h5r-notice__text')?.textContent).toBe(t('notice.renderFailed', 'zh'));
    expect(view.querySelectorAll('.h5r-notice')).toHaveLength(1);
  });

  it('never surfaces a stack trace in the interface', () => {
    const view = noteView(codeBlock('<p>x</p>'));

    new ViewRegistry({ settings: () => DEFAULT_SETTINGS, lang: () => 'zh' }).process(view);

    expect(view.textContent ?? '').not.toContain('render exploded');
  });
});
