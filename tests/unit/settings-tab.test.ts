import { beforeEach, describe, expect, it, vi } from 'vitest';
import { H5SettingsTab, SettingsStore } from '../../src/adapters/settings';
import { SETTINGS_ORDER } from '../../src/core/settings';

/**
 * Obsidian 1.13+ reads `getSettingDefinitions()` and writes back through
 * `getControlValue` / `setControlValue`, while 1.12 uses `display()`. The two
 * write paths must agree, or the settings search UI silently persists the wrong
 * value while the old tab keeps working.
 */
describe('H5SettingsTab search hooks', () => {
  function makeTab(): { store: InstanceType<typeof SettingsStore>; tab: InstanceType<typeof H5SettingsTab> } {
    const store = new SettingsStore({ loadData: async () => null, saveData: async () => {} } as never);
    const tab = new H5SettingsTab({} as never, {} as never, {
      store,
      lang: () => 'zh',
      onCopyCard: () => {},
    });
    return { store, tab };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('describes every setting in the canonical order, plus the copy action', () => {
    const { tab } = makeTab();

    const defs = tab.getSettingDefinitions();
    const keys = defs
      .map((def) => ('control' in def && def.control ? def.control.key : null))
      .filter((key): key is string => key !== null);

    expect(keys).toEqual(SETTINGS_ORDER);
    /* The first row is the copy action: a name and a description, no control. */
    const first = defs[0];
    expect('control' in first && first.control).toBeFalsy();
    expect('name' in first && typeof first.name).toBe('string');
  });

  it('reads control values through the store snapshot', async () => {
    const { store, tab } = makeTab();
    await store.load();
    await store.update({ enabled: false });

    expect(tab.getControlValue('enabled')).toBe(false);
    expect(tab.getControlValue('defaultState')).toBe(store.snapshot.defaultState);
    expect(tab.getControlValue('showToggle')).toBe(store.snapshot.showToggle);
    expect(tab.getControlValue('showErrorHints')).toBe(store.snapshot.showErrorHints);
    expect(tab.getControlValue('nope')).toBeUndefined();
  });

  it('writes control values through the store, normalizing defaultState', async () => {
    const { store, tab } = makeTab();
    await store.load();
    let changed = 0;
    store.onChange = () => {
      changed += 1;
    };

    await tab.setControlValue('defaultState', 'source');
    expect(store.snapshot.defaultState).toBe('source');

    /* Anything that is not exactly 'source' collapses to 'rendered', like display(). */
    await tab.setControlValue('defaultState', 'rendered');
    expect(store.snapshot.defaultState).toBe('rendered');
    await tab.setControlValue('defaultState', 'bogus');
    expect(store.snapshot.defaultState).toBe('rendered');

    await tab.setControlValue('enabled', true);
    expect(store.snapshot.enabled).toBe(true);
    await tab.setControlValue('showToggle', false);
    expect(store.snapshot.showToggle).toBe(false);
    await tab.setControlValue('showErrorHints', 'not-a-bool');
    expect(store.snapshot.showErrorHints).toBe(false);

    /* Every write went through the store, so onChange fired and open notes follow. */
    expect(changed).toBe(6);

    /* Unknown keys are a no-op, not a throw. */
    await tab.setControlValue('nope', 'x');
    expect(changed).toBe(6);
  });
});
