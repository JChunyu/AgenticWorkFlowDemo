import { App, Plugin, PluginSettingTab, Setting, type SettingDefinitionItem } from 'obsidian';
import { t, type Lang } from '../core/i18n';
import { log } from '../core/log';
import {
  DEFAULT_LOCAL_STATE,
  DEFAULT_SETTINGS,
  normalizeLocalState,
  normalizeSettings,
  SETTINGS_ORDER,
  type LocalState,
  type Settings,
} from '../core/settings';

/**
 * The only place `loadData` / `saveData` are called (AD-7). Everything else
 * receives an immutable snapshot.
 */
export class SettingsStore {
  private settings: Settings = DEFAULT_SETTINGS;
  private local: LocalState = DEFAULT_LOCAL_STATE;
  private readonly plugin: Plugin;

  /** Fired after every successful write so open notes can react immediately. */
  onChange: (() => void) | null = null;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async load(): Promise<void> {
    const raw = (await this.plugin.loadData()) as Record<string, unknown> | null;
    const record = raw ?? {};
    /* Legacy files kept the four keys at the top level; unknown keys are ignored. */
    const settingsSource = record.settings ?? record;
    this.settings = normalizeSettings(settingsSource);
    this.local = normalizeLocalState(record.localState);
  }

  get snapshot(): Settings {
    return this.settings;
  }

  get localState(): LocalState {
    return this.local;
  }

  async update(patch: Partial<Settings>): Promise<void> {
    this.settings = { ...this.settings, ...patch };
    await this.persist();
    /* Even if the write failed the in-memory snapshot changed, so open notes must follow. */
    this.onChange?.();
  }

  async updateLocal(patch: Partial<LocalState>): Promise<void> {
    this.local = { ...this.local, ...patch };
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      await this.plugin.saveData({ settings: this.settings, localState: this.local });
    } catch (error) {
      log.error('settings could not be saved', error);
    }
  }
}

export interface SettingsTabDeps {
  readonly store: SettingsStore;
  readonly lang: () => Lang;
  readonly onCopyCard: () => void;
}

/**
 * Four preference rows in a fixed order, one title plus one explanation each, and the
 * "copy AI instructions" row above them. No headings, no separators, no advanced section.
 *
 * The rows are described twice on purpose: `getSettingDefinitions()` is what Obsidian
 * 1.13+ reads, which is also what makes the rows findable in settings search, while
 * `display()` stays as the fallback for 1.12 where a tab can only be painted by hand.
 */
export class H5SettingsTab extends PluginSettingTab {
  private readonly deps: SettingsTabDeps;

  constructor(app: App, plugin: Plugin, deps: SettingsTabDeps) {
    super(app, plugin);
    this.deps = deps;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const lang = this.deps.lang();
    return [
      {
        name: t('copy.action', lang),
        desc: t('settings.copyIntro', lang),
        action: () => this.deps.onCopyCard(),
      },
      {
        name: t('settings.enabled.name', lang),
        desc: t('settings.enabled.desc', lang),
        control: { type: 'toggle', key: 'enabled' },
      },
      {
        name: t('settings.defaultState.name', lang),
        desc: t('settings.defaultState.desc', lang),
        control: {
          type: 'dropdown',
          key: 'defaultState',
          options: {
            rendered: t('settings.state.rendered', lang),
            source: t('settings.state.source', lang),
          },
        },
      },
      {
        name: t('settings.showToggle.name', lang),
        desc: t('settings.showToggle.desc', lang),
        control: { type: 'toggle', key: 'showToggle' },
      },
      {
        name: t('settings.showErrorHints.name', lang),
        desc: t('settings.showErrorHints.desc', lang),
        control: { type: 'toggle', key: 'showErrorHints' },
      },
    ];
  }

  /** Reads through the store rather than `loadData`, so the tab never diverges. */
  getControlValue(key: string): unknown {
    const snapshot = this.deps.store.snapshot;
    switch (key) {
      case 'enabled':
        return snapshot.enabled;
      case 'defaultState':
        return snapshot.defaultState;
      case 'showToggle':
        return snapshot.showToggle;
      case 'showErrorHints':
        return snapshot.showErrorHints;
      default:
        return undefined;
    }
  }

  /** Writes through the store so `onChange` fires and open notes follow immediately. */
  async setControlValue(key: string, value: unknown): Promise<void> {
    switch (key) {
      case 'enabled':
        await this.deps.store.update({ enabled: value === true });
        return;
      case 'defaultState':
        await this.deps.store.update({ defaultState: value === 'source' ? 'source' : 'rendered' });
        return;
      case 'showToggle':
        await this.deps.store.update({ showToggle: value === true });
        return;
      case 'showErrorHints':
        await this.deps.store.update({ showErrorHints: value === true });
        return;
      default:
        return;
    }
  }

  display(): void {
    const { containerEl } = this;
    const lang = this.deps.lang();
    containerEl.empty();

    const intro = containerEl.createEl('p', { cls: 'h5r-settings-intro' });
    intro.createSpan({ text: `${t('settings.copyIntro', lang)} ` });
    const copyLink = intro.createEl('a', { text: t('copy.action', lang), href: '#' });
    copyLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.deps.onCopyCard();
    });

    const settings = this.deps.store.snapshot;
    const rows = containerEl.createDiv({ cls: 'h5r-settings-rows' });

    new Setting(rows)
      .setName(t('settings.enabled.name', lang))
      .setDesc(t('settings.enabled.desc', lang))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabled).onChange(async (value) => {
          await this.deps.store.update({ enabled: value });
        }),
      );

    new Setting(rows)
      .setName(t('settings.defaultState.name', lang))
      .setDesc(t('settings.defaultState.desc', lang))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('rendered', t('settings.state.rendered', lang))
          .addOption('source', t('settings.state.source', lang))
          .setValue(settings.defaultState)
          .onChange(async (value) => {
            await this.deps.store.update({ defaultState: value === 'source' ? 'source' : 'rendered' });
          }),
      );

    new Setting(rows)
      .setName(t('settings.showToggle.name', lang))
      .setDesc(t('settings.showToggle.desc', lang))
      .addToggle((toggle) =>
        toggle.setValue(settings.showToggle).onChange(async (value) => {
          await this.deps.store.update({ showToggle: value });
        }),
      );

    new Setting(rows)
      .setName(t('settings.showErrorHints.name', lang))
      .setDesc(t('settings.showErrorHints.desc', lang))
      .addToggle((toggle) =>
        toggle.setValue(settings.showErrorHints).onChange(async (value) => {
          await this.deps.store.update({ showErrorHints: value });
        }),
      );
  }
}

/** Exposed for tests: the fixed order the settings page must render. */
export const SETTINGS_ROW_ORDER = SETTINGS_ORDER;
