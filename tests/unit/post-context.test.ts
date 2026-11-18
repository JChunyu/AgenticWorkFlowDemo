import { beforeEach, describe, expect, it } from 'vitest';
import { OnboardingController } from '../../src/adapters/onboarding';
import { containerElOf } from '../../src/adapters/post-context';
import { SettingsStore } from '../../src/adapters/settings';
import { ViewRegistry } from '../../src/view';
import { codeBlock, readingPass, resetBody } from './helpers';

function makeStore(): InstanceType<typeof SettingsStore> {
  return new SettingsStore({ loadData: async () => null, saveData: async () => {} } as never);
}

/**
 * The reading view passes a post-processor ctx whose `containerEl` (the preview
 * root) is not declared in the obsidian typings. This whole pipeline is what a
 * typo in that property name would silently disable.
 */
describe('post-processor context containerEl', () => {
  beforeEach(() => {
    resetBody();
  });

  it('reads the runtime field the typings do not declare', () => {
    const root = document.createElement('div');

    expect(containerElOf({ containerEl: root })).toBe(root);
    expect(containerElOf({})).toBeUndefined();
    expect(containerElOf(undefined)).toBeUndefined();
  });

  it('one ctx containerEl per pass means one view and one prompt, not one per section', async () => {
    const store = makeStore();
    await store.load();
    const registry = new ViewRegistry({ settings: () => store.snapshot, lang: () => 'zh' });
    const onboarding = new OnboardingController({
      app: {} as never,
      lang: () => 'zh',
      store,
      onOpenSample: () => {},
      onCopyCard: () => {},
    });

    /* The reading view's own choreography: two sections post-processed while both
     * are still detached, with the shared sizer handed over as ctx.containerEl. */
    const { root, section: first } = readingPass(codeBlock('<p>a</p>', 'html'));
    const second = document.createElement('div');
    second.appendChild(codeBlock('<p>b</p>', 'html'));
    const sizer = root.querySelector<HTMLElement>('.markdown-preview-sizer') ?? root;
    const containerEl = containerElOf({ containerEl: sizer });

    registry.process(first, containerEl);
    onboarding.maybeRender(first, containerEl);
    registry.process(second, containerEl);
    onboarding.maybeRender(second, containerEl);

    expect(registry.views).toHaveLength(1);
    expect(root.querySelectorAll('.h5r-onboarding')).toHaveLength(1);
    expect(first.querySelector('.h5r-onboarding')).toBeNull();
    expect(second.querySelector('.h5r-onboarding')).toBeNull();
  });
});
